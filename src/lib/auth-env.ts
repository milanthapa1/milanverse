/**
 * Auth availability rules expressed with env reads only.
 *
 * Shared by `src/lib/auth.ts` (Auth.js config) and `src/proxy.ts` (route
 * protection). Proxy must stay light — no Prisma or Auth.js imports — so the
 * rules live here instead of inside the Auth.js module.
 */

export type OAuthProviderId = "google" | "github";

/** Providers whose OAuth credentials are fully present in the environment. */
export function enabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push("google");
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push("github");
  }
  return providers;
}

/** True when a real Postgres connection string is configured. */
export function hasPostgresUrl(): boolean {
  const url = process.env.DATABASE_URL;
  return (
    typeof url === "string" &&
    (url.startsWith("postgres://") || url.startsWith("postgresql://"))
  );
}

/**
 * True when a real sign-in flow is possible: at least one OAuth provider
 * plus a database for the Auth.js adapter.
 *
 * When false the app runs in demo mode — `proxy.ts` leaves every route open,
 * no session is ever read, and the sign-in page offers the demo CTA instead
 * of provider buttons. Both `lib/auth.ts` and `proxy.ts` use this single
 * rule, so protection and the Auth.js config can never disagree.
 */
export function authConfigured(): boolean {
  return enabledOAuthProviders().length > 0 && hasPostgresUrl();
}
