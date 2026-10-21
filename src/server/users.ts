import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth, authEnabled } from "@/lib/auth";
import type { UserProfile } from "@/types";
import { DEMO_USER } from "./demo-data";

/**
 * Data Access Layer: current user.
 *
 * - Demo mode (auth not configured): always the demo profile. No session
 *   read happens, so nothing here can block prerendering.
 * - Auth mode: authoritative session read. `getCurrentUser` returns null
 *   when signed out; protected pages use `requireUser`, which redirects to
 *   /signin. `src/proxy.ts` performs the optimistic cookie check before
 *   requests ever reach these functions (defence in depth: verify again here).
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  if (!authEnabled) return DEMO_USER;

  let session: Session | null;
  try {
    session = await auth();
  } catch (error) {
    // A session that fails to decode (stale cookie from a rotated
    // AUTH_SECRET, corrupt JWE) must surface loudly and then be treated as
    // "signed out" so the stale cookie gets overwritten on the next sign-in.
    // Swallowing this silently turns one bad cookie into a redirect loop.
    console.error(
      "[auth] session read failed — treating as signed out. " +
        "If this persists, clear the authjs.session-token cookie and sign in again.",
      error,
    );
    return null;
  }

  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? "Explorer",
    email: user.email ?? "",
    image: user.image ?? null,
  };
}

/** Auth-guarded variant for protected views: signed-out → /signin. */
export async function requireUser(): Promise<UserProfile> {
  return (await getCurrentUser()) ?? redirect("/signin");
}
