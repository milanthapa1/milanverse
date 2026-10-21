"use client";

/**
 * Footer copyright line. The year renders on the client because
 * `new Date()` is an unstable value during prerendering (cacheComponents).
 */
export function SiteCopyright() {
  return (
    <p className="text-xs text-muted-foreground">
      © {new Date().getFullYear()} MilanVerse. Your universe, your data.
    </p>
  );
}
