import { NextResponse, type NextRequest } from "next/server";
import { authConfigured } from "@/lib/auth-env";

/**
 * Route protection (Next 16 `proxy` — the renamed middleware convention).
 *
 * This is the OPTIMISTIC layer: it only checks for the presence of Auth.js's
 * signed session cookie, before any rendering happens. The authoritative
 * validation is `auth()` inside `src/server/users.ts`, which every protected
 * page calls via `requireUser()`.
 *
 * When auth isn't configured (demo mode) every route stays open so the app
 * remains fully usable without OAuth/database setup.
 */

/** Auth.js v5 / NextAuth session cookie: unprefixed on http, `__Secure-` on https. */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

/** First path segment of every authenticated view. */
const PROTECTED_SEGMENTS = new Set([
  "dashboard",
  "collection",
  "favorites",
  "recently-opened",
  "trash",
  "category",
  "categories",
  "tags",
  "tag",
  "link",
  "activity",
  "search",
  "settings",
  "import",
  "links",
]);

export function proxy(request: NextRequest): NextResponse {
  if (!authConfigured()) return NextResponse.next(); // demo mode: open app

  const { pathname, search } = request.nextUrl;
  const signedIn = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const segment = pathname.split("/")[1] ?? "";
  const isProtected = PROTECTED_SEGMENTS.has(segment);

  if (isProtected && !signedIn) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // When visiting /signin, allow the sign-in page to display and clear any stale
  // session cookies so invalid or rotated secrets don't cause an infinite redirect loop.
  if (pathname.startsWith("/signin")) {
    const response = NextResponse.next();
    for (const cookie of SESSION_COOKIES) {
      if (request.cookies.has(cookie)) {
        response.cookies.delete(cookie);
      }
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes (incl. /api/auth callbacks), Next internals
  // and static/metadata files — proxy must never block those.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|sitemap.xml|robots.txt).*)",
  ],
};
