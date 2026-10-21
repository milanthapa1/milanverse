import { z } from "zod";
import { MAX_BOOKMARK_FILE_BYTES } from "@/lib/bookmarks";

/**
 * Server-side validation for the bookmark import payload. The HTML rides as a
 * string (the client reads the file), so the size cap is enforced here too —
 * never trust that the browser checked anything.
 */
export const importBookmarksSchema = z.object({
  html: z
    .string()
    .min(1, "Choose a bookmarks file first.")
    .max(
      MAX_BOOKMARK_FILE_BYTES,
      "That file is larger than 2 MB — split it and import again.",
    ),
  categoryId: z.string().max(64).optional(),
  folderTags: z.boolean().optional(),
});
