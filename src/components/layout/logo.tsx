import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
}

/**
 * MilanVerse wordmark — text only, Claude-style terracotta orange.
 * Server-component safe (no hooks).
 */
export function Logo({ className, href = "/" }: LogoProps) {
  const mark = (
    <span className="text-base font-bold tracking-tight text-[#d97757]">
      MilanVerse
    </span>
  );

  if (!href) {
    return <span className={cn("inline-flex", className)}>{mark}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="MilanVerse home"
      className={cn(
        "rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {mark}
    </Link>
  );
}
