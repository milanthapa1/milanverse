import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/categories/category-icons";
import { EditLinkDialog } from "@/components/links/edit-link-dialog";
import { Favicon } from "@/components/links/favicon";
import { FavoriteToggle } from "@/components/links/favorite-toggle";
import { LinkCardMenu } from "@/components/links/link-card-menu";
import { LinkTrashNotice } from "@/components/links/link-trash-notice";
import { OpenLink } from "@/components/links/open-link";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/time";
import { getDomain } from "@/lib/url";
import { cn } from "@/lib/utils";
import { listCategories } from "@/server/categories";
import { getLinkById } from "@/server/links";
import { getCurrentUser, requireUser } from "@/server/users";

interface LinkPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LinkPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Link" };
  const link = await getLinkById(user.id, id);
  return {
    title: link ? link.title : "Link",
    robots: { index: false },
  };
}

export default function LinkPage({ params }: LinkPageProps) {
  return (
    <Suspense fallback={<LinkSkeleton />}>
      <LinkDetailContent params={params} />
    </Suspense>
  );
}

async function LinkDetailContent({ params }: LinkPageProps) {
  const { id } = await params;
  await connection();
  const user = await requireUser();
  const [link, categories] = await Promise.all([
    getLinkById(user.id, id),
    listCategories(user.id),
  ]);
  if (!link) notFound();

  const trashed = link.deletedAt !== null;
  const tint = link.category?.color ?? "#7C5CFF";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        href={trashed ? "/trash" : "/collection"}
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {trashed ? "Back to trash" : "Back to collection"}
      </Link>

      {trashed && <LinkTrashNotice id={link.id} title={link.title} />}

      <article className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
          <Favicon
            url={link.url}
            favicon={link.favicon}
            tint={tint}
            className="size-14 text-xl"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {link.title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {link.siteName ?? getDomain(link.url)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!trashed && (
              <FavoriteToggle
                id={link.id}
                isFavorite={link.isFavorite}
                title={link.title}
              />
            )}
            {!trashed && <EditLinkDialog link={link} categories={categories} />}
            <LinkCardMenu
              id={link.id}
              title={link.title}
              url={link.url}
              trashed={trashed}
            />
          </div>
        </div>

        <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
          {link.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {link.description}
            </p>
          )}

          {(link.category || link.tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {link.category && (
                <Link
                  href={`/category/${link.category.slug}`}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/50"
                  style={{
                    borderColor: `${link.category.color}55`,
                    backgroundColor: `${link.category.color}1A`,
                    color: link.category.color,
                  }}
                >
                  <CategoryIcon icon={link.category.icon} className="size-3.5" />
                  {link.category.name}
                </Link>
              )}
              {link.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground outline-none transition hover:border-primary/50 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {!trashed && (
            <OpenLink
              id={link.id}
              href={link.url}
              label={`Open ${link.title} in a new tab`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-fit rounded-full px-5 font-medium",
              )}
            >
              Open site
              <ArrowUpRight className="size-4" aria-hidden />
            </OpenLink>
          )}

          <dl className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Opens
              </dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                {link.openCount}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Added
              </dt>
              <dd
                className="mt-0.5 text-sm"
                title={new Date(link.createdAt).toLocaleString()}
              >
                {formatRelativeTime(link.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Last opened
              </dt>
              <dd
                className="mt-0.5 text-sm"
                title={
                  link.lastOpenedAt
                    ? new Date(link.lastOpenedAt).toLocaleString()
                    : "Never opened"
                }
              >
                {link.lastOpenedAt
                  ? formatRelativeTime(link.lastOpenedAt)
                  : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Category
              </dt>
              <dd className="mt-0.5 truncate text-sm">
                {link.category?.name ?? "Uncategorized"}
              </dd>
            </div>
          </dl>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Destination
            </p>
            <p className="mt-1 font-mono text-xs break-all text-foreground/80">
              {link.url}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

function LinkSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
