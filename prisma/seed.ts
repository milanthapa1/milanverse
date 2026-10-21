/**
 * MilanVerse seed: demo user + 8 default categories + ~20 realistic links.
 *
 * Run with:   npm run db:seed
 * Requires:   DATABASE_URL (Neon pooled) in .env — exits gracefully without it.
 *
 * The script wipes the demo user's data first so it is idempotent.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/constants";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(ms: number): Date {
  return new Date(Date.now() - ms);
}

interface SeedLink {
  url: string;
  title: string;
  description: string;
  siteName: string;
  categorySlug: string;
  tags: string[];
  isFavorite: boolean;
  openCount: number;
  lastOpenedAt: Date | null;
  createdAt: Date;
}

const LINKS: SeedLink[] = [
  {
    url: "https://www.netflix.com/browse",
    title: "Netflix",
    description:
      "Watch TV shows and movies online. Stream award-winning Netflix originals on your phone, tablet, laptop and TV.",
    siteName: "Netflix",
    categorySlug: "movies-and-tv",
    tags: ["streaming", "movies", "series"],
    isFavorite: true,
    openCount: 148,
    lastOpenedAt: ago(2 * HOUR),
    createdAt: ago(42 * DAY),
  },
  {
    url: "https://www.primevideo.com",
    title: "Prime Video",
    description:
      "Watch movies, TV shows and award-winning Amazon Originals on your TV, phone or tablet.",
    siteName: "Prime Video",
    categorySlug: "movies-and-tv",
    tags: ["streaming", "movies"],
    isFavorite: false,
    openCount: 87,
    lastOpenedAt: ago(9 * HOUR),
    createdAt: ago(40 * DAY),
  },
  {
    url: "https://www.disneyplus.com",
    title: "Disney+",
    description:
      "Stream Disney, Pixar, Marvel, Star Wars, National Geographic and more — all in one place.",
    siteName: "Disney+",
    categorySlug: "movies-and-tv",
    tags: ["streaming", "family"],
    isFavorite: false,
    openCount: 64,
    lastOpenedAt: ago(2 * DAY),
    createdAt: ago(38 * DAY),
  },
  {
    url: "https://www.crunchyroll.com",
    title: "Crunchyroll",
    description:
      "Stream the largest anime library, simulcasts from Japan and dubs in multiple languages.",
    siteName: "Crunchyroll",
    categorySlug: "movies-and-tv",
    tags: ["anime", "streaming"],
    isFavorite: true,
    openCount: 112,
    lastOpenedAt: ago(5 * HOUR),
    createdAt: ago(35 * DAY),
  },
  {
    url: "https://www.espn.com",
    title: "ESPN",
    description:
      "Live sports, breaking news and highlights across the NFL, NBA, MLB, soccer, college sports and more.",
    siteName: "ESPN",
    categorySlug: "sports",
    tags: ["sports", "news", "free"],
    isFavorite: true,
    openCount: 131,
    lastOpenedAt: ago(3 * HOUR),
    createdAt: ago(41 * DAY),
  },
  {
    url: "https://www.livescore.com",
    title: "LiveScore",
    description:
      "Fast, accurate live football scores and results from leagues around the world.",
    siteName: "LiveScore",
    categorySlug: "sports",
    tags: ["football", "scores", "free"],
    isFavorite: false,
    openCount: 96,
    lastOpenedAt: ago(1 * HOUR),
    createdAt: ago(39 * DAY),
  },
  {
    url: "https://www.dazn.com",
    title: "DAZN",
    description:
      "The global home of combat sports, football and live sport — watch live and on demand.",
    siteName: "DAZN",
    categorySlug: "sports",
    tags: ["streaming", "sports", "boxing"],
    isFavorite: false,
    openCount: 41,
    lastOpenedAt: ago(4 * DAY),
    createdAt: ago(28 * DAY),
  },
  {
    url: "https://www.cricbuzz.com",
    title: "Cricbuzz",
    description:
      "Live cricket scores, commentary, news and series schedules from around the world.",
    siteName: "Cricbuzz",
    categorySlug: "sports",
    tags: ["cricket", "scores", "free"],
    isFavorite: false,
    openCount: 78,
    lastOpenedAt: ago(7 * HOUR),
    createdAt: ago(33 * DAY),
  },
  {
    url: "https://chat.openai.com",
    title: "ChatGPT",
    description:
      "OpenAI's conversational AI assistant for writing, research, coding and analysis.",
    siteName: "OpenAI",
    categorySlug: "ai-tools",
    tags: ["ai", "assistant", "free"],
    isFavorite: true,
    openCount: 210,
    lastOpenedAt: ago(30 * 60 * 1000),
    createdAt: ago(44 * DAY),
  },
  {
    url: "https://claude.ai",
    title: "Claude",
    description:
      "Anthropic's AI assistant for reasoning, coding, long documents and creative work.",
    siteName: "Anthropic",
    categorySlug: "ai-tools",
    tags: ["ai", "assistant"],
    isFavorite: true,
    openCount: 156,
    lastOpenedAt: ago(2 * HOUR),
    createdAt: ago(31 * DAY),
  },
  {
    url: "https://www.perplexity.ai",
    title: "Perplexity",
    description: "Answer engine powered by AI with live citations from across the web.",
    siteName: "Perplexity",
    categorySlug: "ai-tools",
    tags: ["ai", "search", "research"],
    isFavorite: false,
    openCount: 67,
    lastOpenedAt: ago(26 * HOUR),
    createdAt: ago(22 * DAY),
  },
  {
    url: "https://github.com",
    title: "GitHub",
    description:
      "Where the world builds software. Host, review code, manage projects and ship software with confidence.",
    siteName: "GitHub",
    categorySlug: "developer-tools",
    tags: ["code", "git", "open-source"],
    isFavorite: true,
    openCount: 302,
    lastOpenedAt: ago(20 * 60 * 1000),
    createdAt: ago(60 * DAY),
  },
  {
    url: "https://stackoverflow.com",
    title: "Stack Overflow",
    description:
      "A public platform to find and contribute answers to technical development questions.",
    siteName: "Stack Overflow",
    categorySlug: "developer-tools",
    tags: ["code", "qa", "free"],
    isFavorite: false,
    openCount: 184,
    lastOpenedAt: ago(4 * HOUR),
    createdAt: ago(58 * DAY),
  },
  {
    url: "https://vercel.com",
    title: "Vercel",
    description:
      "Build and deploy the best web experiences with the Frontend Cloud — home of Next.js.",
    siteName: "Vercel",
    categorySlug: "developer-tools",
    tags: ["hosting", "deploy", "nextjs"],
    isFavorite: false,
    openCount: 91,
    lastOpenedAt: ago(11 * HOUR),
    createdAt: ago(27 * DAY),
  },
  {
    url: "https://developer.mozilla.org",
    title: "MDN Web Docs",
    description:
      "Resources for developers, by developers — documentation for HTML, CSS, JS and Web APIs.",
    siteName: "MDN",
    categorySlug: "developer-tools",
    tags: ["docs", "web", "free"],
    isFavorite: false,
    openCount: 120,
    lastOpenedAt: ago(1 * DAY),
    createdAt: ago(55 * DAY),
  },
  {
    url: "https://www.freecodecamp.org",
    title: "freeCodeCamp",
    description:
      "Learn to code for free. Build projects, earn certifications and join a global community.",
    siteName: "freeCodeCamp",
    categorySlug: "learning",
    tags: ["coding", "courses", "free"],
    isFavorite: false,
    openCount: 73,
    lastOpenedAt: ago(3 * DAY),
    createdAt: ago(48 * DAY),
  },
  {
    url: "https://www.coursera.org",
    title: "Coursera",
    description:
      "Learn from the world's best universities and companies with online courses and degrees.",
    siteName: "Coursera",
    categorySlug: "learning",
    tags: ["courses", "degrees"],
    isFavorite: false,
    openCount: 45,
    lastOpenedAt: ago(8 * DAY),
    createdAt: ago(46 * DAY),
  },
  {
    url: "https://store.steampowered.com",
    title: "Steam",
    description: "Steam is the ultimate destination for playing, discussing and creating games.",
    siteName: "Steam",
    categorySlug: "gaming",
    tags: ["games", "store"],
    isFavorite: true,
    openCount: 167,
    lastOpenedAt: ago(6 * HOUR),
    createdAt: ago(52 * DAY),
  },
  {
    url: "https://www.twitch.tv",
    title: "Twitch",
    description: "Stream and watch live gaming, esports, music and creative content.",
    siteName: "Twitch",
    categorySlug: "gaming",
    tags: ["streaming", "gaming"],
    isFavorite: false,
    openCount: 102,
    lastOpenedAt: ago(14 * HOUR),
    createdAt: ago(45 * DAY),
  },
  {
    url: "https://open.spotify.com",
    title: "Spotify",
    description: "Play millions of songs and podcasts, and discover new artists and tracks.",
    siteName: "Spotify",
    categorySlug: "music",
    tags: ["music", "streaming", "podcasts"],
    isFavorite: true,
    openCount: 198,
    lastOpenedAt: ago(50 * 60 * 1000),
    createdAt: ago(59 * DAY),
  },
  {
    url: "https://soundcloud.com",
    title: "SoundCloud",
    description:
      "Discover and listen to music and podcasts from a global community of creators.",
    siteName: "SoundCloud",
    categorySlug: "music",
    tags: ["music", "free", "discover"],
    isFavorite: false,
    openCount: 39,
    lastOpenedAt: ago(9 * DAY),
    createdAt: ago(25 * DAY),
  },
  {
    url: "https://www.notion.so",
    title: "Notion",
    description: "A connected workspace where you write, plan, organize and get things done.",
    siteName: "Notion",
    categorySlug: "others",
    tags: ["notes", "productivity"],
    isFavorite: false,
    openCount: 88,
    lastOpenedAt: ago(8 * HOUR),
    createdAt: ago(50 * DAY),
  },
  {
    url: "https://www.reddit.com",
    title: "Reddit",
    description: "Dive into anything — communities, discussions and endless internet culture.",
    siteName: "Reddit",
    categorySlug: "others",
    tags: ["social", "news", "free"],
    isFavorite: false,
    openCount: 143,
    lastOpenedAt: ago(3 * HOUR),
    createdAt: ago(57 * DAY),
  },
];

const DEMO_EMAIL = "milan@milanverse.dev";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.startsWith("postgres")) {
    console.warn(
      "[seed] DATABASE_URL is not set — skipping seed (app runs in demo mode).\n" +
        "[seed] Configure .env with your Neon connection string and re-run: npm run db:seed",
    );
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { name: "Milan", image: null },
      create: { name: "Milan", email: DEMO_EMAIL, emailVerified: new Date() },
    });

    // Idempotent reset of this user's content (cascades to LinkTag rows).
    await prisma.link.deleteMany({ where: { userId: user.id } });
    await prisma.tag.deleteMany({ where: { userId: user.id } });
    await prisma.category.deleteMany({ where: { userId: user.id } });

    const categories = await Promise.all(
      DEFAULT_CATEGORIES.map((category, index) =>
        prisma.category.create({
          data: {
            userId: user.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            order: index,
          },
        }),
      ),
    );
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const allTags = [...new Set(LINKS.flatMap((link) => link.tags))];
    const tags = await Promise.all(
      allTags.map((name) =>
        prisma.tag.create({ data: { userId: user.id, name } }),
      ),
    );
    const tagByName = new Map(tags.map((t) => [t.name, t.id]));

    for (const link of LINKS) {
      await prisma.link.create({
        data: {
          userId: user.id,
          url: link.url,
          normalizedUrl: normalize(link.url),
          title: link.title,
          description: link.description,
          siteName: link.siteName,
          favicon: `https://www.google.com/s2/favicons?domain=${domain(link.url)}&sz=64`,
          thumbnail: null,
          categoryId: categoryBySlug.get(link.categorySlug) ?? null,
          isFavorite: link.isFavorite,
          openCount: link.openCount,
          lastOpenedAt: link.lastOpenedAt,
          createdAt: link.createdAt,
          updatedAt: link.createdAt,
          tags: {
            create: link.tags.map((name) => ({
              tagId: tagByName.get(name)!,
            })),
          },
        },
      });
    }

    console.log(
      `[seed] Seeded ${LINKS.length} links, ${categories.length} categories, ${tags.length} tags for ${user.email}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

function domain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function normalize(url: string): string {
  const parsed = new URL(url);
  parsed.protocol = "https:";
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  parsed.hash = "";
  const path = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/$/, "") : "";
  return `${parsed.origin}${path}`;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  });
