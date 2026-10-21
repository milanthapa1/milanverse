"use client";

import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { purgeLinkAction, restoreLinkAction } from "@/server/actions/links";

interface LinkTrashNoticeProps {
  id: string;
  title: string;
}

/** Banner on the details page for soft-deleted links: restore or purge. */
export function LinkTrashNotice({ id, title }: LinkTrashNoticeProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function restore() {
    startTransition(async () => {
      const result = await restoreLinkAction({ id });
      if (result.ok) {
        toast.success(`Restored “${title}”`);
        router.push("/collection");
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
        router.push("/trash");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
        This link is in your Trash.
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={restore}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="size-3.5" aria-hidden />
          )}
          Restore
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={purge}
          disabled={pending}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete forever
        </Button>
      </div>
    </div>
  );
}
