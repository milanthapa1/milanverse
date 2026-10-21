import { describe, expect, it } from "vitest";
import { formatFullDate, formatRelativeTime, getTimeOfDay, greetingFor } from "@/lib/time";

describe("getTimeOfDay and greetingFor", () => {
  it("classifies morning hours correctly (5am - 11:59am)", () => {
    const morning = new Date("2026-10-21T08:00:00");
    expect(getTimeOfDay(morning)).toBe("morning");
    expect(greetingFor(morning)).toBe("Good Morning");
  });

  it("classifies afternoon hours correctly (12pm - 4:59pm)", () => {
    const afternoon = new Date("2026-10-21T14:30:00");
    expect(getTimeOfDay(afternoon)).toBe("afternoon");
    expect(greetingFor(afternoon)).toBe("Good Afternoon");
  });

  it("classifies evening hours correctly (5pm - 8:59pm)", () => {
    const evening = new Date("2026-10-21T19:00:00");
    expect(getTimeOfDay(evening)).toBe("evening");
    expect(greetingFor(evening)).toBe("Good Evening");
  });

  it("classifies night hours correctly (9pm - 4:59am)", () => {
    const night = new Date("2026-10-21T23:00:00");
    expect(getTimeOfDay(night)).toBe("night");
    expect(greetingFor(night)).toBe("Good Night");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'Never' for null or empty input", () => {
    expect(formatRelativeTime(null)).toBe("Never");
    expect(formatRelativeTime(undefined)).toBe("Never");
    expect(formatRelativeTime("")).toBe("Never");
  });

  it("returns 'Just now' for timestamps less than 1 minute ago", () => {
    const recent = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatRelativeTime(recent)).toBe("Just now");
  });

  it("returns minutes ago for timestamps under an hour", () => {
    const minutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    expect(formatRelativeTime(minutesAgo)).toBe("15m ago");
  });

  it("returns hours ago for timestamps under 24 hours", () => {
    const hoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(hoursAgo)).toBe("4h ago");
  });

  it("returns days ago for timestamps under 7 days", () => {
    const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(daysAgo)).toBe("3d ago");
  });
});

describe("formatFullDate", () => {
  it("returns '—' for falsy input", () => {
    expect(formatFullDate(null)).toBe("—");
  });

  it("formats valid ISO date into short month and year", () => {
    const formatted = formatFullDate("2026-05-15T10:00:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("May");
  });
});
