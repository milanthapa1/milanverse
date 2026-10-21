import { cn } from "@/lib/utils";
import { LinkCard } from "@/components/links/link-card";
import { MotionItem } from "@/components/effects/motion";
import type { LinkItem } from "@/types";

interface LinkGridProps {
  links: LinkItem[];
  className?: string;
}

/** Responsive link grid: 1 → 2 → 3 columns, staggered on mount. */
export function LinkGrid({ links, className }: LinkGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {links.map((link, index) => (
        <MotionItem key={link.id} index={index} className="h-full">
          <LinkCard link={link} className="h-full" />
        </MotionItem>
      ))}
    </div>
  );
}
