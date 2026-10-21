import Link from "next/link";
import { ArrowUpRight, Clock, Flame } from "lucide-react";
import { Favicon } from "@/components/links/favicon";
import { FavoriteToggle } from "@/components/links/favorite-toggle";
import { LinkCardMenu } from "@/components/links/link-card-menu";
import { OpenLink } from "@/components/links/open-link";
import { deriveBadges } from "@/lib/badges";
import { BADGE_TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/time";
import { getDomain } from "@/lib/url";
import type { LinkItem } from "@/types";

interface LinkCardProps {
  link: LinkItem;
  className?: string;
  /** Hide the category chip (dense contexts) */
  hideCategory?: boolean;
}

/**
 * The core launchpad card: favicon, title, badges, tags and open metadata.
 * Whole card routes to the details page; the arrow opens the site directly.
 */
export function LinkCard({ link, className, hideCategory = false }: LinkCardProps) {
  const tint = link.category?.color ?? "#7C5CFF";
  const badges = deriveBadges(link);
  const extraTags = Math.max(0, link.tags.length - 2);
  const trashed = link.deletedAt !== null;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 glow-hover",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/link/${link.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Favicon url={link.url} favicon={link.favicon} tint={tint} className="size-11 text-base" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {link.title}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {link.siteName ?? getDomain(link.url)}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5">
          {!trashed && (
            <FavoriteToggle
              id={link.id}
              isFavorite={link.isFavorite}
              title={link.title}
            />
          )}
          <LinkCardMenu
            id={link.id}
            title={link.title}
            url={link.url}
            trashed={trashed}
          />
          {!trashed && (
            <OpenLink
              id={link.id}
              href={link.url}
              label={`Open ${link.title} in a new tab`}
              className="grid size-8 place-items-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground opacity-70 outline-none transition group-hover:opacity-100 hover:border-primary/50 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowUpRight className="size-4" />
            </OpenLink>
          )}
        </div>
      </div>

      {link.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {link.description}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {badges.map((key) => (
          <span
            key={key}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
              BADGE_TONES[key].bg,
              BADGE_TONES[key].text,
            )}
          >
            {BADGE_TONES[key].label}
          </span>
        ))}
        {link.tags
          .filter((tag) => !badges.some((b) => BADGE_TONES[b].label.toLowerCase() === tag))
          .slice(0, 2)
          .map((tag) => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground outline-none transition hover:border-primary/50 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              #{tag}
            </Link>
          ))}
        {extraTags > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            +{extraTags}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1" title={`${link.openCount} opens`}>
          <Flame className="size-3" aria-hidden />
          {link.openCount}
        </span>
        <span className="flex items-center gap-1" title="Last opened">
          <Clock className="size-3" aria-hidden />
          {formatRelativeTime(link.lastOpenedAt ?? link.createdAt)}
        </span>
        {!hideCategory && link.category && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: link.category.color }}
            />
            <span className="truncate">{link.category.name}</span>
          </span>
        )}
      </div>
    </article>
  );
}
