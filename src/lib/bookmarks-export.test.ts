import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  generateBookmarksHtml,
  parseBookmarksHtml,
  type ExportableBookmark,
} from "@/lib/bookmarks";

describe("generateBookmarksHtml", () => {
  it("escapes special HTML characters in URLs and titles", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
    expect(escapeHtml('Foo & "Bar"')).toBe("Foo &amp; &quot;Bar&quot;");
  });

  it("generates valid Netscape HTML export with categories as folders", () => {
    const mockLinks: ExportableBookmark[] = [
      {
        url: "https://netflix.com",
        title: "Netflix",
        category: { name: "Movies and TV" },
        tags: ["streaming", "movies"],
        description: "Watch movies online",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        url: "https://github.com",
        title: "GitHub",
        category: { name: "Developer Tools" },
        tags: ["dev", "code"],
        description: "Where the world builds software",
        createdAt: "2026-01-02T00:00:00Z",
      },
    ];

    const html = generateBookmarksHtml(mockLinks);
    expect(html).toContain("<!DOCTYPE NETSCAPE-Bookmark-file-1>");
    expect(html).toContain("<H3>Movies and TV</H3>");
    expect(html).toContain('<A HREF="https://netflix.com"');
    expect(html).toContain("<H3>Developer Tools</H3>");
    expect(html).toContain('<A HREF="https://github.com"');

    // Round-trip test: parse it back with parseBookmarksHtml!
    const parsed = parseBookmarksHtml(html);
    expect(parsed.total).toBe(2);
    expect(parsed.bookmarks[0]?.url).toBe("https://netflix.com");
    expect(parsed.bookmarks[0]?.title).toBe("Netflix");
    expect(parsed.bookmarks[0]?.folder).toBe("Movies and TV");

    expect(parsed.bookmarks[1]?.url).toBe("https://github.com");
    expect(parsed.bookmarks[1]?.title).toBe("GitHub");
    expect(parsed.bookmarks[1]?.folder).toBe("Developer Tools");
  });

  it("handles bookmarks with no category under 'Uncategorized'", () => {
    const mockLinks: ExportableBookmark[] = [
      {
        url: "https://example.com",
        title: "Example Domain",
        category: null,
      },
    ];

    const html = generateBookmarksHtml(mockLinks);
    expect(html).toContain("<H3>Uncategorized</H3>");
    const parsed = parseBookmarksHtml(html);
    expect(parsed.bookmarks[0]?.folder).toBe("Uncategorized");
  });
});
