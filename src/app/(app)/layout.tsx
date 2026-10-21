import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { authEnabled } from "@/lib/auth";
import { listCategories } from "@/server/categories";
import { getCurrentUser } from "@/server/users";

/**
 * Authenticated app shell: sidebar (desktop), sticky header, content column
 * and bottom navigation (mobile).
 *
 * Per the Next.js "Authentication with Cache Components" guide, request-time
 * reads (the session; soon the per-user categories) cannot sit at the layout's
 * top level — they live in async sections behind `<Suspense>` so the static
 * shell prerenders and the authenticated chrome streams in per request. In
 * demo mode nothing suspends, so the shell still prerenders complete.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full">
      <Suspense fallback={<SidebarFallback />}>
        <SidebarSection />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<HeaderFallback />}>
          <HeaderSection />
        </Suspense>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-10 lg:px-8">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}

/** Sidebar data: the session user's categories (behind Suspense). */
async function SidebarSection() {
  // Opt into request-time rendering before touching cookies/headers; without
  // this the prerender attempt calls `auth()` → `headers()` after the prerender
  // has finished, which React reports as a HANGING_PROMISE_REJECTION.
  await connection();
  const user = await getCurrentUser();
  const categories = user ? await listCategories(user.id) : [];
  return <AppSidebar categories={categories} />;
}

/** Header data: the session-backed account menu + categories for the add flow. */
async function HeaderSection() {
  await connection();
  const user = await getCurrentUser();
  const categories = user ? await listCategories(user.id) : [];
  return <AppHeader user={user} authEnabled={authEnabled} categories={categories} />;
}

/** Dimension-matched placeholder so the real sidebar causes no layout shift. */
function SidebarFallback() {
  return (
    <aside
      aria-hidden
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center px-5">
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="flex flex-col gap-2 px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" />
        ))}
        <Skeleton className="mt-4 h-4 w-24 rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={`cat-${i}`} className="h-9 rounded-lg" />
        ))}
      </div>
    </aside>
  );
}

/** Header placeholder preserving the sticky top bar's height. */
function HeaderFallback() {
  return (
    <header
      aria-hidden
      className="glass sticky top-0 z-30 h-16 border-x-0 border-t-0"
    />
  );
}
