"use client";

import { useState } from "react";
import { fallbackFavicon, getDomain, getSiteLabel, secondaryFavicon } from "@/lib/url";

interface FaviconProps {
  url: string;
  /** Direct favicon URL from metadata, when available */
  favicon?: string | null;
  /** Tint behind the icon (usually the category color) */
  tint?: string;
  className?: string;
}

/**
 * Site favicon with a two-step fallback chain:
 * metadata favicon → Google s2 → DuckDuckGo → domain initial tile.
 * Never renders a broken image.
 */
export function Favicon({ url, favicon, tint = "#7C5CFF", className = "" }: FaviconProps) {
  const [stage, setStage] = useState(0);
  const initial = getSiteLabel(url).charAt(0).toUpperCase();

  const sources: string[] = [
    ...(favicon ? [favicon] : []),
    fallbackFavicon(url),
    secondaryFavicon(url),
  ];
  const src: string | null = stage < sources.length ? (sources[stage] ?? null) : null;

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-bold text-white ${className}`}
      style={{ backgroundColor: tint }}
    >
      <span aria-hidden className="select-none">
        {initial}
      </span>
      {src && (
        /* Native img required: URLs are user-provided/arbitrary external domains */
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full bg-white/90 object-contain p-1"
          onError={() => setStage((s) => s + 1)}
        />
      )}
      <span className="sr-only">{getDomain(url)}</span>
    </span>
  );
}
