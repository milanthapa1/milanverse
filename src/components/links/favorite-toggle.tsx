"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/server/actions/links";
import { cn } from "@/lib/utils";

interface FavoriteToggleProps {
  id: string;
  isFavorite: boolean;
  title: string;
  className?: string;
}

/** Star button on link cards — optimistic-free (server refreshes counts). */
export function FavoriteToggle({ id, isFavorite, title, className }: FavoriteToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleFavoriteAction({ id });
      if (result.ok) {
        toast.success(
          result.data.isFavorite ? "Added to favorites" : "Removed from favorites",
          { description: title },
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Remove ${title} from favorites`
          : `Add ${title} to favorites`
      }
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50",
        isFavorite && "text-amber-400 hover:text-amber-500",
        className,
      )}
    >
      <Star className={cn("size-4", isFavorite && "fill-current")} aria-hidden />
    </button>
  );
}
