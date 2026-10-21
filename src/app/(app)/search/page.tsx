import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SearchX, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LinkGrid } from "@/components/links/link-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { searchQuerySchema } from "@/lib/validators/search";
import { searchLinks } from "@/server/links";
import { requireUser } from "@/server/users";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: SearchPageProps) {
  await connection();
  const user = await requireUser();
  const raw = (await searchParams).q;
  const parsed = searchQuerySchema.safeParse({ q: typeof raw === "string" ? raw : "" });
  const query = parsed.success ? parsed.data.q : "";

  const links = query ? await searchLinks(user.id, query) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={query ? <>Results for “{query}”</> : "Search"}
        description={
          query
            ? `${links.length} ${links.length === 1 ? "match" : "matches"} across your universe`
            : "Find links by title, tag, site or domain"
        }
      />

      {!query ? (
        <EmptyState
          icon={Tag}
          title="Start typing to explore"
          description="Search matches titles, descriptions, tags and domains — try “netflix”, “ai” or “github”."
        />
      ) : links.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`Nothing matched “${query}”`}
          description="Try a shorter keyword, a tag name, or the site's domain."
        />
      ) : (
        <LinkGrid links={links} />
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title={<Skeleton className="h-8 w-72" />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
