import { Command, LayoutGrid, Rocket, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    icon: Wand2,
    title: "Auto-fetch magic",
    description:
      "Paste any URL and the title, description, thumbnail, favicon and suggested tags fill themselves in — with strict SSRF-safe fetching.",
    accent: "#7C5CFF",
  },
  {
    icon: Command,
    title: "Search that reads your mind",
    description:
      "Fuzzy search across titles, tags and domains — or hit ⌘K / Ctrl+K to jump to any link, category or action instantly.",
    accent: "#22D3EE",
  },
  {
    icon: LayoutGrid,
    title: "Organized by your rules",
    description:
      "Eight tuned categories — Movies, Sports, AI Tools, Dev, Learning, Gaming, Music — each with its own color and icon.",
    accent: "#E879F9",
  },
  {
    icon: Rocket,
    title: "One-keystroke launch",
    description:
      "Open tracking with recency decay ranks what you actually use, so the links you need stay right on top of your universe.",
    accent: "#34D399",
  },
];

/** Four-up feature grid on the landing page. */
export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for <span className="text-primary">speed-to-open</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not a bookmark library — a launchpad. Everything is optimized for the
            two seconds between wanting a site and being on it.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 glow-hover"
            >
              <span
                className="grid size-10 place-items-center rounded-xl border"
                style={{
                  backgroundColor: `${feature.accent}1A`,
                  borderColor: `${feature.accent}40`,
                  color: feature.accent,
                }}
              >
                <feature.icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
