import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Clock, LayoutGrid, Link2 } from "lucide-react";
import { CategoryTile } from "@/components/categories/category-tile";
import { StatCard } from "@/components/dashboard/stat-card";
import { LinkGrid } from "@/components/links/link-grid";
import { PageHeader } from "@/components/layout/page-header";
import { LinkCard } from "@/components/links/link-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, greetingFor } from "@/lib/time";
import { getDashboardStats } from "@/server/stats";
import { getPopularLinks, getRecentlyOpened } from "@/server/links";
import { listCategories } from "@/server/categories";
import { requireUser } from "@/server/users";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

/**
 * Per the Next.js "Authentication with Cache Components" guide, request-time
 * reads cannot sit at the route's top level: with `cacheComponents: true` that
 * makes the whole navigation blocking (`blocking-prerender-dynamic`). The page
 * stays a static shell and the session + per-user data stream in from
 * `<DashboardSection>` behind `<Suspense>`.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardSection />
    </Suspense>
  );
}

async function DashboardSection() {
  // Authoritative guard first (signed-out → /signin), then every DAL call is
  // scoped to this user's id. Time-relative values (greeting, "3 hours ago",
  // popularity decay) are recomputed per request because this section sits
  // behind <Suspense> and `getCurrentUser` reads the session — no explicit
  // connection() needed.
  await connection();
  const user = await requireUser();
  const [stats, categories, popular, recent] = await Promise.all([
    getDashboardStats(user.id),
    listCategories(user.id),
    getPopularLinks(user.id, 6),
    getRecentlyOpened(user.id, 3),
  ]);

  const greeting = greetingFor();

  return (
    <div className="space-y-8">
      {/* Greeting + stats */}
      <section className="space-y-4" aria-labelledby="greeting">
        <PageHeader
          title={<span id="greeting">{greeting}, {user.name} 👋</span>}
          description={new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Link2}
            label="Total Links"
            value={String(stats.totalLinks)}
            hint={`${stats.favorites} marked as favorite`}
          />
          <StatCard
            icon={LayoutGrid}
            label="Categories"
            value={String(stats.totalCategories)}
            hint={`${stats.totalTags} tags in orbit`}
          />
          <StatCard
            icon={Clock}
            label="Last Opened"
            value={formatRelativeTime(stats.lastOpenedAt)}
            hint={stats.lastOpenedAt ? "Keep the streak going" : "Open a link to start"}
          />
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="categories-heading" className="text-lg font-semibold tracking-tight">
            Categories
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Popular */}
      <section aria-labelledby="popular-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="popular-heading" className="text-lg font-semibold tracking-tight">
            Popular Links
          </h2>
          <Link
            href="/collection"
            className="text-sm text-primary outline-none transition hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
          >
            View all
          </Link>
        </div>
        <LinkGrid links={popular} />
      </section>

      {/* Recently opened */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="space-y-4">
          <h2 id="recent-heading" className="text-lg font-semibold tracking-tight">
            Recently Opened
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Dimension-matched skeleton so the streamed dashboard causes no layout shift. */
function DashboardFallback() {
  return (
    <div className="space-y-8" aria-hidden>
      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
