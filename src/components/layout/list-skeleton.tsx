import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  /** Rendered as the placeholder heading so the route title is present immediately. */
  title: string;
  /** Placeholder card count. Defaults to a full 3×2 grid. */
  count?: number;
}

/**
 * Streamed fallback for the link-list routes (`/collection`, `/trash`,
 * `/recently-opened`, `/favorites`, `/search`, …).
 *
 * Matches `PageHeader` + `LinkGrid` dimensions (1 → 2 → 3 columns) so swapping
 * in the real grid causes no layout shift. Used as the `<Suspense>` fallback
 * that keeps these routes out of `blocking-prerender-dynamic`: the page shell
 * prerenders, only the per-user grid waits on the request.
 */
export function ListSkeleton({ title, count = 6 }: ListSkeletonProps) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={`Loading ${title}`}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
