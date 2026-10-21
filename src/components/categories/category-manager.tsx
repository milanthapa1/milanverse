"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
} from "@/components/categories/category-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/server/actions/categories";
import type { Category } from "@/types";

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40, "Keep it under 40 characters"),
  icon: z.string().min(1),
  color: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Pick a colour"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const EMPTY_FORM: CategoryFormValues = {
  name: "",
  icon: "layout-grid",
  color: "#7C5CFF",
};

interface CategoryManagerProps {
  categories: Category[];
}

/**
 * Category CRUD surface: cards with inline counts, a create/edit dialog
 * (name + icon + accent colour) and a delete confirmation.
 *
 * Deleting never touches links — they fall back to "uncategorized", matching
 * the `onDelete: SetNull` relation.
 */
export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState<
    { mode: "create" } | { mode: "edit"; category: Category } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCategoryAction({ id: deleteTarget.id });
      if (result.ok) {
        toast.success(`Deleted “${deleteTarget.name}”`, {
          description: "Its links are still in your collection, now uncategorized.",
        });
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? "category" : "categories"} · click a
          card to edit
        </p>
        <Button size="sm" onClick={() => setFormTarget({ mode: "create" })}>
          <Plus className="size-3.5" aria-hidden />
          New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
          <p className="text-sm font-medium">No categories yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first category to start organizing your universe.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:border-border"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl"
                style={{
                  backgroundColor: `${category.color}22`,
                  color: category.color,
                }}
              >
                <CategoryIcon icon={category.icon} className="size-5" />
              </span>

              <button
                type="button"
                onClick={() => setFormTarget({ mode: "edit", category })}
                className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="block truncate text-sm font-semibold">
                  {category.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {category.linkCount}{" "}
                  {category.linkCount === 1 ? "link" : "links"} · /{category.slug}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => setFormTarget({ mode: "edit", category })}
                  className="text-muted-foreground"
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => setDeleteTarget(category)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormDialog
        target={formTarget}
        onClose={() => setFormTarget(null)}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.name}”?</DialogTitle>
            <DialogDescription>
              The category is removed. Its {deleteTarget?.linkCount ?? 0}{" "}
              {deleteTarget?.linkCount === 1 ? "link stays" : "links stay"} in your
              collection — just uncategorized. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
              Delete category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CategoryFormDialogProps {
  target: { mode: "create" } | { mode: "edit"; category: Category } | null;
  onClose: () => void;
}

function CategoryFormDialog({ target, onClose }: CategoryFormDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial = target?.mode === "edit" ? target.category : null;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Re-seed the form whenever the dialog opens for a different target.
  useEffect(() => {
    if (!target) return;
    form.reset(
      initial
        ? { name: initial.name, icon: initial.icon, color: initial.color }
        : EMPTY_FORM,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const iconValue = useWatch({ control: form.control, name: "icon" });
  const colorValue = useWatch({ control: form.control, name: "color" });

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const result = initial
        ? await updateCategoryAction({ id: initial.id, ...values })
        : await createCategoryAction(values);

      if (result.ok) {
        toast.success(initial ? "Category updated" : "Category created", {
          description: result.data.name,
        });
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
        if (result.code === "DUPLICATE") {
          form.setError("name", { message: result.error });
        }
      }
    });
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Name it, pick an icon and an accent colour — it appears in your sidebar
            instantly.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              placeholder="Design inspiration"
              autoFocus
              disabled={pending}
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_ICON_OPTIONS.map((key) => {
                const active = iconValue === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={key}
                    aria-pressed={active}
                    onClick={() => form.setValue("icon", key, { shouldDirty: true })}
                    className={cn(
                      "grid aspect-square place-items-center rounded-lg border transition",
                      active
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <CategoryIcon icon={key} className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => {
                const active = colorValue.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-pressed={active}
                    onClick={() => form.setValue("color", color, { shouldDirty: true })}
                    className={cn(
                      "size-7 rounded-full border-2 transition",
                      active
                        ? "border-foreground/80 ring-2 ring-ring/40"
                        : "border-transparent hover:scale-110",
                    )}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              {initial ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
