import { z } from "zod";

/** POST /api/metadata — fetch Open Graph metadata for a URL. */
export const metadataRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long"),
});

/** GET /search?q= — search + filters. */
export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  tab: z.enum(["all", "websites", "categories", "tags"]).default("all"),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
