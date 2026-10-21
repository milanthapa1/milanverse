import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { ProviderButton } from "@/components/auth/provider-buttons";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authConfigured, enabledOAuthProviders } from "@/lib/auth-env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to MilanVerse and reach your saved universe.",
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="aurora pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        {/* `callbackUrl` is request data — streams in behind a boundary. */}
        <Suspense fallback={<SignInSkeleton />}>
          <SignInCard searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function SignInCard({ searchParams }: { searchParams: SearchParams }) {
  await connection(); // reading searchParams is a request-time data access
  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);
  const configured = authConfigured();
  const providers = enabledOAuthProviders();

  return (
    <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          Sign in to your universe
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your links, categories and favorites — private to your account.
        </p>
      </div>

      {configured && providers.length > 0 ? (
        <div className="mt-8 space-y-3">
          {providers.map((provider) => (
            <ProviderButton
              key={provider}
              provider={provider}
              callbackUrl={callbackUrl}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-4 rounded-xl border border-border/60 bg-background/60 p-4">
          <div>
            <p className="text-sm font-medium">Demo mode — sign-in isn&apos;t configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add OAuth credentials and a database to <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env</code> to enable
              Google/GitHub sign-in. Until then, explore everything with the seeded demo data.
            </p>
          </div>
          <Button
            render={<Link href="/dashboard" />}
            nativeButton={false}
            className="w-full rounded-full"
          >
            Explore the demo
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
        Session-protected — your universe stays yours.
      </p>
    </div>
  );
}

/**
 * Open-redirect guard: only same-origin, single-slash-prefixed paths are
 * honoured; Auth.js re-validates the callback server-side as well.
 */
function sanitizeCallbackUrl(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

/** Dimension-matched skeleton so the card causes no layout shift. */
function SignInSkeleton() {
  return (
    <div aria-hidden className="glass w-full max-w-md rounded-2xl border border-white/10 p-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="size-12 rounded-2xl" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="mt-8 space-y-3">
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-11 rounded-full" />
      </div>
    </div>
  );
}
