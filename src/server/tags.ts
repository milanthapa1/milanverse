import type { Prisma } from "@/generated/prisma/client";
import type { Tag } from "@/types";
import { getPrisma } from "@/lib/db";
import { computeDemoTags } from "./demo-data";

/**
 * Data Access Layer: tags (userId-scoped).
 * `linkCount` includes every link carrying the tag (trash included, matching
 * the Prisma `_count.links` semantics of the LinkTag join).
 */

const prisma = getPrisma();

type TagRow = Prisma.TagModel & { _count?: { links: number } };

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    linkCount: row._count?.links ?? 0,
  };
}

export async function listTags(userId: string): Promise<Tag[]> {
  if (!prisma) {
    return computeDemoTags();
  }
  const rows = await prisma.tag.findMany({
    where: { userId },
    include: { _count: { select: { links: true } } },
  });
  return rows
    .map(mapTag)
    .sort((a, b) => b.linkCount - a.linkCount || a.name.localeCompare(b.name));
}
