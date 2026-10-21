import type { ReactNode } from "react";
import { PageTransition } from "@/components/effects/page-transition";

/**
 * Remounts on navigation (Next `template` semantics), giving every route a
 * short fade/rise. Layout, header and sidebar stay mounted.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
