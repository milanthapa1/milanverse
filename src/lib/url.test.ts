import { describe, expect, it } from "vitest";
import {
  coerceUrl,
  ensureProtocol,
  fallbackFavicon,
  getDomain,
  getSiteLabel,
  isValidHttpUrl,
  normalizeUrl,
  secondaryFavicon,
} from "@/lib/url";

describe("ensureProtocol", () => {
  it("adds https to bare domains", () => {
    expect(ensureProtocol("netflix.com")).toBe("https://netflix.com");
    expect(ensureProtocol("  example.com/watch  ")).toBe(
      "https://example.com/watch",
    );
  });

  it("keeps existing schemes", () => {
    expect(ensureProtocol("http://example.com")).toBe("http://example.com");
    expect(ensureProtocol("https://example.com")).toBe("https://example.com");
  });

  it("uses http for local development hosts", () => {
    expect(ensureProtocol("localhost:3000")).toBe("http://localhost:3000");
    expect(ensureProtocol("127.0.0.1:8080/path")).toBe(
      "http://127.0.0.1:8080/path",
    );
  });

  it("leaves an empty value empty", () => {
    expect(ensureProtocol("   ")).toBe("");
  });
});

describe("normalizeUrl", () => {
  it("upgrades http to https", () => {
    expect(normalizeUrl("http://example.com")).toBe("https://example.com");
  });

  it("strips www, fragments, tracking params and trailing slashes", () => {
    expect(
      normalizeUrl(
        "http://www.Example.com/Watch/?utm_source=newsletter&b=2&a=1#player",
      ),
    ).toBe("https://example.com/Watch?a=1&b=2");
  });

  it("sorts remaining query params so order never creates duplicates", () => {
    expect(normalizeUrl("https://example.com/search?z=1&a=2")).toBe(
      normalizeUrl("https://example.com/search?a=2&z=1"),
    );
  });

  it("keeps paths case-sensitive", () => {
    expect(normalizeUrl("https://example.com/Path")).toBe(
      "https://example.com/Path",
    );
    expect(normalizeUrl("https://example.com/Path")).not.toBe(
      normalizeUrl("https://example.com/path"),
    );
  });

  it("applies host aliases", () => {
    expect(normalizeUrl("https://twitter.com/milan")).toBe(
      "https://x.com/milan",
    );
    expect(normalizeUrl("https://mobile.twitter.com/milan")).toBe(
      "https://x.com/milan",
    );
    expect(normalizeUrl("https://m.youtube.com/watch?v=abc")).toBe(
      "https://youtube.com/watch?v=abc",
    );
  });

  it("removes default ports", () => {
    expect(normalizeUrl("https://example.com:443/a")).toBe(
      "https://example.com/a",
    );
    expect(normalizeUrl("http://example.com:80/a")).toBe(
      "https://example.com/a",
    );
  });
});

describe("isValidHttpUrl / coerceUrl", () => {
  it("accepts http(s) URLs only", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("http://localhost:3000")).toBe(true);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
  });

  it("coerces pasted values into absolute URLs", () => {
    expect(coerceUrl("netflix.com")).toBe("https://netflix.com/");
    expect(coerceUrl("http://example.com/x")).toBe("http://example.com/x");
  });

  it("rejects non-http schemes and junk", () => {
    expect(coerceUrl("javascript:alert(1)")).toBeNull();
    expect(coerceUrl("data:text/html,hi")).toBeNull();
    expect(coerceUrl("mailto:hi@example.com")).toBeNull();
  });
});

describe("domain helpers", () => {
  it("derives a display domain", () => {
    expect(getDomain("https://www.Netflix.com/browse")).toBe("netflix.com");
    expect(getDomain("netflix.com")).toBe("netflix.com");
  });

  it("derives a site label from the domain", () => {
    expect(getSiteLabel("https://www.netflix.com")).toBe("Netflix");
    expect(getSiteLabel("https://github.com/milan")).toBe("Github");
  });

  it("builds favicon URLs for the allowed services", () => {
    expect(fallbackFavicon("https://netflix.com")).toBe(
      "https://www.google.com/s2/favicons?domain=netflix.com&sz=64",
    );
    expect(secondaryFavicon("https://netflix.com")).toBe(
      "https://icons.duckduckgo.com/ip3/netflix.com.ico",
    );
  });
});
