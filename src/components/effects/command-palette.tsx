"use client";

import {
  Activity,
  Compass,
  FolderCog,
  Heart,
  History,
  House,
  LayoutGrid,
  Loader2,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Tag,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { CategoryIcon } from "@/components/categories/category-icons";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ADD_LINK_EVENT, COMMAND_PALETTE_EVENT } from "@/lib/events";
import { getDomain } from "@/lib/url";
import { cn } from "@/lib/utils";
import { paletteSearchAction } from "@/server/actions/search";
import type { Category, PaletteSearchData } from "@/types";

interface NavEntry {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavEntry[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/search", label: "Explore", icon: Compass },
  { href: "/collection", label: "My Collection", icon: LayoutGrid },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/recently-opened", label: "Recently Opened", icon: History },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/categories", label: "Manage categories", icon: FolderCog },
  { href: "/import", label: "Import bookmarks", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

function matches(label: string, needle: string): boolean {
  return needle.length === 0 || label.toLowerCase().includes(needle);
}

const KBD_CLASS =
  "rounded border border-border/70 bg-background/60 px-1 py-0.5 font-mono text-[10px] text-muted-foreground";

/**
 * ⌘K / Ctrl+K command palette: live link search (server action), tag and
 * category jumps, navigation and quick actions (add a link, flip the theme).
 *
 * Mounted once in the app header; `CommandPaletteTrigger` opens it via a
 * window event so the header itself can stay a server component.
 */
export function CommandPalette({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteSearchData | null>(null);
  const [pending, startTransition] = useTransition();
  const requestRef = useRef(0);

  // Global hotkey + programmatic open (header trigger).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onOpen);
    };
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults(null);
    }
  }, []);

  // Debounced live search (stale responses are dropped by request id).
  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length === 0) {
      return;
    }
    const id = ++requestRef.current;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const response = await paletteSearchAction({ query: trimmed });
        if (requestRef.current !== id) return;
        setResults(response.ok ? response.data : null);
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const run = useCallback(
    (action: () => void, delay = 0) => {
      handleOpenChange(false);
      if (delay > 0) {
        window.setTimeout(action, delay);
      } else {
        action();
      }
    },
    [handleOpenChange],
  );

  const needle = query.trim().toLowerCase();
  const trimmed = query.trim();
  const isDark = resolvedTheme !== "light";

  const actions = [
    {
      key: "add-link",
      label: "Add a link",
      hint: "Paste a URL — metadata comes for free",
      icon: Plus,
      onSelect: () => run(() => window.dispatchEvent(new Event(ADD_LINK_EVENT)), 160),
    },
    {
      key: "toggle-theme",
      label: isDark ? "Switch to light theme" : "Switch to dark theme",
      hint: "Appearance",
      icon: isDark ? Sun : Moon,
      onSelect: () => run(() => setTheme(isDark ? "light" : "dark")),
    },
  ].filter((action) => matches(action.label, needle));

  const navItems = NAV.filter((item) => matches(item.label, needle));
  const categoryItems = categories
    .filter((category) => matches(category.name, needle))
    .slice(0, 10);
  const activeResults = !open || trimmed.length === 0 ? null : results;
  const linkResults = activeResults?.links ?? [];
  const tagResults = activeResults?.tags ?? [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Command palette"
      description="Search your universe and run quick actions"
      className="sm:max-w-xl"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search links, tags, categories… or run a command"
          value={query}
          onValueChange={setQuery}
        />

        <CommandList className="max-h-[min(26rem,62dvh)]">
          {actions.length > 0 && (
            <CommandGroup heading="Actions">
              {actions.map((action) => (
                <CommandItem
                  key={action.key}
                  value={action.key}
                  onSelect={action.onSelect}
                >
                  <action.icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {action.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {trimmed.length > 0 && (
            <CommandGroup heading="Search">
              <CommandItem
                value={`search-all-${trimmed}`}
                onSelect={() =>
                  run(() => router.push(`/search?q=${encodeURIComponent(trimmed)}`))
                }
              >
                <Search className="size-4 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  Search all links for “{trimmed}”
                </span>
                {results && results.totalLinks > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {results.totalLinks}
                  </span>
                )}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          )}

          {linkResults.length > 0 && (
            <CommandGroup heading="Links">
              {linkResults.map((link) => (
                <CommandItem
                  key={link.id}
                  value={`link-${link.id}`}
                  onSelect={() => run(() => router.push(`/link/${link.id}`))}
                >
                  <span
                    aria-hidden
                    className="grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white"
                    style={{ backgroundColor: link.category?.color ?? "#7C5CFF" }}
                  >
                    {link.title.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{link.title}</span>
                  <span className="hidden max-w-[40%] truncate text-xs text-muted-foreground sm:inline">
                    {getDomain(link.url)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {tagResults.length > 0 && (
            <CommandGroup heading="Tags">
              {tagResults.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={`tag-${tag.id}`}
                  onSelect={() =>
                    run(() => router.push(`/tag/${encodeURIComponent(tag.name)}`))
                  }
                >
                  <Tag className="size-4 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">#{tag.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {tag.linkCount}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {categoryItems.length > 0 && (
            <CommandGroup heading="Categories">
              {categoryItems.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category-${category.id}`}
                  onSelect={() =>
                    run(() => router.push(`/category/${category.slug}`))
                  }
                >
                  <span style={{ color: category.color }} aria-hidden>
                    <CategoryIcon icon={category.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{category.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {category.linkCount}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {navItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Go to">
                {navItems.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.href}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <item.icon className="size-4 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {pending ? (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Searching…
              </>
            ) : (
              "MilanVerse"
            )}
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <kbd className={KBD_CLASS} aria-hidden>
              ↑↓
            </kbd>
            navigate
            <kbd className={KBD_CLASS} aria-hidden>
              ↵
            </kbd>
            open
            <kbd className={KBD_CLASS} aria-hidden>
              esc
            </kbd>
            close
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

/** Header affordance that looks like the old search input but opens the palette. */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COMMAND_PALETTE_EVENT))}
      aria-label="Open the command palette"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-full border border-input bg-transparent px-3 text-left text-sm text-muted-foreground outline-none transition hover:border-ring/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">Search your universe…</span>
      <kbd
        className="hidden shrink-0 rounded-md border border-border/70 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] sm:block"
        aria-hidden
      >
        ⌘K
      </kbd>
    </button>
  );
}
