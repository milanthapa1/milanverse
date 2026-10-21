import { describe, expect, it } from "vitest";
import {
  categoryColorSchema,
  categoryIconSchema,
  categoryNameSchema,
  createCategorySchema,
  slugifyCategoryName,
} from "@/lib/validators/category";
import { createLinkSchema, updateLinkSchema } from "@/lib/validators/link";
import { importBookmarksSchema } from "@/lib/validators/import";
import { metadataRequestSchema, searchQuerySchema } from "@/lib/validators/search";

describe("category validators", () => {
  it("validates category names within limits", () => {
    expect(categoryNameSchema.safeParse("AI Tools").success).toBe(true);
    expect(categoryNameSchema.safeParse("").success).toBe(false);
    expect(categoryNameSchema.safeParse("a".repeat(41)).success).toBe(false);
  });

  it("validates 3 and 6 char hex colors", () => {
    expect(categoryColorSchema.safeParse("#fff").success).toBe(true);
    expect(categoryColorSchema.safeParse("#7C5CFF").success).toBe(true);
    expect(categoryColorSchema.safeParse("red").success).toBe(false);
    expect(categoryColorSchema.safeParse("#12345").success).toBe(false);
  });

  it("validates icon keys", () => {
    expect(categoryIconSchema.safeParse("layout-grid").success).toBe(true);
    expect(categoryIconSchema.safeParse("sparkles").success).toBe(true);
    expect(categoryIconSchema.safeParse("INVALID ICON!").success).toBe(false);
  });

  it("slugifies category names cleanly", () => {
    expect(slugifyCategoryName("Movies and TV")).toBe("movies-and-tv");
    expect(slugifyCategoryName("  Developer & Tools!! ")).toBe("developer-tools");
    expect(slugifyCategoryName("---Special---")).toBe("special");
    expect(slugifyCategoryName("")).toBe("category");
  });

  it("validates full createCategorySchema", () => {
    const valid = createCategorySchema.safeParse({
      name: "Productivity",
      icon: "check-circle",
      color: "#22C55E",
    });
    expect(valid.success).toBe(true);
  });
});

describe("link validators", () => {
  it("accepts valid http and https URLs", () => {
    const valid = createLinkSchema.safeParse({
      url: "https://github.com",
      title: "GitHub",
    });
    expect(valid.success).toBe(true);
  });

  it("coerces bare domains like 'nextjs.org'", () => {
    const valid = createLinkSchema.safeParse({
      url: "nextjs.org",
      title: "Next.js",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid or non-http protocols", () => {
    const invalid = createLinkSchema.safeParse({
      url: "javascript:alert(1)",
      title: "Malicious",
    });
    expect(invalid.success).toBe(false);
  });

  it("caps tags to max 10", () => {
    const tooManyTags = createLinkSchema.safeParse({
      url: "https://example.com",
      title: "Test",
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(tooManyTags.success).toBe(false);
  });

  it("validates updateLinkSchema partial updates", () => {
    const partial = updateLinkSchema.safeParse({
      id: "lnk-123",
      title: "Updated Title",
      isFavorite: true,
    });
    expect(partial.success).toBe(true);
  });
});

describe("import & search validators", () => {
  it("rejects empty import html", () => {
    expect(importBookmarksSchema.safeParse({ html: "" }).success).toBe(false);
  });

  it("validates metadata request url", () => {
    expect(metadataRequestSchema.safeParse({ url: "https://example.com" }).success).toBe(true);
    expect(metadataRequestSchema.safeParse({ url: "" }).success).toBe(false);
  });

  it("validates search query schema defaults", () => {
    const parsed = searchQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.q).toBe("");
      expect(parsed.data.tab).toBe("all");
    }
  });
});
