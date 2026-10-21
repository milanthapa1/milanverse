/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Suitable for a single serverless instance. For multi-instance deployments
 * (or serverless functions that don't share memory), swap this for a shared
 * store such as Upstash Redis — the call sites only use `rateLimit()`, so the
 * upgrade is a drop-in replacement of this module:
 *   https://upstash.com/docs/oss/sdks/ratelimit/ts/overview
 *
 * Usage:
 *   const rl = rateLimit(`metadata:${ip}`, RATE_LIMITS.metadata);
 *   if (!rl.success) return 429;
 */

interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();

/** Periodically drop stale buckets so memory stays bounded. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = 0;

function sweep(windowMs: number): void {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  /** Requests still allowed in the current window. */
  remaining: number;
  /** Unix ms when the window resets. */
  resetAt: number;
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const { limit, windowMs } = options;
  const now = Date.now();
  sweep(windowMs);

  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    store.set(key, bucket);
    return { success: false, remaining: 0, resetAt: oldest + windowMs };
  }

  bucket.hits.push(now);
  store.set(key, bucket);
  return { success: true, remaining: limit - bucket.hits.length, resetAt: now + windowMs };
}

/** Best-effort client IP (works behind Vercel / common proxies). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "anonymous";
}
