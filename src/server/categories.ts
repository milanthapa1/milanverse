import type { Prisma } from "@/generated/prisma/client";
import type { Category } from "@/types";
import { getPrisma } from "@/lib/db";
import { DEMO_CATEGORIES } from "./demo-data";

/**
 * Data Access Layer: categories (userId-scoped, Prisma or demo store).
 * `linkCount` is always the number of ACTIVE (non-trashed) links.
 */

const prisma = getPrisma();

type CategoryRow = Prisma.CategoryModel;

function mapCategory(
  row: CategoryRow,
  linkCount: number,
): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    color: row.color,
    order: row.order,
    linkCount,
  };
}

/** Active-link counts keyed by categoryId. */
async function activeCounts(userId: string): Promise<Map<string, number>> {
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

export async function listCategories(userId: string): Promise<Category[]> {
  if (!prisma) {
    return [...DEMO_CATEGORIES].sort((a, b) => a.order - b.order);
  }
  const [rows, counts] = await Promise.all([
    prisma.category.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    activeCounts(userId),
  ]);
  return rows.map((row) => mapCategory(row, counts.get(row.id) ?? 0));
}

export async function getCategoryBySlug(
  userId: string,
  slug: string,
): Promise<Category | null> {
  if (!prisma) {
    return DEMO_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }
  const row = await prisma.category.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (!row) return null;
  const linkCount = await prisma.link.count({
    where: { userId, deletedAt: null, categoryId: row.id },
  });
  return mapCategory(row, linkCount);
}

export async function getCategoryById(
  userId: string,
  id: string,
): Promise<Category | null> {
  if (!prisma) {
    return DEMO_CATEGORIES.find((c) => c.id === id) ?? null;
  }
  const row = await prisma.category.findFirst({ where: { id, userId } });
  if (!row) return null;
  const linkCount = await prisma.link.count({
    where: { userId, deletedAt: null, categoryId: row.id },
  });
  return mapCategory(row, linkCount);
}

/** Ownership check for write paths (create/update a link under a category). */
export async function categoryExists(userId: string, id: string): Promise<boolean> {
  if (!prisma) {
    return DEMO_CATEGORIES.some((c) => c.id === id);
  }
  const row = await prisma.category.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  return row !== null;
}
