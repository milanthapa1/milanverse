import { describe, expect, it } from "vitest";
import { popularityScore, rankByPopularity } from "@/lib/ranking";
import type { LinkItem } from "@/types";

describe("popularityScore", () => {
  it("gives higher score to recently opened links with more opens", () => {
    const recentPopular = {
      openCount: 50,
      lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    };

    const oldPopular = {
      openCount: 50,
      lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    };

    const recentScore = popularityScore(recentPopular);
    const oldScore = popularityScore(oldPopular);

    expect(recentScore).toBeGreaterThan(oldScore);
    expect(recentScore).toBeCloseTo(50, 0); // ~50 opens with almost 0 decay
  });

  it("falls back to createdAt when lastOpenedAt is null", () => {
    const neverOpened = {
      openCount: 0,
      lastOpenedAt: null,
      createdAt: new Date().toISOString(),
    };

    expect(popularityScore(neverOpened)).toBe(0);
  });
});

describe("rankByPopularity", () => {
  const mockLinks: LinkItem[] = [
    {
      id: "1",
      url: "https://example.com/1",
      normalizedUrl: "example.com/1",
      title: "Low opens",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat1",
      category: null,
      tags: [],
      isFavorite: false,
      openCount: 2,
      lastOpenedAt: new Date().toISOString(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      url: "https://example.com/2",
      normalizedUrl: "example.com/2",
      title: "High opens",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat1",
      category: null,
      tags: [],
      isFavorite: false,
      openCount: 100,
      lastOpenedAt: new Date().toISOString(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      url: "https://example.com/3",
      normalizedUrl: "example.com/3",
      title: "Mid opens",
      description: null,
      thumbnail: null,
      favicon: null,
      siteName: "Example",
      categoryId: "cat1",
      category: null,
      tags: [],
      isFavorite: false,
      openCount: 25,
      lastOpenedAt: new Date().toISOString(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("sorts links in descending order of popularity score", () => {
    const ranked = rankByPopularity(mockLinks);
    expect(ranked[0]?.id).toBe("2");
    expect(ranked[1]?.id).toBe("3");
    expect(ranked[2]?.id).toBe("1");
  });

  it("respects the limit parameter", () => {
    const ranked = rankByPopularity(mockLinks, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.id).toBe("2");
    expect(ranked[1]?.id).toBe("3");
  });
});
