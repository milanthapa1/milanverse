import { Skeleton } from "@/components/ui/skeleton";

/** Streamed fallback for `/tags` — chip cloud placeholder, no layout shift. */
export function TagsSkeleton() {
  const widths = [64, 88, 56, 104, 72, 96, 60, 80, 112, 68, 92, 76];

  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tags">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-wrap gap-2">
        {widths.map((width, i) => (
          <Skeleton
            key={i}
            className="h-8 rounded-full"
            style={{ width: `${width}px` }}
          />
        ))}
      </div>
    </div>
  );
}
