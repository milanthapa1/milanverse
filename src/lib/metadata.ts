import ogs from "open-graph-scraper";
import { SsrfError, safeFetch } from "@/lib/ssrf";
import { coerceUrl, fallbackFavicon, getSiteLabel, normalizeUrl } from "@/lib/url";
import type { SiteMetadata } from "@/types";

/**
 * open-graph-scraper v6 returns `SuccessResult | ErrorResult`, discriminated by
 * `error`; the scraped tags live on `.result` (OgObject).
 */
type SuccessResult = Extract<Awaited<ReturnType<typeof ogs>>, { error: false }>;
type OgObject = SuccessResult["result"];

/**
 * Auto-fetch metadata pipeline (the "magic loop" input stage).
 *
 * 1. Validate + SSRF-guard the URL (DNS-resolved, private ranges blocked)
 * 2. Fetch HTML ourselves with the guarded client (3 redirects, 5s, 2MB cap)
 * 3. Parse Open Graph / Twitter / generic meta with open-graph-scraper
 * 4. Fall back to favicon + domain name when OG data is missing
 * 5. Suggest tags from keyword heuristics
 */

const TAG_RULES: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /netflix|primevideo|prime video|disney|hulu|max\.com|stream|movie|film|series|episode|\btv\b|show/i, tag: "streaming" },
  { pattern: /anime|manga|crunchyroll|otaku/i, tag: "anime" },
  { pattern: /sport|football|soccer|cricket|nba|nfl|\bf1\b|tennis|espn|livescore|dazn|score/i, tag: "sports" },
  { pattern: /\bai\b|artificial intelligence|\bllm\b|gpt|claude|copilot|machine learning|chatbot|openai|anthropic/i, tag: "ai" },
  { pattern: /code|coding|github|gitlab|api|programming|developer|software|stackoverflow|npm|docs/i, tag: "dev" },
  { pattern: /learn|course|tutorial|education|school|university|study|academy|training/i, tag: "learning" },
  { pattern: /game|gaming|steam|twitch|esports|xbox|playstation|nintendo|ign\.com/i, tag: "gaming" },
  { pattern: /music|song|podcast|spotify|audio|playlist|soundcloud/i, tag: "music" },
  { pattern: /\bnews\b|blog|magazine|article|headline/i, tag: "news" },
  { pattern: /free|open ?source|oss/i, tag: "free" },
  { pattern: /shop|store|buy|price|deal|market/i, tag: "shopping" },
  { pattern: /document|reference|spec|\bmdn\b|guide|manual/i, tag: "docs" },
];

export function suggestTags(...parts: Array<string | null | undefined>): string[] {
  const haystack = parts.filter(Boolean).join(" ");
  const matches = TAG_RULES.filter((rule) => rule.pattern.test(haystack)).map(
    (rule) => rule.tag,
  );
  return [...new Set(matches)].slice(0, 5);
}

function absolute(base: string, maybeRelative?: string | null): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

function firstImage(
  images: Array<{ url?: string }> | undefined,
): string | undefined {
  for (const image of images ?? []) {
    if (image.url) return image.url;
  }
  return undefined;
}

/**
 * Fetch metadata for a URL. Throws `SsrfError` for blocked targets; network
 * and parse failures degrade to fallback metadata instead of throwing.
 */
export async function fetchSiteMetadata(rawUrl: string): Promise<SiteMetadata> {
  const url = coerceUrl(rawUrl);
  if (!url) throw new SsrfError("Invalid URL");

  const normalizedUrl = normalizeUrl(url);
  const domainLabel = getSiteLabel(url);

  let html: string | null = null;
  try {
    const response = await safeFetch(url);
    const contentType = response.headers["content-type"] ?? "text/html";
    if (response.status >= 200 && response.status < 300 && !/json|image|video|audio|pdf/i.test(contentType)) {
      html = response.body;
    }
  } catch (err) {
    // Blocked by SSRF guard → propagate; anything else → degrade to fallback.
    if (err instanceof SsrfError) throw err;
    html = null;
  }

  let og: OgObject | null = null;
  if (html) {
    try {
      const parsed = await ogs({ html, url });
      if (!parsed.error) og = parsed.result;
    } catch {
      og = null;
    }
  }

  const title =
    og?.ogTitle ?? og?.twitterTitle ?? domainLabel;
  const description = og?.ogDescription ?? og?.twitterDescription ?? null;
  const thumbnail = absolute(url, firstImage(og?.ogImage));
  const favicon = absolute(url, og?.favicon) ?? fallbackFavicon(url);
  const siteName = og?.ogSiteName ?? domainLabel;

  const suggestedTags = suggestTags(title, description, siteName, domainLabel);

  return {
    url,
    normalizedUrl,
    title,
    description,
    thumbnail,
    favicon,
    siteName,
    suggestedTags,
    fallback: !og,
  };
}
