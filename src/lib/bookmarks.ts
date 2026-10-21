/**
 * Netscape bookmark-file parser (Chrome / Firefox / Safari / Edge HTML exports).
 *
 * Pure, dependency-free and server-safe so it can be unit-tested. The format is
 * a nested list:
 *
 *   <DL><p>
 *     <DT><H3>Folder</H3>
 *     <DL><p>
 *       <DT><A HREF="https://example.com" ADD_DATE="…">Example</A>
 *     </DL><p>
 *   </DL><p>
 *
 * An `<H3>` labels the `<DL>` that immediately follows it, which is how the
 * folder stack is reconstructed without a full DOM parser.
 */

export const MAX_BOOKMARK_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_BOOKMARKS = 500;

export interface ParsedBookmark {
  url: string;
  title: string;
  /** Deepest folder containing the bookmark, when the export includes folders. */
  folder: string | null;
}

export interface BookmarkParseResult {
  bookmarks: ParsedBookmark[];
  /** Every anchor found, before the `MAX_BOOKMARKS` cap. */
  total: number;
  truncated: boolean;
}

export class BookmarkParseError extends Error {
  readonly code = "INVALID_BOOKMARKS_FILE";

  constructor(message: string) {
    super(message);
    this.name = "BookmarkParseError";
  }
}

const TOKEN_PATTERN =
  /<dl\b[^>]*>|<\/dl>|<h3\b[^>]*>([\s\S]*?)<\/h3>|<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** Decode the entities bookmark exports actually contain. */
function decodeEntities(input: string): string {
  return input.replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (match, entity: string) => {
      if (entity.startsWith("#")) {
        const isHex = entity[1]?.toLowerCase() === "x";
        const code = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
        return String.fromCodePoint(code);
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    },
  );
}

/** Strip inline markup (some exports wrap titles in <strong>, etc.). */
function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ");
}

function cleanText(input: string): string {
  return decodeEntities(stripTags(input)).replace(/\s+/g, " ").trim();
}

/** Parse an exported bookmarks file into bookmarks with their folder path. */
export function parseBookmarksHtml(html: string): BookmarkParseResult {
  if (typeof html !== "string" || html.trim().length === 0) {
    throw new BookmarkParseError("The file is empty.");
  }
  if (html.length > MAX_BOOKMARK_FILE_BYTES) {
    throw new BookmarkParseError("That file is larger than 2 MB.");
  }

  const bookmarks: ParsedBookmark[] = [];
  const folders: string[] = [];
  let pendingFolder: string | null = null;
  let total = 0;

  for (const match of html.matchAll(TOKEN_PATTERN)) {
    const token = match[0];

    if (/^<h3/i.test(token)) {
      // Labels the <DL> that follows.
      pendingFolder = cleanText(match[1] ?? "") || null;
      continue;
    }
    if (/^<dl/i.test(token)) {
      folders.push(pendingFolder ?? "");
      pendingFolder = null;
      continue;
    }
    if (/^<\/dl/i.test(token)) {
      folders.pop();
      continue;
    }

    const href = decodeEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    ).trim();
    if (!href) continue;

    total += 1;
    if (bookmarks.length >= MAX_BOOKMARKS) continue;

    bookmarks.push({
      url: href,
      title: cleanText(match[5] ?? ""),
      folder: [...folders].reverse().find((name) => name.length > 0) ?? null,
    });
  }

  if (total === 0) {
    throw new BookmarkParseError(
      "No bookmarks found — export your bookmarks as HTML and try again.",
    );
  }

  return { bookmarks, total, truncated: total > bookmarks.length };
}

/** Folder name → tag name (lowercased, whitespace collapsed, max 32 chars). */
export function folderToTag(folder: string): string {
  return folder.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 32);
}

export interface ExportableBookmark {
  url: string;
  title: string;
  category?: { name: string } | null;
  tags?: string[];
  description?: string | null;
  createdAt?: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generate standard Netscape bookmark HTML format from a list of bookmarks,
 * grouped by category. Compatible with Chrome, Firefox, Safari, Edge and Arc.
 */
export function generateBookmarksHtml(links: ExportableBookmark[]): string {
  const grouped = new Map<string, ExportableBookmark[]>();
  for (const link of links) {
    const categoryName = link.category?.name || "Uncategorized";
    const list = grouped.get(categoryName) ?? [];
    list.push(link);
    grouped.set(categoryName, list);
  }

  const lines: string[] = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    "<!-- This is an automatically generated file.",
    "     It will be read and overwritten.",
    "     DO NOT EDIT! -->",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
  ];

  for (const [categoryName, categoryLinks] of grouped) {
    lines.push(`    <DT><H3>${escapeHtml(categoryName)}</H3>`);
    lines.push("    <DL><p>");
    for (const link of categoryLinks) {
      const timestamp = link.createdAt
        ? Math.floor(new Date(link.createdAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000);
      const tagsAttr =
        link.tags && link.tags.length > 0
          ? ` TAGS="${escapeHtml(link.tags.join(","))}"`
          : "";
      lines.push(
        `        <DT><A HREF="${escapeHtml(link.url)}" ADD_DATE="${timestamp}"${tagsAttr}>${escapeHtml(link.title)}</A>`,
      );
      if (link.description) {
        lines.push(`        <DD>${escapeHtml(link.description)}`);
      }
    }
    lines.push("    </DL><p>");
  }

  lines.push("</DL><p>");
  return lines.join("\n");
}
