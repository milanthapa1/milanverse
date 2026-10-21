"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { coerceUrl, normalizeUrl } from "@/lib/url";
import {
  createLinkSchema,
  linkIdSchema,
  updateLinkSchema,
} from "@/lib/validators/link";
import { categoryExists } from "@/server/categories";
import {
  demoCreateLink,
  demoLinks,
  demoPurgeLink,
  demoSetDeleted,
  demoTrackOpen,
  demoUpdateLink,
} from "@/server/demo-data";
import { getLinkById } from "@/server/links";
import { getCurrentUser, requireUser } from "@/server/users";
import type { ActionResult, LinkItem } from "@/types";

/**
 * Link CRUD server actions.
 *
 * Contract shared by every action:
 *  1. Zod-validate the raw input (never trust the client payload)
 *  2. Resolve the session user (`requireUser` redirects signed-out callers)
 *  3. Per-user write rate limit
 *  4. Mutations scoped by `{ id, userId }` via updateMany/deleteMany + row
 *     count — ownership is enforced in the WHERE clause itself, so a forged
 *     id can never touch another account's rows
 *  5. `revalidatePath("/", "layout")` so sidebar counts / stats refresh
 *
 * Demo mode (no DATABASE_URL) mutates the in-memory store in `demo-data.ts`,
 * keeping the whole UI interactive without infrastructure.
 */

const prisma = getPrisma();

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

function guardWrites(userId: string): ActionResult<never> | null {
  const rl = rateLimit(`writes:${userId}`, RATE_LIMITS.writes);
  return rl.success
    ? null
    : fail("Too many changes — please slow down for a moment.", "RATE_LIMITED");
}

/** Lowercased, trimmed, de-duplicated, capped at 10 (matches Zod limits). */
function normalizeTagNames(tags: string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of tags) {
    const name = raw.trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names.slice(0, 10);
}

/**
 * Replace a link's tag set: ensure each Tag row exists for the user
 * (upsert on the `userId_name` unique index), then swap the LinkTag rows.
 * Returns the normalized names actually stored.
 */
async function syncTags(
  userId: string,
  linkId: string,
  tags: string[],
): Promise<string[]> {
  const names = normalizeTagNames(tags);
  if (!prisma) return names;
  const tagIds: string[] = [];
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
    tagIds.push(tag.id);
  }
  await prisma.linkTag.deleteMany({ where: { linkId } });
  if (tagIds.length > 0) {
    await prisma.linkTag.createMany({
      data: tagIds.map((tagId) => ({ linkId, tagId })),
      skipDuplicates: true,
    });
  }
  return names;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createLinkAction(
  input: unknown,
): Promise<ActionResult<LinkItem>> {
  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid link data");
  }
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;

  const raw = parsed.data;
  const url = coerceUrl(raw.url);
  if (!url) return fail("Must be a valid http(s) URL", "INVALID_URL");
  const normalizedUrl = normalizeUrl(url);
  const tags = normalizeTagNames(raw.tags ?? []);

  if (raw.categoryId && !(await categoryExists(user.id, raw.categoryId))) {
    return fail("That category does not exist.", "UNKNOWN_CATEGORY");
  }

  // Duplicate detection mirrors the (userId, normalizedUrl) unique index:
  // an ACTIVE duplicate is a friendly error; a TRASHED one is restored and
  // refreshed with the newly entered details.
  const existing = prisma
    ? await prisma.link.findFirst({
        where: { userId: user.id, normalizedUrl },
        select: { id: true, deletedAt: true },
      })
    : (demoLinks.find((l) => l.normalizedUrl === normalizedUrl) ?? null);

  if (existing) {
    if (existing.deletedAt === null) {
      return fail(
        "This link is already in your collection.",
        "DUPLICATE",
      );
    }
    // Trashed duplicate: restore it and refresh its details.
    if (prisma) {
      const restored = await prisma.link.updateMany({
        where: { id: existing.id, userId: user.id },
        data: {
          deletedAt: null,
          title: raw.title,
          description: raw.description ?? null,
          thumbnail: raw.thumbnail ?? null,
          favicon: raw.favicon ?? null,
          siteName: raw.siteName ?? null,
          categoryId: raw.categoryId ?? null,
        },
      });
      if (restored.count === 0) return fail("Could not restore that link.", "NOT_FOUND");
    } else {
      const restored = demoUpdateLink(existing.id, {
        title: raw.title,
        description: raw.description ?? null,
        categoryId: raw.categoryId ?? null,
      });
      if (!restored) return fail("Could not restore that link.", "NOT_FOUND");
    }
    await syncTags(user.id, existing.id, tags);
    revalidatePath("/", "layout");
    const link = await getLinkById(user.id, existing.id);
    return link
      ? ok(link)
      : fail("Could not restore that link.", "NOT_FOUND");
  }

  if (!prisma) {
    const link = demoCreateLink({
      url,
      normalizedUrl,
      title: raw.title,
      description: raw.description ?? null,
      thumbnail: raw.thumbnail ?? null,
      favicon: raw.favicon ?? null,
      siteName: raw.siteName ?? null,
      categoryId: raw.categoryId ?? null,
      tags,
    });
    revalidatePath("/", "layout");
    return ok(link);
  }

  try {
    const created = await prisma.link.create({
      data: {
        userId: user.id,
        url,
        normalizedUrl,
        title: raw.title,
        description: raw.description ?? null,
        thumbnail: raw.thumbnail ?? null,
        favicon: raw.favicon ?? null,
        siteName: raw.siteName ?? null,
        categoryId: raw.categoryId ?? null,
      },
      select: { id: true },
    });
    await syncTags(user.id, created.id, tags);
    revalidatePath("/", "layout");
    const link = await getLinkById(user.id, created.id);
    return link ? ok(link) : fail("Link saved, but could not be re-read.");
  } catch (err) {
    // Race with a concurrent save of the same URL (unique index trip).
    if ((err as { code?: string }).code === "P2002") {
      return fail("This link is already in your collection.", "DUPLICATE");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateLinkAction(
  input: unknown,
): Promise<ActionResult<LinkItem>> {
  const parsed = updateLinkSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;

  const { id, title, description, categoryId, tags, isFavorite } = parsed.data;

  if (
    categoryId !== undefined &&
    categoryId !== null &&
    !(await categoryExists(user.id, categoryId))
  ) {
    return fail("That category does not exist.", "UNKNOWN_CATEGORY");
  }

  if (!prisma) {
    const link = demoUpdateLink(id, {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(isFavorite !== undefined ? { isFavorite } : {}),
      ...(tags !== undefined ? { tags: normalizeTagNames(tags) } : {}),
    });
    if (!link) return fail("Link not found.", "NOT_FOUND");
    revalidatePath("/", "layout");
    return ok(link);
  }

  const data: Prisma.LinkUncheckedUpdateManyInput = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description; // null clears
  if (categoryId !== undefined) data.categoryId = categoryId; // null un-categorizes
  if (isFavorite !== undefined) data.isFavorite = isFavorite;

  const result = await prisma.link.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (result.count === 0) return fail("Link not found.", "NOT_FOUND");
  if (tags !== undefined) await syncTags(user.id, id, tags);

  revalidatePath("/", "layout");
  const link = await getLinkById(user.id, id);
  return link ? ok(link) : fail("Link not found.", "NOT_FOUND");
}

export async function toggleFavoriteAction(
  input: unknown,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  const parsed = linkIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid link.");
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;
  const { id } = parsed.data;

  if (!prisma) {
    const link = demoLinks.find((l) => l.id === id);
    if (!link) return fail("Link not found.", "NOT_FOUND");
    const next = !link.isFavorite;
    demoUpdateLink(id, { isFavorite: next });
    revalidatePath("/", "layout");
    return ok({ isFavorite: next });
  }

  const link = await prisma.link.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { isFavorite: true },
  });
  if (!link) return fail("Link not found.", "NOT_FOUND");
  const next = !link.isFavorite;
  await prisma.link.updateMany({
    where: { id, userId: user.id },
    data: { isFavorite: next },
  });
  revalidatePath("/", "layout");
  return ok({ isFavorite: next });
}

// ---------------------------------------------------------------------------
// Delete / restore / purge (trash lifecycle)
// ---------------------------------------------------------------------------

export async function deleteLinkAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = linkIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid link.");
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;
  const { id } = parsed.data;

  if (!prisma) {
    if (!demoSetDeleted(id, new Date().toISOString())) {
      return fail("Link not found.", "NOT_FOUND");
    }
    revalidatePath("/", "layout");
    return ok({ id });
  }

  const result = await prisma.link.updateMany({
    where: { id, userId: user.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return fail("Link not found.", "NOT_FOUND");
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function restoreLinkAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = linkIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid link.");
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;
  const { id } = parsed.data;

  if (!prisma) {
    if (!demoSetDeleted(id, null)) return fail("Link not found.", "NOT_FOUND");
    revalidatePath("/", "layout");
    return ok({ id });
  }

  const result = await prisma.link.updateMany({
    where: { id, userId: user.id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (result.count === 0) return fail("Link not found.", "NOT_FOUND");
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function purgeLinkAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = linkIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid link.");
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;
  const { id } = parsed.data;

  if (!prisma) {
    if (!demoPurgeLink(id)) return fail("Link not found.", "NOT_FOUND");
    revalidatePath("/", "layout");
    return ok({ id });
  }

  const result = await prisma.link.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return fail("Link not found.", "NOT_FOUND");
  revalidatePath("/", "layout");
  return ok({ id });
}

// ---------------------------------------------------------------------------
// Open tracking (best-effort; fuels "Recently opened" + popularity)
// ---------------------------------------------------------------------------

export async function trackOpenAction(input: unknown): Promise<void> {
  const parsed = linkIdSchema.safeParse(input);
  if (!parsed.success) return;
  // Best-effort: a signed-out visitor opening a landing-page showcase link
  // must not be redirected anywhere — just skip tracking.
  const user = await getCurrentUser();
  if (!user) return;
  const { id } = parsed.data;

  if (!prisma) {
    demoTrackOpen(id);
    return;
  }
  await prisma.link.updateMany({
    where: { id, userId: user.id },
    data: { openCount: { increment: 1 }, lastOpenedAt: new Date() },
  });
}
