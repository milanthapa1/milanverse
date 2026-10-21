import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { Suspense } from "react";
import { connection } from "next/server";
import { CategoryIcon } from "@/components/categories/category-icons";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryBySlug } from "@/server/categories";
import { getLinksByCategory } from "@/server/links";
import { getCurrentUser, requireUser } from "@/server/users";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  // Nullable session read: no redirect from metadata rendering (a signed-out
  // hit is redirected by proxy.ts before it ever gets here). Without
  // generateStaticParams this evaluates per request, never at build.
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Category" };
  const category = await getCategoryBySlug(user.id, slug);
  return { title: category ? category.name : "Category" };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: CategoryPageProps) {
  const { slug } = await params;
  await connection();
  const user = await requireUser();
  const category = await getCategoryBySlug(user.id, slug);
  if (!category) notFound();

  const links = await getLinksByCategory(user.id, category.id);

  return (
    <div className="space-y-6">
      {/* Category hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="relative flex items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl border"
            style={{
              backgroundColor: `${category.color}1F`,
              borderColor: `${category.color}45`,
              color: category.color,
            }}
          >
            <CategoryIcon icon={category.icon} className="size-7" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{category.name}</h1>
            <p className="text-sm text-muted-foreground">
              {links.length} {links.length === 1 ? "link" : "links"}
            </p>
          </div>
        </div>
      </div>

      {links.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={`Nothing in ${category.name} yet`}
          description="Add a link and pick this category — it will show up right here."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title={<Skeleton className="h-8 w-56" />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
