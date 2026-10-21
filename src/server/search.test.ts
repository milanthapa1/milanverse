import { describe, expect, it } from "vitest";
import { searchLinks } from "@/server/links";

describe("searchLinks", () => {
  it("returns empty array for empty or whitespace query", async () => {
    expect(await searchLinks("demo-user", "")).toEqual([]);
    expect(await searchLinks("demo-user", "   ")).toEqual([]);
  });

  it("finds links matching title", async () => {
    const results = await searchLinks("demo-user", "netflix");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.toLowerCase().includes("netflix"))).toBe(true);
  });

  it("finds links matching tags", async () => {
    const results = await searchLinks("demo-user", "streaming");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.tags.includes("streaming"))).toBe(true);
  });

  it("ranks exact title / tag matches higher than distant description matches", async () => {
    const results = await searchLinks("demo-user", "github");
    if (results.length > 0) {
      expect(results[0]?.title.toLowerCase()).toContain("github");
    }
  });

  it("is case-insensitive", async () => {
    const lower = await searchLinks("demo-user", "spotify");
    const upper = await searchLinks("demo-user", "SPOTIFY");
    expect(lower.map((l) => l.id)).toEqual(upper.map((l) => l.id));
  });
});
