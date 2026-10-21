import { LinkCard } from "@/components/links/link-card";
import { Skeleton } from "@/components/ui/skeleton";
import { connection } from "next/server";
import { rankByPopularity } from "@/lib/ranking";
import { demoLinks } from "@/server/demo-data";

/**
 * Landing showcase — marketing preview built from the demo dataset only.
 * The landing page is public and static, so it must never read a session:
 * popularity ranking uses the pure helpers from `lib/ranking`.
 * Dynamic (`connection()`): the decay formula and "last opened" labels are
 * time-relative, so they must render per-request. The landing page wraps
 * this in `<Suspense>` around <ShowcaseSkeleton />.
 */
export async function Showcase() {
  await connection();
  const links = rankByPopularity(
    demoLinks.filter((l) => l.deletedAt === null),
    6,
  );

  return (
    <section id="showcase" className="relative scroll-mt-20 py-8 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you save, <span className="text-primary">instantly findable</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Rich cards with favicons, badges, tags and open counts — ranked by
            what you actually use.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Fallback shown while the dynamic showcase renders (same heading + grid). */
export function ShowcaseSkeleton() {
  return (
    <section id="showcase" aria-hidden className="relative scroll-mt-20 py-8 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Skeleton className="mx-auto h-9 w-80 max-w-full" />
          <Skeleton className="mx-auto h-4 w-full max-w-md" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-shimmer h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  );
}
