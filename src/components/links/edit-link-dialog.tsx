"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CategoryIcon } from "@/components/categories/category-icons";
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
import { cn } from "@/lib/utils";
import { updateLinkAction } from "@/server/actions/links";
import type { Category, LinkItem } from "@/types";

const editFormSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(160),
  description: z.string().trim().max(2000),
  categoryId: z.string(),
  tags: z.string().trim().max(400),
});

type EditFormValues = z.infer<typeof editFormSchema>;

/** Split a comma-separated tag string into clean, lowercased, de-duped names. */
function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 10);
}

interface EditLinkDialogProps {
  link: LinkItem;
  categories: Category[];
}

/**
 * Edit dialog for an existing link: title, description, category and tags.
 * The URL itself is immutable — removing and re-adding is the way to change
 * the destination (keeps the unique-index contract simple).
 */
export function EditLinkDialog({ link, categories }: EditLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: link.title,
      description: link.description ?? "",
      categoryId: link.categoryId,
      tags: link.tags.join(", "),
    },
  });

  const watchedCategoryId = useWatch({ control: form.control, name: "categoryId" });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Re-seed from the freshest props every time the dialog opens.
      form.reset({
        title: link.title,
        description: link.description ?? "",
        categoryId: link.categoryId,
        tags: link.tags.join(", "),
      });
    }
    setOpen(next);
  }

  function save(values: EditFormValues) {
    startTransition(async () => {
      const result = await updateLinkAction({
        id: link.id,
        title: values.title,
        description: values.description.trim() || null,
        categoryId: values.categoryId || null,
        tags: parseTags(values.tags),
      });

      if (result.ok) {
        toast.success("Link updated", { description: result.data.title });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="secondary" size="sm">
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit link</DialogTitle>
          <DialogDescription className="truncate">{link.url}</DialogDescription>
        </DialogHeader>

        <form
          className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"
          onSubmit={form.handleSubmit(save)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              autoFocus
              disabled={pending}
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              rows={3}
              disabled={pending}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
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
                      "flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-xs transition",
                      active ? "font-medium" : "hover:border-border",
                    )}
                    style={
                      active
                        ? {
                            borderColor: `${category.color}80`,
                            backgroundColor: `${category.color}1A`,
                          }
                        : undefined
                    }
                  >
                    <span style={{ color: category.color }}>
                      <CategoryIcon icon={category.icon} className="size-3.5" />
                    </span>
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              placeholder="streaming, movies"
              disabled={pending}
              {...form.register("tags")}
            />
            <p className="text-[11px] text-muted-foreground">
              Comma separated — up to 10.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Pencil className="size-4" aria-hidden />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
