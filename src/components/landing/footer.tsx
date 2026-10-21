import { Suspense } from "react";
import { SiteCopyright } from "@/components/layout/site-copyright";

/** Marketing footer. */
export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        {/* The year is time-unstable: stream it in (falls back to a
            year-less line that never paints on a dynamic route). */}
        <Suspense
          fallback={
            <p className="text-xs text-muted-foreground">
              MilanVerse. Your universe, your data.
            </p>
          }
        >
          <SiteCopyright />
        </Suspense>
      </div>
    </footer>
  );
}
