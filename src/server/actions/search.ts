"use server";

import { z } from "zod";
import { searchLinks } from "@/server/links";
import { listTags } from "@/server/tags";
import { requireUser } from "@/server/users";
import type { ActionResult, PaletteSearchData } from "@/types";

/**
 * Search backing the ⌘K palette.
 *
 * Read-only and owner-scoped: the session user is resolved server-side, so a
 * caller can never search someone else's universe. Queries are capped to keep
 * the scoring pass cheap; results are trimmed for the palette (the full list
 * remains available on /search).
 */

const paletteQuerySchema = z.object({
  query: z.string().trim().max(80, "Search is limited to 80 characters."),
});

export async function paletteSearchAction(
  input: unknown,
): Promise<ActionResult<PaletteSearchData>> {
  const parsed = paletteQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid search.",
    };
  }

  const user = await requireUser();
  const query = parsed.data.query;
  if (!query) {
    return { ok: true, data: { links: [], tags: [], totalLinks: 0 } };
  }

  const [matches, tags] = await Promise.all([
    searchLinks(user.id, query),
    listTags(user.id),
  ]);
  const needle = query.toLowerCase();

  return {
    ok: true,
    data: {
      links: matches.slice(0, 5),
      totalLinks: matches.length,
      tags: tags
        .filter((tag) => tag.name.toLowerCase().includes(needle))
        .slice(0, 4),
    },
  };
}
