import { connection, NextResponse } from "next/server";
import { generateBookmarksHtml } from "@/lib/bookmarks";
import { listActiveLinks } from "@/server/links";
import { getCurrentUser } from "@/server/users";

/**
 * GET /api/export — Export bookmarks in Netscape HTML format.
 * Compatible with Chrome, Firefox, Safari, Edge, Arc, and Raindrop.
 */
export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to export your bookmarks.", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const links = await listActiveLinks(user.id);
  const html = generateBookmarksHtml(links);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `milanverse-bookmarks-${dateStr}.html`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
