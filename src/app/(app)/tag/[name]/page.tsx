import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Tag as TagIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { getLinksByTag } from "@/server/links";
import { requireUser } from "@/server/users";

interface TagPageProps {
  params: Promise<{ name: string }>;
}

/** `params.name` arrives URL-decoded from Next, so it is used as-is. */
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { name } = await params;
  return { title: `#${name}`, robots: { index: false } };
}

export default function TagPage({ params }: TagPageProps) {
  return (
    <Suspense fallback={<TagSkeleton />}>
      <TagContent params={params} />
    </Suspense>
  );
}

async function TagContent({ params }: TagPageProps) {
  const { name } = await params;
  await connection();
  const user = await requireUser();
  const links = await getLinksByTag(user.id, name);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-xl border border-border/70 bg-card text-muted-foreground"
            >
              <TagIcon className="size-4" />
            </span>
            #{name}
          </span>
        }
        description={
          links.length > 0
            ? `${links.length} ${links.length === 1 ? "link carries" : "links carry"} this tag`
            : "Nothing carries this tag yet"
        }
      />

      {links.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title={`No links tagged #${name}`}
          description="Tag links while adding or editing them — then they gather here."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}

function TagSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
