"use server";

import { revalidatePath } from "next/cache";
import {
  BookmarkParseError,
  folderToTag,
  parseBookmarksHtml,
} from "@/lib/bookmarks";
import { RATE_LIMITS } from "@/lib/constants";
import { getPrisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  coerceUrl,
  fallbackFavicon,
  getSiteLabel,
  normalizeUrl,
} from "@/lib/url";
import { importBookmarksSchema } from "@/lib/validators/import";
import { categoryExists } from "@/server/categories";
import { demoCreateLink, demoLinks } from "@/server/demo-data";
import { requireUser } from "@/server/users";
import type { ActionResult, BookmarkImportSummary } from "@/types";

/**
 * Bookmark import (Phase 8).
 *
 * Flow: Zod (size cap) → session user → per-user write rate limit → parse the
 * Netscape HTML export → keep only usable http(s) URLs → de-duplicate within
 * the file AND against the owner's existing rows (trashed rows count too,
 * matching the `(userId, normalizedUrl)` unique index) → chunked inserts.
 *
 * In demo mode the links land in the in-memory store, so the importer is fully
 * usable without a database. Failures never abort the whole import: duplicates
 * count as `skipped`, unusable URLs as `invalid`, and unexpected row errors as
 * `failed`.
 */

const prisma = getPrisma();

/** Per-chunk concurrency — keeps Neon happy while staying quick. */
const CHUNK_SIZE = 10;
const TITLE_MAX = 160;
const TAG_MAX = 32;

interface Candidate {
  url: string;
  normalizedUrl: string;
  title: string;
  folder: string | null;
}

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

function tagsFor(candidate: Candidate, folderTags: boolean): string[] {
  if (!folderTags || !candidate.folder) return [];
  const name = folderToTag(candidate.folder).slice(0, TAG_MAX);
  return name ? [name] : [];
}

export async function importBookmarksAction(
  input: unknown,
): Promise<ActionResult<BookmarkImportSummary>> {
  const parsed = importBookmarksSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid import request.");
  }

  const user = await requireUser();
  const limited = rateLimit(`writes:${user.id}`, RATE_LIMITS.writes);
  if (!limited.success) {
    return fail(
      "Too many changes — please wait a moment and try the import again.",
      "RATE_LIMITED",
    );
  }

  let file;
  try {
    file = parseBookmarksHtml(parsed.data.html);
  } catch (error) {
    if (error instanceof BookmarkParseError) {
      return fail(error.message, "INVALID_FILE");
    }
    throw error;
  }

  // Normalize + de-duplicate the file before touching the database.
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  let invalid = 0;

  for (const bookmark of file.bookmarks) {
    const url = coerceUrl(bookmark.url);
    if (!url) {
      invalid += 1;
      continue;
    }
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch {
      invalid += 1;
      continue;
    }
    if (seen.has(normalizedUrl)) continue;
    seen.add(normalizedUrl);

    const title = (bookmark.title.trim() || getSiteLabel(url)).slice(
      0,
      TITLE_MAX,
    );
    candidates.push({
      url,
      normalizedUrl,
      title,
      folder: bookmark.folder,
    });
  }

  const folderTags = parsed.data.folderTags ?? false;
  const requestedCategoryId = parsed.data.categoryId?.trim() || null;
  const ownedCategoryId =
    requestedCategoryId && (await categoryExists(user.id, requestedCategoryId))
      ? requestedCategoryId
      : null;

  // -------------------------------------------------------------------------
  // Demo mode — in-memory store
  // -------------------------------------------------------------------------
  if (!prisma) {
    let imported = 0;
    let skipped = 0;

    for (const candidate of candidates) {
      if (demoLinks.some((link) => link.normalizedUrl === candidate.normalizedUrl)) {
        skipped += 1;
        continue;
      }
      demoCreateLink({
        url: candidate.url,
        normalizedUrl: candidate.normalizedUrl,
        title: candidate.title,
        description: null,
        thumbnail: null,
        favicon: fallbackFavicon(candidate.url),
        siteName: getSiteLabel(candidate.url),
        categoryId: ownedCategoryId,
        tags: tagsFor(candidate, folderTags),
      });
      imported += 1;
    }

    revalidatePath("/", "layout");
    return {
      ok: true,
      data: {
        imported,
        skipped,
        invalid,
        failed: 0,
        total: file.total,
        truncated: file.truncated,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Prisma — scoped to the session user
  // -------------------------------------------------------------------------
  // Trashed rows still occupy the unique index, so they count as duplicates.
  const existing = new Set(
    (
      await prisma.link.findMany({
        where: { userId: user.id },
        select: { normalizedUrl: true },
      })
    ).map((row) => row.normalizedUrl),
  );

  const pending = candidates.filter(
    (candidate) => !existing.has(candidate.normalizedUrl),
  );
  let skipped = candidates.length - pending.length;
  let imported = 0;
  let failed = 0;

  for (let index = 0; index < pending.length; index += CHUNK_SIZE) {
    const chunk = pending.slice(index, index + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map((candidate) => {
        const tags = tagsFor(candidate, folderTags);
        return prisma.link.create({
          data: {
            userId: user.id,
            url: candidate.url,
            normalizedUrl: candidate.normalizedUrl,
            title: candidate.title,
            favicon: fallbackFavicon(candidate.url),
            siteName: getSiteLabel(candidate.url),
            categoryId: ownedCategoryId,
            tags: tags.length
              ? {
                  create: tags.map((name) => ({
                    tag: {
                      connectOrCreate: {
                        where: { userId_name: { userId: user.id, name } },
                        create: { userId: user.id, name },
                      },
                    },
                  })),
                }
              : undefined,
          },
        });
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        imported += 1;
        continue;
      }
      // A duplicate that appeared between the pre-check and the insert.
      if ((result.reason as { code?: string }).code === "P2002") {
        skipped += 1;
      } else {
        failed += 1;
      }
    }
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    data: {
      imported,
      skipped,
      invalid,
      failed,
      total: file.total,
      truncated: file.truncated,
    },
  };
}
