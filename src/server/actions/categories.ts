"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import {
  categoryIdSchema,
  createCategorySchema,
  slugifyCategoryName,
  updateCategorySchema,
} from "@/lib/validators/category";
import {
  DEMO_CATEGORIES,
  demoLinks,
  recomputeDemoCategoryCounts,
} from "@/server/demo-data";
import { requireUser } from "@/server/users";
import type { ActionResult, Category } from "@/types";

/**
 * Category CRUD server actions.
 *
 * Same contract as the link actions: Zod → session user → per-user rate limit
 * → owner-scoped writes → `revalidatePath("/", "layout")`.
 *
 * Deleting a category never deletes links: the `onDelete: SetNull` relation
 * leaves them uncategorized (demo mode mirrors that by clearing the ids).
 */

const prisma = getPrisma();

let demoCategorySeq = 0;

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

/** `name`, `name-2`, `name-3` … until the slug is free for this user. */
function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<Category>> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid category");
  }
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;

  const name = parsed.data.name;
  const icon = parsed.data.icon ?? "layout-grid";
  const color = parsed.data.color ?? "#64748B";
  const base = slugifyCategoryName(name);

  if (!prisma) {
    const slug = uniqueSlug(
      base,
      new Set(DEMO_CATEGORIES.map((c) => c.slug)),
    );
    const category: Category = {
      id: `cat-demo-${Date.now().toString(36)}-${(demoCategorySeq++).toString(36)}`,
      name,
      slug,
      icon,
      color,
      order: DEMO_CATEGORIES.length,
      linkCount: 0,
    };
    DEMO_CATEGORIES.push(category);
    revalidatePath("/", "layout");
    return ok(category);
  }

  const existing = await prisma.category.findMany({
    where: { userId: user.id },
    select: { slug: true, order: true },
  });
  const slug = uniqueSlug(base, new Set(existing.map((c) => c.slug)));
  const order = existing.reduce((max, c) => Math.max(max, c.order), -1) + 1;

  try {
    const row = await prisma.category.create({
      data: { userId: user.id, name, slug, icon, color, order },
    });
    revalidatePath("/", "layout");
    return ok({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      color: row.color,
      order: row.order,
      linkCount: 0,
    });
  } catch (err) {
    // Race with a concurrent create of the same slug.
    if ((err as { code?: string }).code === "P2002") {
      return fail("A category with a similar name already exists.", "DUPLICATE");
    }
    throw err;
  }
}

export async function updateCategoryAction(
  input: unknown,
): Promise<ActionResult<Category>> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid category");
  }
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;

  const { id, name, icon, color, order } = parsed.data;

  if (!prisma) {
    const category = DEMO_CATEGORIES.find((c) => c.id === id);
    if (!category) return fail("Category not found.", "NOT_FOUND");
    if (name !== undefined) {
      const slug = slugifyCategoryName(name);
      const clash = DEMO_CATEGORIES.some(
        (c) => c.id !== id && c.slug === slug,
      );
      if (clash) {
        return fail("Another category already uses that name.", "DUPLICATE");
      }
      category.name = name;
      category.slug = slug;
    }
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (order !== undefined) category.order = order;
    revalidatePath("/", "layout");
    return ok(category);
  }

  const data: {
    name?: string;
    slug?: string;
    icon?: string;
    color?: string;
    order?: number;
  } = {};
  if (name !== undefined) {
    const slug = slugifyCategoryName(name);
    const clash = await prisma.category.findFirst({
      where: { userId: user.id, slug, id: { not: id } },
      select: { id: true },
    });
    if (clash) {
      return fail("Another category already uses that name.", "DUPLICATE");
    }
    data.name = name;
    data.slug = slug;
  }
  if (icon !== undefined) data.icon = icon;
  if (color !== undefined) data.color = color;
  if (order !== undefined) data.order = order;

  const result = await prisma.category.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (result.count === 0) return fail("Category not found.", "NOT_FOUND");

  const [row, linkCount] = await Promise.all([
    prisma.category.findFirst({ where: { id, userId: user.id } }),
    prisma.link.count({ where: { userId: user.id, deletedAt: null, categoryId: id } }),
  ]);
  if (!row) return fail("Category not found.", "NOT_FOUND");

  revalidatePath("/", "layout");
  return ok({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    color: row.color,
    order: row.order,
    linkCount,
  });
}

export async function deleteCategoryAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categoryIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid category.");
  const user = await requireUser();
  const limited = guardWrites(user.id);
  if (limited) return limited;
  const { id } = parsed.data;

  if (!prisma) {
    const index = DEMO_CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) return fail("Category not found.", "NOT_FOUND");
    DEMO_CATEGORIES.splice(index, 1);
    // Mirrors the DB's `onDelete: SetNull` — links survive, uncategorized.
    for (const link of demoLinks) {
      if (link.categoryId === id) {
        link.categoryId = "";
        link.category = null;
      }
    }
    recomputeDemoCategoryCounts();
    revalidatePath("/", "layout");
    return ok({ id });
  }

  const result = await prisma.category.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return fail("Category not found.", "NOT_FOUND");
  revalidatePath("/", "layout");
  return ok({ id });
}
