"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Clipboard,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Sparkles,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CategoryIcon } from "@/components/categories/category-icons";
import { Favicon } from "@/components/links/favicon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLinkAction } from "@/server/actions/links";
import { ADD_LINK_EVENT } from "@/lib/events";
import { coerceUrl, getDomain, getSiteLabel } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { Category, SiteMetadata } from "@/types";

interface AddLinkDialogProps {
  categories: Category[];
}

const linkFormSchema = z.object({
  url: z.string().trim().min(1, "Paste a link first").max(2048),
  title: z.string().trim().min(1, "A title is required — fetch one or type it").max(160),
  description: z.string().trim().max(2000),
  categoryId: z.string(),
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

const EMPTY_FORM: LinkFormValues = {
  url: "",
  title: "",
  description: "",
  categoryId: "",
};

export function AddLinkDialog({ categories }: AddLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);
  const [meta, setMeta] = useState<SiteMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const canPaste = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText),
    () => false,
  );

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const watchedUrl = useWatch({ control: form.control, name: "url" }) || "";
  const watchedTitle = useWatch({ control: form.control, name: "title" }) || "";
  const watchedCategoryId = useWatch({ control: form.control, name: "categoryId" }) || "";

  const selectedCategory = categories.find((c) => c.id === watchedCategoryId);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        form.reset(EMPTY_FORM);
        setMeta(null);
        setError(null);
        setFetching(false);
        setTags([]);
        setTagInput("");
      }
      setOpen(next);
    },
    [form],
  );

  // The command palette (Cmd+K) can open this dialog via global event
  useEffect(() => {
    function onRequest() {
      setOpen(true);
    }
    window.addEventListener(ADD_LINK_EVENT, onRequest);
    return () => window.removeEventListener(ADD_LINK_EVENT, onRequest);
  }, []);

  /** Fetch OpenGraph metadata for the URL and prefill the form */
  const fetchMetadata = useCallback(
    async (rawUrl?: string) => {
      const targetUrl = rawUrl || form.getValues("url");
      const candidate = coerceUrl(targetUrl);
      if (!candidate) {
        setError("Paste a valid link, e.g. netflix.com");
        form.setError("url", { message: "Paste a valid link, e.g. netflix.com" });
        return;
      }
      setError(null);
      setFetching(true);
      try {
        const response = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: candidate }),
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof data === "object" && data !== null && "error" in data
              ? String((data as { error: unknown }).error)
              : "Could not fetch that site.";
          setError(message);
          return;
        }
        const metadata = data as SiteMetadata;
        setMeta(metadata);
        form.setValue("url", metadata.url, { shouldValidate: true });
        form.setValue("title", metadata.title, { shouldValidate: true });
        if (metadata.description) {
          form.setValue("description", metadata.description, { shouldValidate: true });
        }
        if (metadata.suggestedTags?.length) {
          setTags((prev) => [
            ...new Set([...prev, ...metadata.suggestedTags.map((t) => t.toLowerCase())]),
          ].slice(0, 10));
        }

        // Auto-match category if the user hasn't explicitly selected one
        if (!form.getValues("categoryId") && categories.length > 0) {
          const suggested = metadata.suggestedTags?.map((t) => t.toLowerCase()) ?? [];
          const matched = categories.find((c) => {
            const slug = c.slug.toLowerCase();
            const name = c.name.toLowerCase();
            return (
              suggested.some((tag) => slug.includes(tag) || name.includes(tag)) ||
              (suggested.includes("dev") && (slug.includes("dev") || slug.includes("code"))) ||
              (suggested.includes("streaming") && (slug.includes("movie") || slug.includes("tv"))) ||
              (suggested.includes("anime") && (slug.includes("movie") || slug.includes("tv"))) ||
              (suggested.includes("ai") && (slug.includes("ai") || slug.includes("tool"))) ||
              (suggested.includes("learning") && (slug.includes("learn") || slug.includes("education"))) ||
              (suggested.includes("gaming") && (slug.includes("game") || slug.includes("gaming"))) ||
              (suggested.includes("music") && (slug.includes("music") || slug.includes("audio"))) ||
              (suggested.includes("sports") && (slug.includes("sport") || slug.includes("sports")))
            );
          });
          if (matched) {
            form.setValue("categoryId", matched.id, { shouldValidate: true });
          }
        }
      } catch {
        setError("Could not reach site — you can enter the title manually.");
      } finally {
        setFetching(false);
      }
    },
    [form, categories],
  );

  // 1-Click Paste from clipboard
  async function handlePasteFromClipboard() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        form.setValue("url", text, { shouldValidate: true });
        void fetchMetadata(text);
      }
    } catch {
      toast.error("Could not read clipboard. Please paste manually.");
    }
  }

  // Tag chip management
  function addTag(raw: string) {
    const cleaned = raw.trim().replace(/^#/, "").toLowerCase();
    if (!cleaned) return;
    if (tags.includes(cleaned)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 10) {
      toast.warning("Maximum of 10 tags per link.");
      return;
    }
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  }

  function removeTag(tagToRemove: string) {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === "Backspace" && !tagInput && tags.length > 0) {
      const last = tags[tags.length - 1];
      if (last) removeTag(last);
    }
  }

  function save(values: LinkFormValues) {
    const candidate = coerceUrl(values.url);
    if (!candidate) {
      setError("Paste a valid link first.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createLinkAction({
        url: candidate,
        title: values.title.trim(),
        description: values.description.trim() || null,
        thumbnail: meta?.thumbnail ?? null,
        favicon: meta?.favicon ?? null,
        siteName: meta?.siteName ?? null,
        categoryId: values.categoryId || null,
        tags,
      });

      if (result.ok) {
        toast.success("Saved to your universe", { description: result.data.title });
        handleOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
        if (result.code === "DUPLICATE") {
          form.setError("url", { message: result.error });
        }
      }
    });
  }

  const unusedSuggestedTags = (meta?.suggestedTags ?? []).filter(
    (st) => !tags.includes(st.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="gap-1.5 bg-[#d97757] text-white shadow-sm hover:bg-[#c4633f]"
          >
            <Plus className="size-4" aria-hidden />
            <span>Add link</span>
          </Button>
        }
      />

      <DialogContent className="overflow-hidden sm:max-w-xl p-0 gap-0 border-white/10 shadow-2xl bg-card/95 backdrop-blur-xl">
        {/* Dialog Header */}
        <DialogHeader className="p-6 pb-4 relative z-10 border-b border-border/60">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Add to your universe
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Paste a URL — metadata, favicon, and tags will automatically generate.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          className="relative z-10 max-h-[75vh] space-y-5 overflow-y-auto p-6 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(save)(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void form.handleSubmit(save)(event);
            }
          }}
          noValidate
        >
          {/* URL Input with Instant Auto-Fetch & Clipboard Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Website URL
              </Label>
              {canPaste && !watchedUrl && (
                <button
                  type="button"
                  onClick={() => void handlePasteFromClipboard()}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition"
                >
                  <Clipboard className="size-3" />
                  Paste from clipboard
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
                <Globe className="size-4" />
              </div>
              <Input
                id="add-url"
                placeholder="https://example.com or github.com"
                autoFocus
                disabled={fetching || pending}
                className="pl-9 pr-24 h-11 rounded-xl text-sm transition focus-visible:ring-primary/40"
                aria-invalid={Boolean(form.formState.errors.url)}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text");
                  if (pasted?.trim()) {
                    form.setValue("url", pasted.trim());
                    void fetchMetadata(pasted.trim());
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !meta) {
                    event.preventDefault();
                    void fetchMetadata();
                  }
                }}
                {...form.register("url")}
              />
              <div className="absolute right-1.5 flex items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                  onClick={() => void fetchMetadata()}
                  disabled={fetching || pending || watchedUrl.trim().length === 0}
                >
                  {fetching ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      <span>Fetching…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-primary" aria-hidden />
                      <span>Fetch</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {form.formState.errors.url && (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          {/* Live Card Preview */}
          {(meta || watchedUrl.trim().length > 3) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Card Preview
                </span>
                {meta && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <Check className="size-3" />
                    Metadata attached
                  </span>
                )}
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background/60 p-4 shadow-lg transition-all duration-300">
                {/* Banner Thumbnail (if scraped) */}
                {meta?.thumbnail && (
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl border border-white/10 bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.thumbnail}
                      alt={watchedTitle}
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Favicon
                    url={watchedUrl || "https://example.com"}
                    favicon={meta?.favicon}
                    tint={selectedCategory?.color ?? "#7C5CFF"}
                    className="size-11 rounded-xl text-base shadow-sm ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {watchedTitle || meta?.title || "Website Title"}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{meta?.siteName ?? (watchedUrl ? getSiteLabel(watchedUrl) : "example.com")}</span>
                      <span>·</span>
                      <span className="truncate text-[11px] opacity-75">{watchedUrl ? getDomain(watchedUrl) : "example.com"}</span>
                      <ExternalLink className="size-3 opacity-60 ml-0.5 shrink-0" />
                    </div>
                  </div>

                  {selectedCategory && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-xs"
                      style={{
                        borderColor: `${selectedCategory.color}50`,
                        backgroundColor: `${selectedCategory.color}15`,
                        color: selectedCategory.color,
                      }}
                    >
                      <CategoryIcon icon={selectedCategory.icon} className="size-3" />
                      {selectedCategory.name}
                    </span>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Picker with Glowing Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              {watchedCategoryId && (
                <button
                  type="button"
                  onClick={() => form.setValue("categoryId", "", { shouldValidate: true })}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = watchedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      form.setValue("categoryId", active ? "" : category.id, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 select-none",
                      active
                        ? "shadow-sm scale-[1.02]"
                        : "border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border",
                    )}
                    style={
                      active
                        ? {
                            borderColor: category.color,
                            backgroundColor: `${category.color}1E`,
                            color: category.color,
                          }
                        : undefined
                    }
                  >
                    <span style={{ color: category.color }}>
                      <CategoryIcon icon={category.icon} className="size-3.5" />
                    </span>
                    <span>{category.name}</span>
                    {active && <Check className="size-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {watchedTitle.length}/160
              </span>
            </div>
            <Input
              id="add-title"
              placeholder="e.g. Netflix — Stream TV Shows & Movies"
              disabled={pending}
              className="h-10 rounded-xl text-sm"
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label htmlFor="add-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (Optional)
            </Label>
            <Textarea
              id="add-description"
              placeholder="Add your personal notes or summary…"
              rows={2}
              disabled={pending}
              className="rounded-xl text-sm resize-none"
              {...form.register("description")}
            />
          </div>

          {/* Modern Interactive Tag Chip System */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TagIcon className="size-3.5" />
                Tags ({tags.length}/10)
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Press Enter or comma to add
              </span>
            </div>

            {/* Tag Container with Chips & Inline Input */}
            <div className="min-h-12 w-full rounded-xl border border-input bg-background/50 p-2 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/25 px-2.5 py-1 text-xs font-semibold text-primary animate-in fade-in zoom-in-95 duration-150"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-primary/20 hover:text-primary transition"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? "e.g. streaming, dev, productivity…" : "Add more…"}
                disabled={pending || tags.length >= 10}
                className="flex-1 min-w-[130px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none px-1 py-1"
              />
            </div>

            {/* AI / Magic Suggested Tags */}
            {unusedSuggestedTags.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" />
                  Suggested:
                </span>
                {unusedSuggestedTags.slice(0, 6).map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => addTag(suggested)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary transition"
                  >
                    <Plus className="size-2.5" />
                    {suggested}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <X className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="p-0 pt-3 border-t border-border/60 flex items-center justify-end sm:justify-end w-full">
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending || watchedTitle.trim().length === 0}
                className="gap-2 rounded-xl px-5 shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span>Saving to Universe…</span>
                  </>
                ) : (
                  <span>Save to Universe</span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
