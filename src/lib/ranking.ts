import type { LinkItem } from "@/types";

/**
 * Popularity scoring: opens weighted by exponential-ish recency decay.
 *
 * Pure functions shared by the Prisma-backed DAL and the static landing
 * showcase (which renders demo data — the marketing page never reads a
 * session). Kept in `lib/` so importing them pulls in neither the database
 * nor any server-only module.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function popularityScore(
  link: Pick<LinkItem, "openCount" | "lastOpenedAt" | "createdAt">,
): number {
  const anchor = link.lastOpenedAt ?? link.createdAt;
  const ageDays = Math.max(0, (Date.now() - new Date(anchor).getTime()) / DAY_MS);
  // Half-life of ~14 days: an old open counts progressively less.
  return link.openCount / (1 + ageDays / 14);
}

export function rankByPopularity(links: LinkItem[], limit?: number): LinkItem[] {
  const ranked = [...links].sort((a, b) => popularityScore(b) - popularityScore(a));
  return limit ? ranked.slice(0, limit) : ranked;
}
