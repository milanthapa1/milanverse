"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, House, LayoutGrid, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: MobileNavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/search", label: "Explore", icon: Compass },
  { href: "/collection", label: "Collection", icon: LayoutGrid },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

/** Fixed bottom navigation on mobile (hidden on md+). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            item.href === "/search"
              ? pathname === "/search"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
