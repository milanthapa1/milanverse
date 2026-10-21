/**
 * App-wide constants: the 8 default categories, icon registry keys and
 * category color tokens. Pure data — safe for Prisma seed, client and server.
 */

export interface DefaultCategory {
  name: string;
  slug: string;
  /** Lucide icon key, resolved via `src/components/categories/category-icons.tsx` */
  icon: string;
  /** Hex accent color used for tint, badge and gradient */
  color: string;
}

/** Seeded into every new user's collection (and the demo dataset). */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Movies and TV", slug: "movies-and-tv", icon: "clapperboard", color: "#8B5CF6" },
  { name: "Sports", slug: "sports", icon: "trophy", color: "#22C55E" },
  { name: "AI Tools", slug: "ai-tools", icon: "sparkles", color: "#3B82F6" },
  { name: "Developer Tools", slug: "developer-tools", icon: "code", color: "#F97316" },
  { name: "Learning", slug: "learning", icon: "graduation-cap", color: "#14B8A6" },
  { name: "Gaming", slug: "gaming", icon: "gamepad-2", color: "#7C5CFF" },
  { name: "Music", slug: "music", icon: "headphones", color: "#D946EF" },
  { name: "Others", slug: "others", icon: "layout-grid", color: "#64748B" },
];

export const CATEGORY_BY_SLUG = new Map(DEFAULT_CATEGORIES.map((c) => [c.slug, c]));

/** Fallback icon/color when a category is unknown. */
export const FALLBACK_CATEGORY: DefaultCategory = {
  name: "Others",
  slug: "others",
  icon: "layout-grid",
  color: "#64748B",
};

/** Badge tone tokens used by link cards. */
export const BADGE_TONES = {
  free: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Free" },
  streaming: { bg: "bg-sky-500/15", text: "text-sky-400", label: "Streaming" },
  paid: { bg: "bg-rose-500/15", text: "text-rose-400", label: "Paid" },
  anime: { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", label: "Anime" },
  openSource: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Open Source" },
} as const;

export type BadgeToneKey = keyof typeof BADGE_TONES;

/** Curated accent palette offered in the category editor (cosmic-friendly). */
export const CATEGORY_COLORS = [
  "#7C5CFF",
  "#8B5CF6",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#F97316",
  "#F59E0B",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#64748B",
] as const;

/** Query params preserved when sharing links. */
export const APP_NAME = "MilanVerse";
export const APP_TAGLINE = "Your Personal Internet Universe";

/** In-memory rate limits (see src/lib/rate-limit.ts). */
export const RATE_LIMITS = {
  metadata: { limit: 20, windowMs: 60_000 },
  writes: { limit: 60, windowMs: 60_000 },
} as const;

/** localStorage keys */
export const STORAGE_KEYS = {
  theme: "milanverse-theme",
  recentSearches: "milanverse-recent-searches",
} as const;
