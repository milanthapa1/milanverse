"use client";

import { signIn } from "next-auth/react";
import { GitHubGlyph, GoogleGlyph } from "@/components/auth/provider-glyphs";
import { Button } from "@/components/ui/button";
import type { OAuthProviderId } from "@/lib/auth-env";

const LABELS: Record<OAuthProviderId, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

/**
 * OAuth launch button. `callbackUrl` is a sanitized same-origin path
 * (Auth.js validates it again server-side before redirecting).
 */
export function ProviderButton({
  provider,
  callbackUrl,
}: {
  provider: OAuthProviderId;
  callbackUrl: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full justify-center gap-3 rounded-full text-sm"
      onClick={() => void signIn(provider, { callbackUrl })}
    >
      {provider === "google" ? (
        <GoogleGlyph className="size-4.5" />
      ) : (
        <GitHubGlyph className="size-4.5" />
      )}
      {LABELS[provider]}
    </Button>
  );
}
