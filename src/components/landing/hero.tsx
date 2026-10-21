import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Starfield } from "@/components/effects/starfield";
import { CategoryDock } from "@/components/landing/category-dock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Hero: aurora glow + starfield (dark theme only), headline, glass search bar,
 * category dock CTA. Light theme sits on a clean flat white background.
 * The search bar really works — it GETs /search?q=… (demo or database backed).
 *
 * The section is pulled up by the navbar's height (-mt-16) so the cosmic
 * backdrop runs from the very top of the page, behind the glass navbar, and
 * the extra pt keeps the content where it was.
 */
export function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* cosmic backdrop (dark theme only — light theme stays clean white) */}
      <Starfield className="hidden dark:block" density={1.2} controls />
      <span
        className="aurora top-[-14rem] right-[-10rem] hidden size-[34rem] bg-violet-600/40 dark:block"
        aria-hidden
      />
      <span
        className="aurora bottom-[-16rem] left-[-12rem] hidden size-[30rem] bg-cyan-500/25 dark:block"
        style={{ animationDelay: "-6s" }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
        <h1 className="text-gradient text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
          Your Personal Internet Universe
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Paste a link — MilanVerse grabs the title, thumbnail and tags for you,
          files it into the right category, and puts it one keystroke away the
          next time you need it.
        </p>

        {/* Glass search bar */}
        <form
          action="/search"
          method="get"
          role="search"
          className="glass mt-8 flex w-full max-w-2xl items-center gap-2 rounded-full p-2 pl-4 shadow-[0_16px_50px_-20px_var(--glow)]"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            name="q"
            placeholder="Search your universe"
            aria-label="Search links"
            className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none outline-none placeholder:text-muted-foreground/80 focus-visible:ring-0 dark:bg-transparent"
          />
          <Button type="submit" size="sm" className="h-9 shrink-0 rounded-full px-4">
            Search
          </Button>
        </form>

        {/* CTAs */}
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            render={<Link href="/dashboard" />}
            nativeButton={false}
            size="lg"
            className="h-11 rounded-full px-6"
          >
            Launch your universe
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <Button
            render={<Link href="#features" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
            className="h-11 rounded-full px-6 text-muted-foreground"
          >
            See how it works
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Free forever · No credit card · Works with Google &amp; GitHub sign-in
        </p>

        <div id="categories" className="mt-12 w-full scroll-mt-24">
          <CategoryDock />
        </div>
      </div>
    </section>
  );
}
