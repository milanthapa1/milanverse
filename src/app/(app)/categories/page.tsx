import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CategoryManager } from "@/components/categories/category-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/server/categories";
import { requireUser } from "@/server/users";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false },
};

/** Category management: create, rename, re-icon, recolour, delete. */
export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesSection />
    </Suspense>
  );
}

async function CategoriesSection() {
  await connection();
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Shape the map of your universe — names, icons and colours are yours to define."
      />
      <CategoryManager categories={categories} />
    </div>
  );
}

/** Streamed fallback for `/categories` — header + tile grid placeholders. */
function CategoriesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading categories">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
