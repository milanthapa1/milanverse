import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { authConfigured, enabledOAuthProviders } from "@/lib/auth-env";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { getPrisma } from "@/lib/db";

/**
 * Auth.js v5 (next-auth@beta) configuration.
 *
 * - Providers are registered only when BOTH their OAuth credentials and a
 *   database exist, so the app builds and runs with zero auth setup (demo
 *   mode: `authEnabled === false` ⇒ zero providers ⇒ sign-in impossible).
 * - The Prisma adapter persists users/accounts; sessions are JWTs (v5
 *   default), so a session read is a cookie decrypt with no database
 *   round-trip — shell chrome can therefore stream behind `<Suspense>` per
 *   the Next.js "Authentication with Cache Components" guide.
 * - `src/proxy.ts` performs the optimistic cookie check on navigation;
 *   `getCurrentUser` / `requireUser` in `src/server/users.ts` are the
 *   authoritative guards inside routes.
 */

/** Real sign-in possible (OAuth + database). Same rule as `proxy.ts`. */
export const authEnabled = authConfigured();

// Built imperatively: Google's and GitHub's factory signatures are generic
// over their profile type, so a flatMap/ternary union of the two arrays
// defeats TS's inference (U binds to the first branch only).
const providers: NextAuthConfig["providers"] = [];
if (authEnabled) {
  for (const id of enabledOAuthProviders()) {
    if (id === "google") {
      providers.push(
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      );
    } else {
      providers.push(
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
      );
    }
  }
}

const prisma = getPrisma();

export const { handlers, auth } = NextAuth({
  trustHost: true, // self-hosted (non-Vercel) deployment
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  adapter: authEnabled && prisma ? PrismaAdapter(prisma) : undefined,
  providers,
  callbacks: {
    session({ session, token }) {
      if (session.user && typeof token.sub === "string") {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // First OAuth sign-in: give the fresh account the default category set
      // so its universe is navigable from the very first session.
      // (`userId` is captured as a const: property narrowing of `user.id`
      // doesn't survive into the .map closure below.)
      const userId = user.id;
      if (!prisma || !userId) return;
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((category, order) => ({
          userId,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          order,
        })),
        skipDuplicates: true,
      });
    },
  },
} satisfies NextAuthConfig);
