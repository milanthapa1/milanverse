import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authEnabled } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/time";
import { getDashboardStats } from "@/server/stats";
import { requireUser } from "@/server/users";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsSection />
    </Suspense>
  );
}

async function SettingsSection() {
  await connection();
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);

  const cells = [
    { label: "Links", value: stats.totalLinks },
    { label: "Categories", value: stats.totalCategories },
    { label: "Tags", value: stats.totalTags },
    { label: "Favorites", value: stats.favorites },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile, appearance and universe at a glance."
      />

      {/* Profile */}
      <section className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5">
        <Avatar className="size-14">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {user.email || "Demo mode — no account connected"}
          </p>
        </div>
      </section>

      {/* Appearance */}
      <section className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5">
        <div>
          <p className="font-medium">Appearance</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Dark is the default. Light mode is fully supported.
          </p>
        </div>
        <ThemeToggle />
      </section>

      {/* Universe stats */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Your universe
          </h2>
          {stats.lastOpenedAt && (
            <p className="text-xs text-muted-foreground">
              Last opened {formatRelativeTime(stats.lastOpenedAt)}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cells.map((cell) => (
            <div
              key={cell.label}
              className="rounded-2xl border border-border/70 bg-card p-4"
            >
              <dt className="text-xs text-muted-foreground">{cell.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {cell.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Data */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Data management
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5">
            <div>
              <p className="font-medium">Import bookmarks</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Bring your browser&apos;s HTML bookmark export into your universe.
                Duplicates are skipped.
              </p>
            </div>
            <div>
              <Button variant="outline" nativeButton={false} render={<Link href="/import" />}>
                <Upload className="size-4" aria-hidden />
                Import
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5">
            <div>
              <p className="font-medium">Export bookmarks</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Download your universe as standard Netscape HTML compatible with all major browsers.
              </p>
            </div>
            <div>
              <Button variant="outline" nativeButton={false} render={<a href="/api/export" download />}>
                <Download className="size-4" aria-hidden />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      {authEnabled ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5">
          <div>
            <p className="font-medium">Account</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>
          <SignOutButton />
        </section>
      ) : (
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="font-medium">Demo mode</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            No database or OAuth is configured, so everything you save lives in
            memory and resets with the server. See the README to make your
            universe permanent.
          </p>
        </section>
      )}
    </div>
  );
}

/** Streamed fallback for `/settings` — profile card + stat cells. */
function SettingsSkeleton() {
  return (
    <div className="max-w-3xl space-y-6" aria-busy="true" aria-label="Loading settings">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
