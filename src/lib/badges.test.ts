import { describe, expect, it } from "vitest";
import { badgeLabel, deriveBadges } from "@/lib/badges";

describe("deriveBadges", () => {
  it("detects streaming badge from tags or title", () => {
    const badges = deriveBadges({
      tags: ["streaming", "movies"],
      title: "Watch TV",
      siteName: "StreamService",
    });
    expect(badges).toContain("streaming");
  });

  it("detects free badge from tags", () => {
    const badges = deriveBadges({
      tags: ["free", "tools"],
      title: "Online Editor",
      siteName: "Editor",
    });
    expect(badges).toContain("free");
  });

  it("detects openSource from github or opensource keyword", () => {
    const badges = deriveBadges({
      tags: ["dev"],
      title: "Cool Project",
      siteName: "github.com",
    });
    expect(badges).toContain("openSource");
  });

  it("caps derived badges at maximum 2 items", () => {
    const badges = deriveBadges({
      tags: ["free", "streaming", "anime", "open-source"],
      title: "Free Anime Streaming on GitHub",
      siteName: "StreamHub",
    });
    expect(badges.length).toBeLessThanOrEqual(2);
  });
});

describe("badgeLabel", () => {
  it("returns human readable labels for tone keys", () => {
    expect(badgeLabel("free")).toBe("Free");
    expect(badgeLabel("streaming")).toBe("Streaming");
    expect(badgeLabel("anime")).toBe("Anime");
    expect(badgeLabel("openSource")).toBe("Open Source");
  });
});
