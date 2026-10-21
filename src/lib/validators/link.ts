import { z } from "zod";
import { coerceUrl, isValidHttpUrl } from "@/lib/url";

/** `z.url()`-free http(s) validation so bare domains can pass through coerceUrl. */
export const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(2048, "URL is too long")
  .refine((value) => isValidHttpUrl(coerceUrl(value) ?? ""), {
    message: "Must be a valid http(s) URL",
  });

export const tagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(32, "Tags are limited to 32 characters");

export const createLinkSchema = z.object({
  url: httpUrlSchema,
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  thumbnail: z.string().trim().max(2048).nullable().optional(),
  favicon: z.string().trim().max(2048).nullable().optional(),
  siteName: z.string().trim().max(160).nullable().optional(),
  categoryId: z.string().trim().min(1, "Pick a category").nullable().optional(),
  tags: z.array(tagSchema).max(10, "Up to 10 tags per link").default([]),
});

export const updateLinkSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  categoryId: z.string().trim().nullable().optional(),
  tags: z.array(tagSchema).max(10).optional(),
  isFavorite: z.boolean().optional(),
});

export const linkIdSchema = z.object({ id: z.string().min(1) });

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
