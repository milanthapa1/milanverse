import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { getRecentlyOpened } from "@/server/links";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Recently Opened", robots: { index: false } };

export default function RecentlyOpenedPage() {
  return (
    <Suspense fallback={<ListSkeleton title="Recently Opened" />}>
      <RecentlyOpenedSection />
    </Suspense>
  );
}

async function RecentlyOpenedSection() {
  await connection();
  const user = await requireUser();
  const links = await getRecentlyOpened(user.id, 24);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recently Opened"
        description="Your launch history, newest first"
      />

      {links.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing opened yet"
          description="Links you open will show up here so you can jump back in fast."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}
