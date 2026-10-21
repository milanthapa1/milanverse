import { describe, expect, it } from "vitest";
import {
  computeDemoStats,
  computeDemoTags,
  demoCreateLink,
  demoLinks,
  demoPurgeLink,
  demoSetDeleted,
  demoTrackOpen,
  demoUpdateLink,
  recomputeDemoCategoryCounts,
} from "@/server/demo-data";

describe("demo data operations", () => {
  it("creates a new demo link and computes fields correctly", () => {
    const initialCount = demoLinks.length;
    const link = demoCreateLink({
      url: "https://vitest.dev",
      normalizedUrl: "vitest.dev",
      title: "Vitest Next Generation Testing",
      description: "Blazing fast unit test framework",
      thumbnail: null,
      favicon: null,
      siteName: "Vitest",
      categoryId: "cat-dev",
      tags: ["test", "dev"],
    });

    expect(link.id).toMatch(/^lnk-demo-/);
    expect(link.title).toBe("Vitest Next Generation Testing");
    expect(link.openCount).toBe(0);
    expect(link.deletedAt).toBeNull();
    expect(demoLinks.length).toBe(initialCount + 1);
  });

  it("updates an existing link", () => {
    const link = demoCreateLink({
      url: "https://example.org/test",
      normalizedUrl: "example.org/test",
      title: "Before Update",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat-others",
      tags: [],
    });

    const updated = demoUpdateLink(link.id, {
      title: "After Update",
      isFavorite: true,
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe("After Update");
    expect(updated?.isFavorite).toBe(true);
  });

  it("soft-deletes and restores a link", () => {
    const link = demoCreateLink({
      url: "https://example.org/soft-del",
      normalizedUrl: "example.org/soft-del",
      title: "Soft Delete Test",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat-others",
      tags: [],
    });

    const now = new Date().toISOString();
    expect(demoSetDeleted(link.id, now)).not.toBeNull();
    const inStore = demoLinks.find((l) => l.id === link.id);
    expect(inStore?.deletedAt).toBe(now);

    // Restore
    expect(demoSetDeleted(link.id, null)).not.toBeNull();
    expect(inStore?.deletedAt).toBeNull();
  });

  it("purges a link permanently", () => {
    const link = demoCreateLink({
      url: "https://example.org/purge-me",
      normalizedUrl: "example.org/purge-me",
      title: "Purge Me",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat-others",
      tags: [],
    });

    expect(demoPurgeLink(link.id)).toBe(true);
    expect(demoLinks.some((l) => l.id === link.id)).toBe(false);
  });

  it("tracks open count and updates lastOpenedAt", () => {
    const link = demoCreateLink({
      url: "https://example.org/track-open",
      normalizedUrl: "example.org/track-open",
      title: "Track Open Test",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat-others",
      tags: [],
    });

    const prevCount = link.openCount;
    expect(demoTrackOpen(link.id)).toBe(true);
    const refreshed = demoLinks.find((l) => l.id === link.id);
    expect(refreshed?.openCount).toBe(prevCount + 1);
    expect(refreshed?.lastOpenedAt).not.toBeNull();
  });

  it("computes stats, tags, and category counts without throwing", () => {
    recomputeDemoCategoryCounts();
    const stats = computeDemoStats();
    expect(stats.totalLinks).toBeGreaterThan(0);
    expect(stats.totalCategories).toBeGreaterThan(0);

    const tags = computeDemoTags();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });
});
