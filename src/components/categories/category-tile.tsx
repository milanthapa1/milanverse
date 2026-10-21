import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/categories/category-icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryTileProps {
  category: Category;
  className?: string;
}

/**
 * Accent-tinted category card for the dashboard grid.
 * Each category carries its own accent color (icon, tint, hover glow).
 */
export function CategoryTile({ category, className }: CategoryTileProps) {
  const color = category.color;
  const count = category.linkCount;

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 glow-hover outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="flex items-start justify-between">
        <span
          className="grid size-11 place-items-center rounded-xl border"
          style={{
            backgroundColor: `${color}1F`,
            borderColor: `${color}45`,
            color,
          }}
        >
          <CategoryIcon icon={category.icon} className="size-5" />
        </span>
        <ArrowUpRight
          className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "link" : "links"}
        </span>
      </span>
    </Link>
  );
}
