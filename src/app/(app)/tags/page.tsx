import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Tag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { TagsSkeleton } from "@/components/layout/tags-skeleton";
import { cn } from "@/lib/utils";
import { listTags } from "@/server/tags";
import { requireUser } from "@/server/users";

export const metadata: Metadata = {
  title: "Tags",
  robots: { index: false },
};

/**
 * Tag cloud: every tag the user has, sized by usage. Each chip filters the
 * collection through `/tag/[name]`.
 */
export default function TagsPage() {
  return (
    <Suspense fallback={<TagsSkeleton />}>
      <TagsSection />
    </Suspense>
  );
}

async function TagsSection() {
  await connection();
  const user = await requireUser();
  const tags = await listTags(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description={
          tags.length > 0
            ? `${tags.length} ${tags.length === 1 ? "tag" : "tags"} across your universe — the more a tag is used, the bigger it gets`
            : "Tags you add to links gather here"
        }
      />

      {tags.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No tags yet"
          description="Add tags when you save a link — they become a second way to find it later."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${encodeURIComponent(tag.name)}`}
              className={cn(
                "group flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 font-medium text-foreground/80 outline-none transition hover:border-primary/50 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50",
                tag.linkCount >= 5
                  ? "text-base"
                  : tag.linkCount >= 2
                    ? "text-sm"
                    : "text-xs",
              )}
            >
              <span className="truncate">#{tag.name}</span>
              <span className="tabular-nums text-[10px] text-muted-foreground group-hover:text-primary/70">
                {tag.linkCount}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
