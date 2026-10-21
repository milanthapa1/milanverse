import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { listDeletedLinks } from "@/server/links";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Trash", robots: { index: false } };

/** Soft-deleted links (deletedAt set). Restore / delete-forever live in the card's ⋮ menu. */
export default function TrashPage() {
  return (
    <Suspense fallback={<ListSkeleton title="Trash" />}>
      <TrashSection />
    </Suspense>
  );
}

async function TrashSection() {
  await connection();
  const user = await requireUser();
  const links = await listDeletedLinks(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        description={
          links.length > 0
            ? `${links.length} ${links.length === 1 ? "link" : "links"} waiting — restore them anytime`
            : "Deleted links wait here before you remove them for good"
        }
      />

      {links.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted links move here first — you can restore them or delete them permanently."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}
