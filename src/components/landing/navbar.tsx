import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

/** Sticky glass navigation for the marketing site. */
export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent">
      <div className="glass-nav mx-auto flex h-16 max-w-6xl items-center justify-between rounded-b-2xl border-x-0 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <Link
            href="#features"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Features
          </Link>
          <Link
            href="#showcase"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Showcase
          </Link>
          <Link
            href="#categories"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Categories
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            render={<Link href="/signin" />}
            nativeButton={false}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
