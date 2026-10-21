import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Activity, ArrowUpRight, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { TimelineSkeleton } from "@/components/layout/timeline-skeleton";
import { formatRelativeTime } from "@/lib/time";
import { getDomain } from "@/lib/url";
import { cn } from "@/lib/utils";
import { listActiveLinks } from "@/server/links";
import { requireUser } from "@/server/users";
import type { LinkItem } from "@/types";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false },
};

interface ActivityEvent {
  key: string;
  type: "added" | "opened";
  at: string;
  link: LinkItem;
}

/**
 * Activity timeline derived from the links themselves (no extra table):
 * every "added" event comes from `createdAt`, every "opened" from
 * `lastOpenedAt`, merged newest-first.
 */
export default function ActivityPage() {
  return (
    <Suspense fallback={<ActivitySkeleton />}>
      <ActivitySection />
    </Suspense>
  );
}

async function ActivitySection() {
  await connection();
  const user = await requireUser();
  const links = await listActiveLinks(user.id);

  const events: ActivityEvent[] = [];
  for (const link of links) {
    events.push({
      key: `added:${link.id}`,
      type: "added",
      at: link.createdAt,
      link,
    });
    if (link.lastOpenedAt) {
      events.push({
        key: `opened:${link.id}`,
        type: "opened",
        at: link.lastOpenedAt,
        link,
      });
    }
  }
  events.sort((a, b) => b.at.localeCompare(a.at));
  const timeline = events.slice(0, 40);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Activity"
        description="Everything that happened in your universe — saves and visits, newest first."
      />

      {timeline.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Save your first link or open one from your collection — the story starts here."
        />
      ) : (
        <ol className="relative space-y-5 border-l border-border/70 pl-6">
          {timeline.map((event) => (
            <li key={event.key} className="relative">
              <span
                className={cn(
                  "absolute top-0.5 -left-[35px] grid size-6 place-items-center rounded-full border border-border/70 bg-card",
                  event.type === "added" ? "text-primary" : "text-muted-foreground",
                )}
              >
                {event.type === "added" ? (
                  <Plus className="size-3" aria-hidden />
                ) : (
                  <ArrowUpRight className="size-3" aria-hidden />
                )}
              </span>

              <p className="text-sm">
                <span className="text-muted-foreground">
                  {event.type === "added" ? "Added " : "Opened "}
                </span>
                <Link
                  href={`/link/${event.link.id}`}
                  className="font-medium outline-none transition hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {event.link.title}
                </Link>
                {event.type === "opened" && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {getDomain(event.link.url)}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatRelativeTime(event.at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Streamed fallback for `/activity` — timeline rail + entry placeholders. */
function ActivitySkeleton() {
  return <TimelineSkeleton title="Activity" />;
}
