import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { listActiveLinks } from "@/server/links";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "My Collection", robots: { index: false } };

/** Every non-trashed link, newest first. */
export default function CollectionPage() {
  return (
    <Suspense fallback={<ListSkeleton title="My Collection" />}>
      <CollectionSection />
    </Suspense>
  );
}

async function CollectionSection() {
  await connection();
  const user = await requireUser();
  const links = await listActiveLinks(user.id);
  links.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Collection"
        description={`${links.length} ${links.length === 1 ? "link" : "links"} in your universe`}
      />

      {links.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Your collection is empty"
          description="Links you add will appear here, organized by category."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}
