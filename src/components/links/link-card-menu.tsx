"use client";

import { Copy, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteLinkAction,
  purgeLinkAction,
  restoreLinkAction,
} from "@/server/actions/links";

interface LinkCardMenuProps {
  id: string;
  title: string;
  url: string;
  /** true on the Trash page — the menu swaps to Restore / Delete forever. */
  trashed: boolean;
}

/**
 * Per-card ⋮ menu. Branches on the trash state:
 *  - active  → Copy link · Move to trash (with an Undo toast)
 *  - trashed → Restore · Delete forever
 */
export function LinkCardMenu({ id, title, url, trashed }: LinkCardMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function copyLink() {
    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy the link"));
  }

  function moveToTrash() {
    startTransition(async () => {
      const result = await deleteLinkAction({ id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast(`Moved “${title}” to trash`, {
        description: "You can restore it from the Trash page.",
        action: {
          label: "Undo",
          onClick: () => {
            startTransition(async () => {
              const restore = await restoreLinkAction({ id });
              if (restore.ok) {
                toast.success("Restored to your collection");
                router.refresh();
              } else {
                toast.error(restore.error);
              }
            });
          },
        },
      });
      router.refresh();
    });
  }

  function restore() {
    startTransition(async () => {
      const result = await restoreLinkAction({ id });
      if (result.ok) {
        toast.success(`Restored “${title}”`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function purge() {
    startTransition(async () => {
      const result = await purgeLinkAction({ id });
      if (result.ok) {
        toast.success("Deleted forever");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${title}`}
        disabled={pending}
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground data-[open]:bg-muted data-[open]:text-foreground"
          />
        }
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!trashed ? (
          <>
            <DropdownMenuItem onClick={copyLink}>
              <Copy aria-hidden />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={moveToTrash}>
              <Trash2 aria-hidden />
              Move to trash
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={restore}>
              <RotateCcw aria-hidden />
              Restore
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={purge}>
              <Trash2 aria-hidden />
              Delete forever
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
