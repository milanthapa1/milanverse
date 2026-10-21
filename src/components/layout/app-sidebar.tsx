"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Compass,
  Heart,
  History,
  House,
  LayoutGrid,
  Settings2,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { CategoryIcon } from "@/components/categories/category-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/search", label: "Explore", icon: Compass },
  { href: "/collection", label: "My Collection", icon: LayoutGrid },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/recently-opened", label: "Recently Opened", icon: History },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active =
    item.href === "/search"
      ? pathname === "/search"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function CategoryLink({ category }: { category: Category }) {
  const pathname = usePathname();
  const active = pathname === `/category/${category.slug}`;

  return (
    <Link
      href={`/category/${category.slug}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <span
        className="grid size-5 shrink-0 place-items-center rounded-md"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <CategoryIcon icon={category.icon} className="size-3" />
      </span>
      <span className="min-w-0 flex-1 truncate">{category.name}</span>
      <span className="tabular-nums text-xs text-sidebar-foreground/50">
        {category.linkCount}
      </span>
    </Link>
  );
}

interface AppSidebarProps {
  categories: Category[];
}

/** Desktop sidebar: primary nav + category list with counts. */
export function AppSidebar({ categories }: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center px-5">
        <Logo href="/dashboard" />
      </div>

      <ScrollArea className="flex-1 overflow-y-auto px-3 pb-4">
        <nav aria-label="Main" className="flex flex-col gap-1">
          {MAIN_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>

        <Separator className="my-4 bg-sidebar-border" />

        <div className="mb-2 flex items-center justify-between px-3">
          <p className="text-xs font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
            Categories
          </p>
          <Link
            href="/categories"
            aria-label="Manage categories"
            title="Manage categories"
            className="rounded-md p-1 text-sidebar-foreground/50 outline-none transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Settings2 className="size-3.5" aria-hidden />
          </Link>
        </div>
        <nav aria-label="Categories" className="flex flex-col gap-1">
          {categories.map((category) => (
            <CategoryLink key={category.id} category={category} />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-xs text-sidebar-foreground/50">
          Your personal internet universe ✦
        </p>
      </div>
    </aside>
  );
}
