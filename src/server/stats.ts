import type { DashboardStats } from "@/types";
import { getPrisma } from "@/lib/db";
import { computeDemoStats } from "./demo-data";

/**
 * Data Access Layer: dashboard stats (userId-scoped).
 * The Prisma path runs five cheap COUNT/MIN queries in parallel.
 */

const prisma = getPrisma();

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  if (!prisma) {
    return computeDemoStats();
  }
  const [totalLinks, totalCategories, totalTags, favorites, last] =
    await Promise.all([
      prisma.link.count({ where: { userId, deletedAt: null } }),
      prisma.category.count({ where: { userId } }),
      prisma.tag.count({ where: { userId } }),
      prisma.link.count({ where: { userId, deletedAt: null, isFavorite: true } }),
      prisma.link.findFirst({
        where: { userId, deletedAt: null, lastOpenedAt: { not: null } },
        orderBy: { lastOpenedAt: "desc" },
        select: { lastOpenedAt: true },
      }),
    ]);
  return {
    totalLinks,
    totalCategories,
    totalTags,
    favorites,
    lastOpenedAt: last?.lastOpenedAt?.toISOString() ?? null,
  };
}
