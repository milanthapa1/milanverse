import type { Category, DashboardStats, LinkItem, Tag, UserProfile } from "@/types";

/**
 * Demo dataset used when no DATABASE_URL is configured (local UI development
 * and first-run experience). Data-access functions in `src/server/*` fall back
 * to this store so the app is fully usable without infrastructure.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export const DEMO_USER: UserProfile = {
  id: "demo-user",
  name: "Milan",
  email: "milan@milanverse.dev",
  image: null,
};

export const DEMO_CATEGORIES: Category[] = [
  { id: "cat-movies", name: "Movies and TV", slug: "movies-and-tv", icon: "clapperboard", color: "#8B5CF6", order: 0, linkCount: 0 },
  { id: "cat-sports", name: "Sports", slug: "sports", icon: "trophy", color: "#22C55E", order: 1, linkCount: 0 },
  { id: "cat-ai", name: "AI Tools", slug: "ai-tools", icon: "sparkles", color: "#3B82F6", order: 2, linkCount: 0 },
  { id: "cat-dev", name: "Developer Tools", slug: "developer-tools", icon: "code", color: "#F97316", order: 3, linkCount: 0 },
  { id: "cat-learning", name: "Learning", slug: "learning", icon: "graduation-cap", color: "#14B8A6", order: 4, linkCount: 0 },
  { id: "cat-gaming", name: "Gaming", slug: "gaming", icon: "gamepad-2", color: "#7C5CFF", order: 5, linkCount: 0 },
  { id: "cat-music", name: "Music", slug: "music", icon: "headphones", color: "#D946EF", order: 6, linkCount: 0 },
  { id: "cat-others", name: "Others", slug: "others", icon: "layout-grid", color: "#64748B", order: 7, linkCount: 0 },
];

interface SeedLink {
  id: string;
  url: string;
  title: string;
  description: string;
  siteName: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  openCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
}

const SEED_LINKS: SeedLink[] = [
  {
    id: "lnk-netflix",
    url: "https://www.netflix.com/browse",
    title: "Netflix",
    description: "Watch TV shows and movies online. Stream award-winning Netflix originals on your phone, tablet, laptop and TV.",
    siteName: "Netflix",
    category: "movies-and-tv",
    tags: ["streaming", "movies", "series"],
    isFavorite: true,
    openCount: 148,
    lastOpenedAt: ago(2 * HOUR),
    createdAt: ago(42 * DAY),
  },
  {
    id: "lnk-prime",
    url: "https://www.primevideo.com",
    title: "Prime Video",
    description: "Watch movies, TV shows and award-winning Amazon Originals on your TV, phone or tablet.",
    siteName: "Prime Video",
    category: "movies-and-tv",
    tags: ["streaming", "movies"],
    isFavorite: false,
    openCount: 87,
    lastOpenedAt: ago(9 * HOUR),
    createdAt: ago(40 * DAY),
  },
  {
    id: "lnk-disney",
    url: "https://www.disneyplus.com",
    title: "Disney+",
    description: "Stream Disney, Pixar, Marvel, Star Wars, National Geographic and more — all in one place.",
    siteName: "Disney+",
    category: "movies-and-tv",
    tags: ["streaming", "family"],
    isFavorite: false,
    openCount: 64,
    lastOpenedAt: ago(2 * DAY),
    createdAt: ago(38 * DAY),
  },
  {
    id: "lnk-crunchyroll",
    url: "https://www.crunchyroll.com",
    title: "Crunchyroll",
    description: "Stream the largest anime library, simulcasts from Japan and dubs in multiple languages.",
    siteName: "Crunchyroll",
    category: "movies-and-tv",
    tags: ["anime", "streaming"],
    isFavorite: true,
    openCount: 112,
    lastOpenedAt: ago(5 * HOUR),
    createdAt: ago(35 * DAY),
  },
  {
    id: "lnk-max",
    url: "https://www.max.com",
    title: "Max",
    description: "Home of HBO, beloved classics, blockbuster movies and groundbreaking original series.",
    siteName: "Max",
    category: "movies-and-tv",
    tags: ["streaming", "series"],
    isFavorite: false,
    openCount: 33,
    lastOpenedAt: ago(6 * DAY),
    createdAt: ago(30 * DAY),
  },
  {
    id: "lnk-espn",
    url: "https://www.espn.com",
    title: "ESPN",
    description: "Live sports, breaking news and highlights across the NFL, NBA, MLB, soccer, college sports and more.",
    siteName: "ESPN",
    category: "sports",
    tags: ["sports", "news", "free"],
    isFavorite: true,
    openCount: 131,
    lastOpenedAt: ago(3 * HOUR),
    createdAt: ago(41 * DAY),
  },
  {
    id: "lnk-livescore",
    url: "https://www.livescore.com",
    title: "LiveScore",
    description: "Fast, accurate live football scores and results from leagues around the world.",
    siteName: "LiveScore",
    category: "sports",
    tags: ["football", "scores", "free"],
    isFavorite: false,
    openCount: 96,
    lastOpenedAt: ago(1 * HOUR),
    createdAt: ago(39 * DAY),
  },
  {
    id: "lnk-dazn",
    url: "https://www.dazn.com",
    title: "DAZN",
    description: "The global home of combat sports, football and live sport — watch live and on demand.",
    siteName: "DAZN",
    category: "sports",
    tags: ["streaming", "sports", "boxing"],
    isFavorite: false,
    openCount: 41,
    lastOpenedAt: ago(4 * DAY),
    createdAt: ago(28 * DAY),
  },
  {
    id: "lnk-cricbuzz",
    url: "https://www.cricbuzz.com",
    title: "Cricbuzz",
    description: "Live cricket scores, commentary, news and series schedules from around the world.",
    siteName: "Cricbuzz",
    category: "sports",
    tags: ["cricket", "scores", "free"],
    isFavorite: false,
    openCount: 78,
    lastOpenedAt: ago(7 * HOUR),
    createdAt: ago(33 * DAY),
  },
  {
    id: "lnk-chatgpt",
    url: "https://chat.openai.com",
    title: "ChatGPT",
    description: "OpenAI's conversational AI assistant for writing, research, coding and analysis.",
    siteName: "OpenAI",
    category: "ai-tools",
    tags: ["ai", "assistant", "free"],
    isFavorite: true,
    openCount: 210,
    lastOpenedAt: ago(30 * 60 * 1000),
    createdAt: ago(44 * DAY),
  },
  {
    id: "lnk-claude",
    url: "https://claude.ai",
    title: "Claude",
    description: "Anthropic's AI assistant for reasoning, coding, long documents and creative work.",
    siteName: "Anthropic",
    category: "ai-tools",
    tags: ["ai", "assistant"],
    isFavorite: true,
    openCount: 156,
    lastOpenedAt: ago(2 * HOUR),
    createdAt: ago(31 * DAY),
  },
  {
    id: "lnk-perplexity",
    url: "https://www.perplexity.ai",
    title: "Perplexity",
    description: "Answer engine powered by AI with live citations from across the web.",
    siteName: "Perplexity",
    category: "ai-tools",
    tags: ["ai", "search", "research"],
    isFavorite: false,
    openCount: 67,
    lastOpenedAt: ago(26 * HOUR),
    createdAt: ago(22 * DAY),
  },
  {
    id: "lnk-github",
    url: "https://github.com",
    title: "GitHub",
    description: "Where the world builds software. Host, review code, manage projects and ship software with confidence.",
    siteName: "GitHub",
    category: "developer-tools",
    tags: ["code", "git", "open-source"],
    isFavorite: true,
    openCount: 302,
    lastOpenedAt: ago(20 * 60 * 1000),
    createdAt: ago(60 * DAY),
  },
  {
    id: "lnk-stackoverflow",
    url: "https://stackoverflow.com",
    title: "Stack Overflow",
    description: "A public platform to find and contribute answers to technical development questions.",
    siteName: "Stack Overflow",
    category: "developer-tools",
    tags: ["code", "qa", "free"],
    isFavorite: false,
    openCount: 184,
    lastOpenedAt: ago(4 * HOUR),
    createdAt: ago(58 * DAY),
  },
  {
    id: "lnk-vercel",
    url: "https://vercel.com",
    title: "Vercel",
    description: "Build and deploy the best web experiences with the Frontend Cloud — home of Next.js.",
    siteName: "Vercel",
    category: "developer-tools",
    tags: ["hosting", "deploy", "nextjs"],
    isFavorite: false,
    openCount: 91,
    lastOpenedAt: ago(11 * HOUR),
    createdAt: ago(27 * DAY),
  },
  {
    id: "lnk-mdn",
    url: "https://developer.mozilla.org",
    title: "MDN Web Docs",
    description: "Resources for developers, by developers — documentation for HTML, CSS, JS and Web APIs.",
    siteName: "MDN",
    category: "developer-tools",
    tags: ["docs", "web", "free"],
    isFavorite: false,
    openCount: 120,
    lastOpenedAt: ago(1 * DAY),
    createdAt: ago(55 * DAY),
  },
  {
    id: "lnk-freecodecamp",
    url: "https://www.freecodecamp.org",
    title: "freeCodeCamp",
    description: "Learn to code for free. Build projects, earn certifications and join a global community.",
    siteName: "freeCodeCamp",
    category: "learning",
    tags: ["coding", "courses", "free"],
    isFavorite: false,
    openCount: 73,
    lastOpenedAt: ago(3 * DAY),
    createdAt: ago(48 * DAY),
  },
  {
    id: "lnk-coursera",
    url: "https://www.coursera.org",
    title: "Coursera",
    description: "Learn from the world's best universities and companies with online courses and degrees.",
    siteName: "Coursera",
    category: "learning",
    tags: ["courses", "degrees"],
    isFavorite: false,
    openCount: 45,
    lastOpenedAt: ago(8 * DAY),
    createdAt: ago(46 * DAY),
  },
  {
    id: "lnk-steam",
    url: "https://store.steampowered.com",
    title: "Steam",
    description: "Steam is the ultimate destination for playing, discussing and creating games.",
    siteName: "Steam",
    category: "gaming",
    tags: ["games", "store"],
    isFavorite: true,
    openCount: 167,
    lastOpenedAt: ago(6 * HOUR),
    createdAt: ago(52 * DAY),
  },
  {
    id: "lnk-twitch",
    url: "https://www.twitch.tv",
    title: "Twitch",
    description: "Stream and watch live gaming, esports, music and creative content.",
    siteName: "Twitch",
    category: "gaming",
    tags: ["streaming", "gaming"],
    isFavorite: false,
    openCount: 102,
    lastOpenedAt: ago(14 * HOUR),
    createdAt: ago(45 * DAY),
  },
  {
    id: "lnk-spotify",
    url: "https://open.spotify.com",
    title: "Spotify",
    description: "Play millions of songs and podcasts, and discover new artists and tracks.",
    siteName: "Spotify",
    category: "music",
    tags: ["music", "streaming", "podcasts"],
    isFavorite: true,
    openCount: 198,
    lastOpenedAt: ago(50 * 60 * 1000),
    createdAt: ago(59 * DAY),
  },
  {
    id: "lnk-soundcloud",
    url: "https://soundcloud.com",
    title: "SoundCloud",
    description: "Discover and listen to music and podcasts from a global community of creators.",
    siteName: "SoundCloud",
    category: "music",
    tags: ["music", "free", "discover"],
    isFavorite: false,
    openCount: 39,
    lastOpenedAt: ago(9 * DAY),
    createdAt: ago(25 * DAY),
  },
  {
    id: "lnk-notion",
    url: "https://www.notion.so",
    title: "Notion",
    description: "A connected workspace where you write, plan, organize and get things done.",
    siteName: "Notion",
    category: "others",
    tags: ["notes", "productivity"],
    isFavorite: false,
    openCount: 88,
    lastOpenedAt: ago(8 * HOUR),
    createdAt: ago(50 * DAY),
  },
  {
    id: "lnk-reddit",
    url: "https://www.reddit.com",
    title: "Reddit",
    description: "Dive into anything — communities, discussions and endless internet culture.",
    siteName: "Reddit",
    category: "others",
    tags: ["social", "news", "free"],
    isFavorite: false,
    openCount: 143,
    lastOpenedAt: ago(3 * HOUR),
    createdAt: ago(57 * DAY),
  },
];

function hydrate(seed: SeedLink): LinkItem {
  const category = DEMO_CATEGORIES.find((c) => c.slug === seed.category);
  return {
    id: seed.id,
    url: seed.url,
    normalizedUrl: seed.url.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    title: seed.title,
    description: seed.description,
    thumbnail: null,
    favicon: null,
    siteName: seed.siteName,
    categoryId: category?.id ?? "cat-others",
    category: category ?? null,
    tags: seed.tags,
    isFavorite: seed.isFavorite,
    openCount: seed.openCount,
    lastOpenedAt: seed.lastOpenedAt,
    deletedAt: null,
    createdAt: seed.createdAt,
    updatedAt: seed.createdAt,
  };
}

/** Mutable demo store — mutations from the UI apply here for the session. */
export const demoLinks: LinkItem[] = SEED_LINKS.map(hydrate);

/** Recompute per-category active-link counts (call after every demo mutation). */
export function recomputeDemoCategoryCounts(): void {
  for (const category of DEMO_CATEGORIES) {
    category.linkCount = demoLinks.filter(
      (l) => l.categoryId === category.id && l.deletedAt === null,
    ).length;
  }
}
recomputeDemoCategoryCounts();

export function computeDemoTags(): Tag[] {
  const counts = new Map<string, number>();
  for (const link of demoLinks) {
    for (const tag of link.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, linkCount], index) => ({ id: `tag-${index}`, name, linkCount }));
}

export function computeDemoStats(): DashboardStats {
  const active = demoLinks.filter((l) => l.deletedAt === null);
  const lastOpened = active
    .map((l) => l.lastOpenedAt)
    .filter((v): v is string => v !== null)
    .sort()
    .at(-1);
  return {
    totalLinks: active.length,
    totalCategories: DEMO_CATEGORIES.length,
    totalTags: computeDemoTags().length,
    favorites: active.filter((l) => l.isFavorite).length,
    lastOpenedAt: lastOpened ?? null,
  };
}

// ---------------------------------------------------------------------------
// In-memory mutations (demo-mode CRUD: without a database every write lands
// here, so the UI stays fully interactive — restarting the server resets it).
// ---------------------------------------------------------------------------

let demoSeq = 0;

export interface DemoLinkInput {
  url: string;
  normalizedUrl: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  favicon: string | null;
  siteName: string | null;
  categoryId: string | null;
  tags: string[];
}

export function demoCreateLink(input: DemoLinkInput): LinkItem {
  const now = new Date().toISOString();
  const category =
    DEMO_CATEGORIES.find((c) => c.id === input.categoryId) ?? null;
  const link: LinkItem = {
    id: `lnk-demo-${Date.now().toString(36)}-${(demoSeq++).toString(36)}`,
    url: input.url,
    normalizedUrl: input.normalizedUrl,
    title: input.title,
    description: input.description,
    thumbnail: input.thumbnail,
    favicon: input.favicon,
    siteName: input.siteName,
    categoryId: category?.id ?? "",
    category,
    tags: input.tags,
    isFavorite: false,
    openCount: 0,
    lastOpenedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  demoLinks.unshift(link);
  recomputeDemoCategoryCounts();
  return link;
}

export interface DemoLinkPatch {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  isFavorite?: boolean;
  tags?: string[];
}

export function demoUpdateLink(id: string, patch: DemoLinkPatch): LinkItem | null {
  const link = demoLinks.find((l) => l.id === id);
  if (!link) return null;
  if (patch.title !== undefined) link.title = patch.title;
  if (patch.description !== undefined) link.description = patch.description;
  if (patch.categoryId !== undefined) {
    link.category = DEMO_CATEGORIES.find((c) => c.id === patch.categoryId) ?? null;
    link.categoryId = link.category?.id ?? "";
  }
  if (patch.isFavorite !== undefined) link.isFavorite = patch.isFavorite;
  if (patch.tags !== undefined) link.tags = patch.tags;
  link.updatedAt = new Date().toISOString();
  recomputeDemoCategoryCounts();
  return link;
}

/** Soft delete (`deletedAt` set) / restore (`deletedAt` null). */
export function demoSetDeleted(
  id: string,
  deletedAt: string | null,
): LinkItem | null {
  const link = demoLinks.find((l) => l.id === id);
  if (!link) return null;
  link.deletedAt = deletedAt;
  link.updatedAt = new Date().toISOString();
  recomputeDemoCategoryCounts();
  return link;
}

export function demoPurgeLink(id: string): boolean {
  const index = demoLinks.findIndex((l) => l.id === id);
  if (index === -1) return false;
  demoLinks.splice(index, 1);
  recomputeDemoCategoryCounts();
  return true;
}

export function demoTrackOpen(id: string): boolean {
  const link = demoLinks.find((l) => l.id === id);
  if (!link) return false;
  link.openCount += 1;
  link.lastOpenedAt = new Date().toISOString();
  return true;
}
