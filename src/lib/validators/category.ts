import { z } from "zod";

/**
 * Category validation.
 *
 * Slugs are derived server-side from the name (never trusted from the client),
 * so they stay URL-safe and unique per user.
 */

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(40, "Names are limited to 40 characters");

export const categoryColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Pick a valid hex colour");

export const categoryIconSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "Invalid icon key");

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  icon: categoryIconSchema.optional(),
  color: categoryColorSchema.optional(),
});

export const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: categoryNameSchema.optional(),
  icon: categoryIconSchema.optional(),
  color: categoryColorSchema.optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export const categoryIdSchema = z.object({ id: z.string().min(1) });

/** URL-safe slug: lowercase, alphanumeric words joined by single dashes. */
export function slugifyCategoryName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "category";
}
