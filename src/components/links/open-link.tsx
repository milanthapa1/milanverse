"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { trackOpenAction } from "@/server/actions/links";

interface OpenLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> {
  id: string;
  href: string;
  /** Accessible name, e.g. "Open Netflix in a new tab". */
  label: string;
  children: ReactNode;
}

/**
 * External anchor that records an "open" in the background — this feeds
 * "Recently opened" and the popularity ranking.
 *
 * Fire-and-forget: the action promise is never awaited, so navigation is
 * never blocked and middle-click / ⌘-click / new-tab semantics are untouched.
 */
export function OpenLink({ id, href, label, children, onClick, ...rest }: OpenLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    void trackOpenAction({ id });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
