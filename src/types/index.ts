/**
 * Shared domain types used across the app (UI, server data-access, API).
 * Prisma-generated types live in `@prisma/client` and are mapped into these
 * shapes by the data-access layer so the UI never depends on Prisma directly.
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Lucide icon key from the icon registry (e.g. "clapperboard") */
  icon: string;
  /** Hex color, e.g. "#7C5CFF" */
  color: string;
  order: number;
  /** Number of active (non-trashed) links in this category */
  linkCount: number;
}

export interface LinkItem {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  favicon: string | null;
  siteName: string | null;
  categoryId: string;
  category: Category | null;
  tags: string[];
  isFavorite: boolean;
  openCount: number;
  lastOpenedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  linkCount: number;
}

export interface DashboardStats {
  totalLinks: number;
  totalCategories: number;
  totalTags: number;
  favorites: number;
  lastOpenedAt: string | null;
}

export interface SearchResult {
  links: LinkItem[];
  categories: Category[];
  tags: Tag[];
  query: string;
}

/** Trimmed payload for the ⌘K palette (top matches only). */
export interface PaletteSearchData {
  links: LinkItem[];
  tags: Tag[];
  totalLinks: number;
}

/** Outcome of a browser-bookmarks import. */
export interface BookmarkImportSummary {
  imported: number;
  skipped: number;
  /** Anchors that were not usable URLs (javascript:, chrome://, malformed…). */
  invalid: number;
  /** Rows that failed for a non-duplicate reason. */
  failed: number;
  /** Anchors found in the file, before the per-import cap. */
  total: number;
  truncated: boolean;
}

/** Payload returned by POST /api/metadata */
export interface SiteMetadata {
  url: string;
  normalizedUrl: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  favicon: string | null;
  siteName: string | null;
  suggestedTags: string[];
  /** True when OG data was missing and we fell back to favicon + domain */
  fallback: boolean;
}

/** API envelope */
export interface ApiError {
  error: string;
  code?: string;
}

export type LinkSort = "recent" | "popular" | "alphabetical";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * Server-action result envelope (serializable by design — returned across the
 * RSC boundary to client components, so no classes or Dates).
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
