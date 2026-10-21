import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { BookmarkImporter } from "@/components/links/bookmark-importer";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/server/categories";
import { requireUser } from "@/server/users";

export const metadata: Metadata = {
  title: "Import bookmarks",
  robots: { index: false },
};

export default function ImportBookmarksPage() {
  return (
    <Suspense fallback={<ImportSkeleton />}>
      <ImportSection />
    </Suspense>
  );
}

async function ImportSection() {
  // Request-time read (session + per-user categories) behind a boundary so the
  // static shell can prerender, per the Cache Components rules.
  await connection();
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Import bookmarks"
        description="Bring the bookmarks you already saved into your universe. Duplicates are skipped automatically."
      />
      <BookmarkImporter categories={categories} />
    </div>
  );
}

function ImportSkeleton() {
  return (
    <div
      className="max-w-2xl space-y-6"
      aria-busy="true"
      aria-label="Loading import"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Import bookmarks</h1>
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}
