import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/constants";
import { fetchSiteMetadata } from "@/lib/metadata";
import { rateLimit } from "@/lib/rate-limit";
import { SsrfError } from "@/lib/ssrf";
import { metadataRequestSchema } from "@/lib/validators/search";
import { getCurrentUser } from "@/server/users";
import type { ApiError } from "@/types";

/**
 * POST /api/metadata — the "paste a link" stage of the magic loop.
 *
 * Body: { url: string } → SiteMetadata (title, description, thumbnail,
 * favicon, suggested tags).
 *
 * Guards, outermost first:
 *  1. Session required — the endpoint must not be an open fetch proxy
 *  2. Per-user rate limit (`RATE_LIMITS.metadata`)
 *  3. Zod validation of the raw string
 *  4. `fetchSiteMetadata` runs the SSRF guard (private ranges blocked)
 */
export async function POST(request: Request) {
  // Demo mode always resolves a user; real mode enforces the session.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<ApiError>(
      { error: "Please sign in to add links.", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const limited = rateLimit(`metadata:${user.id}`, RATE_LIMITS.metadata);
  if (!limited.success) {
    return NextResponse.json<ApiError>(
      { error: "Too many fetches — give it a moment.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid request body.", code: "BAD_JSON" },
      { status: 400 },
    );
  }

  const parsed = metadataRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: parsed.error.issues[0]?.message ?? "A URL is required.", code: "INVALID_URL" },
      { status: 400 },
    );
  }

  try {
    const metadata = await fetchSiteMetadata(parsed.data.url);
    return NextResponse.json(metadata);
  } catch (err) {
    if (err instanceof SsrfError) {
      return NextResponse.json<ApiError>(
        { error: "That address can't be fetched.", code: "SSRF_BLOCKED" },
        { status: 400 },
      );
    }
    return NextResponse.json<ApiError>(
      { error: "Could not reach that site.", code: "FETCH_FAILED" },
      { status: 502 },
    );
  }
}
