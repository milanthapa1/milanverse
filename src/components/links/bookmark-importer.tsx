"use client";

import { CheckCircle2, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/categories/category-icons";
import { Button } from "@/components/ui/button";
import { MAX_BOOKMARK_FILE_BYTES } from "@/lib/bookmarks";
import { cn } from "@/lib/utils";
import { importBookmarksAction } from "@/server/actions/import";
import type { BookmarkImportSummary, Category } from "@/types";

const ALLOWED_EXTENSIONS = [".html", ".htm"] as const;

/**
 * Browser-bookmarks importer.
 *
 * The file is read client-side and posted as text to the server action, which
 * re-validates the size, parses the Netscape export, normalizes URLs and skips
 * duplicates. Nothing is written until the user presses Import.
 */
export function BookmarkImporter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [folderTags, setFolderTags] = useState(true);
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<BookmarkImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pickFile(next: File | null) {
    setError(null);
    setSummary(null);
    if (!next) {
      setFile(null);
      return;
    }
    const lower = next.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
      setError("Choose an HTML bookmarks export (.html or .htm).");
      setFile(null);
      return;
    }
    if (next.size > MAX_BOOKMARK_FILE_BYTES) {
      setError("That file is larger than 2 MB — split it and import again.");
      setFile(null);
      return;
    }
    setFile(next);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files[0] ?? null);
  }

  function importFile() {
    if (!file) {
      setError("Choose an HTML bookmarks file first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      let html: string;
      try {
        html = await file.text();
      } catch {
        setError("Could not read that file. Try exporting it again.");
        return;
      }

      const result = await importBookmarksAction({
        html,
        categoryId: categoryId || undefined,
        folderTags,
      });

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setSummary(result.data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";

      const { imported, skipped } = result.data;
      if (imported > 0) {
        toast.success(
          `Imported ${imported} bookmark${imported === 1 ? "" : "s"}`,
          skipped > 0
            ? {
                description: `${skipped} duplicate${skipped === 1 ? "" : "s"} skipped.`,
              }
            : undefined,
        );
      } else {
        toast.info("Nothing new to import", {
          description:
            skipped > 0
              ? "Every bookmark in that file is already in your universe."
              : "No usable links were found in that file.",
        });
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-10 text-center transition",
          "hover:border-primary/50 hover:bg-card",
          dragging && "border-primary bg-primary/5",
          pending && "pointer-events-none opacity-60",
        )}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
          <Upload className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-medium">
          {file ? file.name : "Drop your bookmarks HTML file"}
        </span>
        <span className="text-xs text-muted-foreground">
          {file
            ? `${Math.max(1, Math.round(file.size / 1024))} KB — click to replace`
            : "Chrome, Firefox, Safari and Edge can all export this format (.html)"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".html,.htm,text/html"
          className="sr-only"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Import into category{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={categoryId === ""}
            onClick={() => setCategoryId("")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              categoryId === ""
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground",
            )}
          >
            Uncategorized
          </button>
          {categories.map((category) => {
            const active = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryId(active ? "" : category.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <CategoryIcon icon={category.icon} className="size-3.5" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={folderTags}
          onChange={(event) => setFolderTags(event.target.checked)}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span>
          Use folder names as tags
          <span className="block text-xs text-muted-foreground">
            The deepest folder becomes a tag — “Design / UI” imports with the tag
            “ui”.
          </span>
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={importFile} disabled={pending || !file} size="lg">
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Importing…
            </>
          ) : (
            <>
              <Upload className="size-4" aria-hidden />
              Import bookmarks
            </>
          )}
        </Button>
        {file && !pending && (
          <p className="text-xs text-muted-foreground">
            Duplicates are skipped automatically.
          </p>
        )}
      </div>

      {summary && (
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" aria-hidden />
            <p className="font-medium">Import complete</p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Imported", value: summary.imported },
              { label: "Duplicates", value: summary.skipped },
              { label: "Unusable URLs", value: summary.invalid },
              { label: "Failed", value: summary.failed },
            ].map((cell) => (
              <div
                key={cell.label}
                className="rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <dt className="text-xs text-muted-foreground">{cell.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {cell.value}
                </dd>
              </div>
            ))}
          </dl>
          {summary.truncated && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Only the first 500 bookmarks were imported. Split the export and
              run the import again for the rest.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/collection" />}
            >
              View collection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSummary(null)}
            >
              Import another file
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
