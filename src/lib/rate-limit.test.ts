import { describe, expect, it } from "vitest";
import { clientIp, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-under-${Date.now()}`;
    const opts = { limit: 5, windowMs: 10_000 };

    const r1 = rateLimit(key, opts);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(4);

    const r2 = rateLimit(key, opts);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(3);
  });

  it("blocks requests once the limit is exceeded", () => {
    const key = `test-block-${Date.now()}`;
    const opts = { limit: 3, windowMs: 10_000 };

    expect(rateLimit(key, opts).success).toBe(true);
    expect(rateLimit(key, opts).success).toBe(true);
    expect(rateLimit(key, opts).success).toBe(true);

    const blocked = rateLimit(key, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("distinguishes between different rate limit keys", () => {
    const keyA = `test-key-a-${Date.now()}`;
    const keyB = `test-key-b-${Date.now()}`;
    const opts = { limit: 1, windowMs: 10_000 };

    expect(rateLimit(keyA, opts).success).toBe(true);
    expect(rateLimit(keyA, opts).success).toBe(false);

    // keyB is unaffected
    expect(rateLimit(keyB, opts).success).toBe(true);
  });
});

describe("clientIp", () => {
  it("extracts first ip from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    expect(clientIp(req)).toBe("203.0.113.195");
  });

  it("falls back to x-real-ip if x-forwarded-for is missing", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    expect(clientIp(req)).toBe("198.51.100.4");
  });

  it("returns anonymous if no IP headers are present", () => {
    const req = new Request("http://localhost");
    expect(clientIp(req)).toBe("anonymous");
  });
});
