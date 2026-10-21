import { describe, expect, it } from "vitest";
import {
  BookmarkParseError,
  folderToTag,
  MAX_BOOKMARKS,
  parseBookmarksHtml,
} from "@/lib/bookmarks";

const SAMPLE = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
    <DL><p>
        <DT><A HREF="https://www.netflix.com/browse" ADD_DATE="1700000001">Netflix</A>
        <DT><H3 ADD_DATE="1700000002">Design &amp; UI</H3>
        <DL><p>
            <DT><A HREF="https://dribbble.com/shots?utm_source=chrome">Dribbble &mdash; shots</A>
            <DT><A HREF="https://www.figma.com/files">Figma &amp; friends</A>
        </DL><p>
        <DT><A HREF='https://github.com/explore'>GitHub &lt;Explore&gt;</A>
        <DT><A HREF="javascript:alert(1)">Bookmarklet</A>
    </DL><p>
    <DT><A HREF="https://example.com">Example &#x2192; root</A>
</DL><p>`;

describe("parseBookmarksHtml", () => {
  it("extracts bookmarks, titles and folder names", () => {
    const { bookmarks, total, truncated } = parseBookmarksHtml(SAMPLE);

    expect(truncated).toBe(false);
    expect(total).toBe(6);
    expect(bookmarks).toHaveLength(6);

    expect(bookmarks[0]).toMatchObject({
      url: "https://www.netflix.com/browse",
      title: "Netflix",
      folder: "Bookmarks bar",
    });

    // Nested folder wins over its parent.
    expect(bookmarks[1]).toMatchObject({
      url: "https://dribbble.com/shots?utm_source=chrome",
      title: "Dribbble — shots",
      folder: "Design & UI",
    });
    expect(bookmarks[2]).toMatchObject({
      title: "Figma & friends",
      folder: "Design & UI",
    });

    // Single-quoted href and escaped angle brackets.
    expect(bookmarks[3]).toMatchObject({
      url: "https://github.com/explore",
      title: "GitHub <Explore>",
      folder: "Bookmarks bar",
    });

    // Non-http bookmarks are still parsed; the server action filters them.
    expect(bookmarks[4]?.url).toBe("javascript:alert(1)");

    // A root-level bookmark has no folder.
    expect(bookmarks[5]).toMatchObject({
      url: "https://example.com",
      title: "Example → root",
      folder: null,
    });
  });

  it("throws a friendly error for empty or non-bookmark files", () => {
    expect(() => parseBookmarksHtml("")).toThrow(BookmarkParseError);
    expect(() => parseBookmarksHtml("   \n ")).toThrow(BookmarkParseError);
    expect(() => parseBookmarksHtml("<html><body>hello</body></html>")).toThrow(
      /No bookmarks found/,
    );
  });

  it("caps the result at MAX_BOOKMARKS but reports the real total", () => {
    const anchors = Array.from(
      { length: MAX_BOOKMARKS + 17 },
      (_, index) => `<DT><A HREF="https://example.com/${index}">Site ${index}</A>`,
    ).join("\n");
    const html = `<DL><p>${anchors}</DL><p>`;

    const result = parseBookmarksHtml(html);
    expect(result.bookmarks).toHaveLength(MAX_BOOKMARKS);
    expect(result.total).toBe(MAX_BOOKMARKS + 17);
    expect(result.truncated).toBe(true);
  });

  it("rejects files larger than the 2 MB cap", () => {
    expect(() => parseBookmarksHtml("x".repeat(2 * 1024 * 1024 + 1))).toThrow(
      /larger than 2 MB/,
    );
  });
});

describe("folderToTag", () => {
  it("lowercases, collapses whitespace and truncates", () => {
    expect(folderToTag("  Design   & UI ")).toBe("design & ui");
    expect(folderToTag("A".repeat(40))).toHaveLength(32);
  });
});
