import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { getFavoriteLinks } from "@/server/links";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <Suspense fallback={<ListSkeleton title="Favorites" count={3} />}>
      <FavoritesSection />
    </Suspense>
  );
}

async function FavoritesSection() {
  await connection();
  const user = await requireUser();
  const links = await getFavoriteLinks(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description={
          links.length > 0
            ? `${links.length} starred ${links.length === 1 ? "link" : "links"}`
            : "Star links to keep them within reach"
        }
      />

      {links.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the star on any link card or details page and it will land here."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}
