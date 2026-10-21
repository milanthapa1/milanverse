/**
 * URL utilities: normalization, duplicate detection, parsing helpers.
 * Pure functions only — safe to import anywhere (client or server) and unit test.
 */

/** Query params stripped during normalization (tracking / session noise). */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_name",
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "twclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "yclid",
  "_hsenc",
  "_hsmi",
  "vero_id",
  "wickedid",
  "oly_enc_id",
  "oly_anon_id",
  "ref",
  "ref_src",
  "ref_url",
  "spm",
  "scm",
  "cmpid",
  "ncid",
  "mbid",
]);

/** Hosts that are pinned to a canonical form (e.g. youtu.be → youtube.com). */
const HOST_ALIASES: Record<string, string> = {
  "m.youtube.com": "youtube.com",
  "mobile.twitter.com": "x.com",
  "twitter.com": "x.com",
};

const DEFAULT_PORTS = new Set(["80", "443"]);

/** Returns true when the string parses as an http(s) URL. */
export function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Adds https:// when a bare domain was pasted ("netflix.com" → "https://netflix.com"). */
export function ensureProtocol(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  // http(s) and other explicit `scheme://` URLs pass through untouched.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  // Schemes without `//` must not be mistaken for hosts (mailto:, javascript:…).
  if (/^(mailto|tel|javascript|data|file|about|chrome|edge|place|blob):/i.test(trimmed)) {
    return trimmed;
  }
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

/**
 * Normalizes a URL for duplicate detection:
 * - https only (http upgraded)
 * - lowercased host, `www.` stripped, host aliases applied
 * - default ports removed
 * - tracking params stripped, remaining params sorted
 * - fragment removed, trailing slash removed (path kept case-sensitive)
 */
export function normalizeUrl(raw: string): string {
  const url = new URL(ensureProtocol(raw));
  url.protocol = "https:";

  let host = url.hostname.toLowerCase();
  host = host.replace(/^www\./, "");
  host = HOST_ALIASES[host] ?? host;
  url.hostname = host;

  if (DEFAULT_PORTS.has(url.port)) url.port = "";

  url.hash = "";

  const params = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));
  url.search = "";
  for (const [key, value] of params) url.searchParams.append(key, value);

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  url.pathname = path;

  // URL#toString() appends "/" for root paths; drop it for a canonical form.
  return url.pathname === "/" ? url.origin : url.toString();
}

/** Lowercased hostname without `www.` (e.g. "www.netflix.com" → "netflix.com"). */
export function getDomain(raw: string): string {
  try {
    return new URL(ensureProtocol(raw)).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return raw;
  }
}

/** First meaningful label of the domain ("netflix.com" → "netflix"). */
export function getSiteLabel(raw: string): string {
  const domain = getDomain(raw);
  const label = domain.split(".")[0] ?? domain;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Google's s2 favicon service — small, cached, works for most sites. */
export function fallbackFavicon(raw: string): string {
  return `https://www.google.com/s2/favicons?domain=${getDomain(raw)}&sz=64`;
}

/** DuckDuckGo icon service used as a secondary fallback in the Favicon component. */
export function secondaryFavicon(raw: string): string {
  return `https://icons.duckduckgo.com/ip3/${getDomain(raw)}.ico`;
}

/** Converts a pasted value into a full URL, or null when unusable. */
export function coerceUrl(raw: string): string | null {
  const withProtocol = ensureProtocol(raw);
  if (!isValidHttpUrl(withProtocol)) return null;
  try {
    const url = new URL(withProtocol);
    // Credentials in a URL are never meaningful for a bookmark and hide the
    // real host from a casual glance — reject them outright.
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
