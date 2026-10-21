import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

/** Dashboard KPI card: icon tile, big value, label + optional hint. */
export function StatCard({ icon: Icon, label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-4",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-2xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        <span className="block truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {hint && <span className="block truncate text-[11px] text-muted-foreground/70">{hint}</span>}
      </span>
    </div>
  );
}
