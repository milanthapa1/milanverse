import Link from "next/link";
import { CategoryIcon } from "@/components/categories/category-icons";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

/**
 * Quick category dock under the hero — 8 tinted pills that jump straight
 * into a category view. Horizontally scrollable on mobile.
 */
export function CategoryDock() {
  return (
    <div
      className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
      aria-label="Quick categories"
    >
      {DEFAULT_CATEGORIES.map((category) => (
        <Link
          key={category.slug}
          href={`/category/${category.slug}`}
          className="group flex shrink-0 snap-start items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-sm text-foreground/90 backdrop-blur transition hover:-translate-y-0.5 hover:border-[color:var(--dock-color)]/50 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          style={{ ["--dock-color" as string]: category.color }}
        >
          <span
            className="grid size-6 place-items-center rounded-full"
            style={{
              backgroundColor: `${category.color}22`,
              color: category.color,
            }}
          >
            <CategoryIcon icon={category.icon} className="size-3.5" />
          </span>
          <span className="whitespace-nowrap font-medium">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}
