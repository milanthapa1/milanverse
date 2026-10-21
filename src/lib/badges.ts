import { BADGE_TONES, type BadgeToneKey } from "@/lib/constants";
import type { LinkItem } from "@/types";

/**
 * Derives visual badge chips ("Free", "Streaming", "Anime", …) from a link's
 * tags and site name. Max 2 badges shown per card.
 */
export function deriveBadges(link: Pick<LinkItem, "tags" | "siteName" | "title">): BadgeToneKey[] {
  const haystack = [...link.tags, link.siteName ?? "", link.title].map((s) => s.toLowerCase());
  const found: BadgeToneKey[] = [];

  const has = (needle: string): boolean => haystack.some((s) => s.includes(needle));

  if (has("free") || has("open source")) found.push("free");
  if (has("stream") || has("streaming")) found.push("streaming");
  if (has("anime")) found.push("anime");
  if (has("open-source") || has("opensource") || has("github")) found.push("openSource");

  return found.slice(0, 2);
}

export function badgeLabel(key: BadgeToneKey): string {
  return BADGE_TONES[key].label;
}
