import type { Prisma } from "@/generated/prisma/client";
import type { Category, LinkItem } from "@/types";
import { getPrisma } from "@/lib/db";
import { rankByPopularity } from "@/lib/ranking";
import { demoLinks } from "./demo-data";

/**
 * Data Access Layer: links.
 *
 * Every function takes the session `userId` as its first parameter —
 * ownership is part of the signature, so a call site cannot forget to scope
 * its query (the single most common authorization bug in bookmark apps).
 *
 * Two backends behind the same interface:
 *  - demo mode (no DATABASE_URL): the in-memory store in `demo-data.ts`
 *  - real mode: Prisma → Postgres (Neon), rows filtered by `userId`
 */

const prisma = getPrisma();

/** Relations hydrated onto every LinkItem row. */
const LINK_INCLUDE = {
  category: true,
  tags: { include: { tag: true } },
} as const;

type LinkRow = Prisma.LinkGetPayload<{ include: typeof LINK_INCLUDE }>;

/** Map a Prisma row to the app-wide LinkItem shape. */
function mapLink(row: LinkRow, categoryCounts: Map<string, number>): LinkItem {
  const category: Category | null = row.category
    ? {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug,
        icon: row.category.icon,
        color: row.category.color,
        order: row.category.order,
        linkCount: categoryCounts.get(row.category.id) ?? 0,
      }
    : null;
  return {
    id: row.id,
    url: row.url,
    normalizedUrl: row.normalizedUrl,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    favicon: row.favicon,
    siteName: row.siteName,
    categoryId: row.categoryId ?? "",
    category,
    tags: row.tags.map((lt) => lt.tag.name),
    isFavorite: row.isFavorite,
    openCount: row.openCount,
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Active-link counts per category (for accurate `category.linkCount` embeds). */
async function activeLinkCountsByCategory(
  userId: string,
): Promise<Map<string, number>> {
  const groups = await prisma!.link.groupBy({
    by: ["categoryId"],
    where: { userId, deletedAt: null },
    _count: { _all: true },
  });
  return new Map(
    groups
      .filter((g) => g.categoryId !== null)
      .map((g) => [g.categoryId as string, g._count._all]),
  );
}

export async function listActiveLinks(userId: string): Promise<LinkItem[]> {
  if (!prisma) {
    return demoLinks.filter((l) => l.deletedAt === null);
  }
  const [rows, counts] = await Promise.all([
    prisma.link.findMany({
      where: { userId, deletedAt: null },
      include: LINK_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    activeLinkCountsByCategory(userId),
  ]);
  return rows.map((row) => mapLink(row, counts));
}

export async function listDeletedLinks(userId: string): Promise<LinkItem[]> {
  if (!prisma) {
    return demoLinks
      .filter((l) => l.deletedAt !== null)
      .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
  }
  const [rows, counts] = await Promise.all([
    prisma.link.findMany({
      where: { userId, deletedAt: { not: null } },
      include: LINK_INCLUDE,
      orderBy: { deletedAt: "desc" },
    }),
    activeLinkCountsByCategory(userId),
  ]);
  return rows.map((row) => mapLink(row, counts));
}

export async function getPopularLinks(
  userId: string,
  limit = 6,
): Promise<LinkItem[]> {
  return rankByPopularity(await listActiveLinks(userId), limit);
}

export async function getRecentlyOpened(
  userId: string,
  limit = 6,
): Promise<LinkItem[]> {
  if (!prisma) {
    return (await listActiveLinks(userId))
      .filter((l) => l.lastOpenedAt !== null)
      .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""))
      .slice(0, limit);
  }
  const [rows, counts] = await Promise.all([
    prisma.link.findMany({
      where: { userId, deletedAt: null, lastOpenedAt: { not: null } },
      include: LINK_INCLUDE,
      orderBy: { lastOpenedAt: "desc" },
      take: limit,
    }),
    activeLinkCountsByCategory(userId),
  ]);
  return rows.map((row) => mapLink(row, counts));
}

export async function getFavoriteLinks(
  userId: string,
  limit?: number,
): Promise<LinkItem[]> {
  if (!prisma) {
    const favorites = (await listActiveLinks(userId)).filter((l) => l.isFavorite);
    return limit ? favorites.slice(0, limit) : favorites;
  }
  const [rows, counts] = await Promise.all([
    prisma.link.findMany({
      where: { userId, deletedAt: null, isFavorite: true },
      include: LINK_INCLUDE,
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
    }),
    activeLinkCountsByCategory(userId),
  ]);
  return rows.map((row) => mapLink(row, counts));
}

export async function getLinksByCategory(
  userId: string,
  categoryId: string,
): Promise<LinkItem[]> {
  if (!prisma) {
    return (await listActiveLinks(userId)).filter(
      (l) => l.categoryId === categoryId,
    );
  }
  const [rows, counts] = await Promise.all([
    prisma.link.findMany({
      where: { userId, deletedAt: null, categoryId },
      include: LINK_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    activeLinkCountsByCategory(userId),
  ]);
  return rows.map((row) => mapLink(row, counts));
}

/** Single link by id, scoped to the owner. Includes trashed rows (details view). */
export async function getLinkById(
  userId: string,
  id: string,
): Promise<LinkItem | null> {
  if (!prisma) {
    return demoLinks.find((l) => l.id === id) ?? null;
  }
  const [row, counts] = await Promise.all([
    prisma.link.findFirst({ where: { id, userId }, include: LINK_INCLUDE }),
    activeLinkCountsByCategory(userId),
  ]);
  return row ? mapLink(row, counts) : null;
}

export async function getLinksByTag(
  userId: string,
  tag: string,
): Promise<LinkItem[]> {
  if (!prisma) {
    return (await listActiveLinks(userId)).filter((l) => l.tags.includes(tag));
  }
  const [rows, counts] = await Promise.all([
    prisma.link.findMany({
      where: { userId, deletedAt: null, tags: { some: { tag: { name: tag } } } },
      include: LINK_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    activeLinkCountsByCategory(userId),
  ]);
  return rows.map((row) => mapLink(row, counts));
}

/**
 * Search active links: substring match on title/description/site/domain/tags
 * with a lightweight relevance score. Datasets are personal-scale (hundreds,
 * not millions), so we score in JS over the owner's rows.
 */
export async function searchLinks(
  userId: string,
  query: string,
): Promise<LinkItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const links = await listActiveLinks(userId);
  const scored: Array<{ link: LinkItem; score: number }> = [];
  for (const link of links) {
    const title = link.title.toLowerCase();
    const haystack = [
      link.title,
      link.description ?? "",
      link.siteName ?? "",
      link.normalizedUrl,
      link.tags.join(" "),
      link.category?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    if (haystack.includes(q)) score += 1;
    if (title.includes(q)) score += 2;
    if (link.tags.some((t) => t.toLowerCase() === q)) score += 3;
    if (score > 0) scored.push({ link, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || b.link.createdAt.localeCompare(a.link.createdAt),
  );
  return scored.map((s) => s.link);
}
