import { Skeleton } from "@/components/ui/skeleton";

interface TimelineSkeletonProps {
  title: string;
  count?: number;
}

/** Streamed fallback for `/activity` — bordered rail + entry placeholders. */
export function TimelineSkeleton({ title, count = 8 }: TimelineSkeletonProps) {
  return (
    <div className="max-w-3xl space-y-6" aria-busy="true" aria-label={`Loading ${title}`}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Skeleton className="h-4 w-80" />
      </div>

      <ol className="relative space-y-5 border-l border-border/70 pl-6">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="relative">
            <span className="absolute top-0.5 -left-[35px] size-6 rounded-full border border-border/70 bg-card" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </li>
        ))}
      </ol>
    </div>
  );
}
