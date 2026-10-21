import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import type { LookupAddress } from "node:dns";

/**
 * SSRF protection for server-side URL fetching (`POST /api/metadata`).
 *
 * Defences:
 *  1. Scheme allow-list (http/https only)
 *  2. Hostname block-list (localhost, *.local, *.internal, …)
 *  3. DNS resolution — every A/AAAA record is checked before connecting
 *  4. IP block-list: loopback, private, link-local, CGNAT, cloud metadata,
 *     multicast, reserved, and the IPv6 equivalents (::1, fc00::/7, fe80::/10)
 *  5. Connect-time pinning: `safeFetch` supplies its own `lookup` so the IP
 *     validated in step 3/4 is the one we actually connect to (anti rebinding)
 *  6. Manual redirect handling — max 3 hops, each hop re-validated from scratch
 *  7. 5s total timeout + 2MB response body cap (identity encoding: no gzip bomb)
 */

export const MAX_REDIRECTS = 3;
export const TIMEOUT_MS = 5_000;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".consul",
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "0.0.0.0",
  "broadcasthost",
  "metadata.google.internal",
  "instance-data", // AWS/GCP instance metadata aliases
]);

/** Cloud metadata endpoints that must never be reachable. */
const METADATA_IPS = new Set([
  "169.254.169.254", // AWS / Azure / GCP / OpenStack
  "100.100.100.200", // Alibaba Cloud
  "fd00:ec2::254", // AWS IMDSv6
  "metadata.google.internal",
]);

export class SsrfError extends Error {
  readonly code = "SSRF_BLOCKED";
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

function ipv4Octets(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => Number.parseInt(p, 10));
  return octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? octets : null;
}

/** True for IPv4 ranges that must never be fetched. */
export function isBlockedIpv4(ip: string): boolean {
  const o = ipv4Octets(ip);
  if (!o) return true; // unparseable → treat as unsafe
  const [a, b, c] = o;

  if (METADATA_IPS.has(ip)) return true;
  if (a === 0) return true; // 0.0.0.0/8 ("this network")
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24 IETF special
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast (224/4) + reserved (240/4) + broadcast
  return false;
}

/** True for IPv6 addresses in blocked ranges (including IPv4-mapped forms). */
export function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (METADATA_IPS.has(normalized)) return true;

  // IPv4-mapped / IPv4-compatible: ::ffff:127.0.0.1
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isBlockedIpv4(mapped[1]);
  const hexMapped = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped?.[1] && hexMapped[2]) {
    const hi = Number.parseInt(hexMapped[1], 16);
    const lo = Number.parseInt(hexMapped[2], 16);
    const v4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isBlockedIpv4(v4);
  }

  if (normalized === "::" || normalized === "::1") return true; // unspecified + loopback
  if (/^f[cd]/.test(normalized)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(normalized)) return true; // fe80::/10 link-local
  if (/^ff/.test(normalized)) return true; // ff00::/8 multicast
  if (/^64:ff9b:/.test(normalized)) return true; // NAT64
  if (/^2001:0?db8:/.test(normalized)) return true; // documentation range
  if (/^(100|2001):/.test(normalized) && normalized.startsWith("100::")) return true;
  return false;
}

/** Convenience wrapper covering both families. */
export function isBlockedIp(ip: string): boolean {
  const family = ip.includes(":") ? "v6" : "v4";
  return family === "v6" ? isBlockedIpv6(ip) : isBlockedIpv4(ip);
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  return BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** Resolve every address for a hostname (A + AAAA). */
async function resolveAll(hostname: string): Promise<LookupAddress[]> {
  return new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) reject(new SsrfError(`DNS resolution failed for ${hostname}: ${err.code ?? err.message}`));
      else resolve(addresses);
    });
  });
}

/**
 * Parse + validate a URL without touching the network.
 * Throws `SsrfError` when the target is not allowed.
 */
export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new SsrfError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError(`Unsupported protocol: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new SsrfError("URLs with embedded credentials are not allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(hostname)) {
    throw new SsrfError(`Blocked hostname: ${hostname}`);
  }

  // Literal IP in the URL → validate directly (no DNS needed).
  // isIP() returns 0 for hostnames, 4 for IPv4, 6 for IPv6 — only call
  // isBlockedIp() when the hostname is actually a numeric IP address.
  if (isIP(hostname) !== 0 && isBlockedIp(hostname)) {
    throw SsrfErrorSafe(hostname);
  }

  const addresses = await resolveAll(hostname);
  if (addresses.length === 0) {
    throw new SsrfError(`No DNS records for ${hostname}`);
  }
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new SsrfError(`Resolved to a blocked address (${address}) for ${hostname}`);
    }
  }
  return url;
}

function SsrfErrorSafe(hostname: string): SsrfError {
  return new SsrfError(`Blocked IP address: ${hostname}`);
}

/** DNS lookup that refuses to return blocked addresses at connect time. */
function guardedLookup(
  hostname: string,
  options: { all?: boolean },
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[]) => void,
): void {
  dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) {
      callback(err, []);
      return;
    }
    const list = Array.isArray(addresses) ? addresses : [{ address: addresses as string, family: 4 }];
    if (list.length === 0 || list.some((a) => isBlockedIp(a.address))) {
      const e = new Error(`Blocked DNS result for ${hostname}`) as NodeJS.ErrnoException;
      e.code = "EACCES";
      callback(e, []);
      return;
    }
    if (options?.all) callback(null, list as LookupAddress[]);
    else callback(null, list[0]!.address);
  });
}

export interface SafeFetchResult {
  status: number;
  /** Final URL after redirects (may differ from the input). */
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
}

/**
 * Fetch a URL with SSRF guards applied at every step.
 * Returns the decoded body as UTF-8 text (capped at `maxBytes`).
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_RESPONSE_BYTES;

  let current = await assertSafeUrl(rawUrl);
  let redirects = 0;

  for (;;) {
    const result = await requestOnce(current, timeoutMs, maxBytes, options.headers);
    if (result.status >= 300 && result.status < 400) {
      const location = result.headers.location;
      if (!location) return result;
      if (++redirects > maxRedirects) {
        throw new SsrfError(`Too many redirects (max ${maxRedirects})`);
      }
      const next = new URL(location, current);
      current = await assertSafeUrl(next.toString());
      continue;
    }
    return result;
  }
}

function requestOnce(
  url: URL,
  timeoutMs: number,
  maxBytes: number,
  extraHeaders?: Record<string, string>,
): Promise<SafeFetchResult> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const req = transport.request(
      url,
      {
        method: "GET",
        // Connect-time IP validation: closes the DNS-rebinding window.
        lookup: guardedLookup as never,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; MilanVerseBot/1.0; +https://milanverse.dev/bot) Accept-Encoding: identity",
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "accept-encoding": "identity",
          ...extraHeaders,
        },
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headers = res.headers;

        if (status >= 300 && status < 400) {
          res.resume(); // drain
          resolve({ status, url: url.toString(), headers, body: "" });
          return;
        }

        const encoding = headers["content-encoding"];
        const contentType = headers["content-type"] ?? "";
        let bytes = 0;
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > maxBytes) {
            res.destroy(new SsrfError(`Response exceeded ${maxBytes} bytes`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const isText = /text\/|json|xml|xhtml|csv/i.test(contentType) || !contentType;
          if (!isText && encoding !== "identity") {
            resolve({ status, url: url.toString(), headers, body: "" });
            return;
          }
          resolve({
            status,
            url: url.toString(),
            headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
        res.on("error", (err) => reject(err));
      },
    );

    req.on("timeout", () => {
      req.destroy(new SsrfError(`Request timed out after ${timeoutMs}ms`));
    });
    req.on("error", (err) => reject(err));
    req.end();
  });
}
