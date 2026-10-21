"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StarfieldProps {
  /** Number of stars per viewport area unit (1 = balanced). */
  density?: number;
  className?: string;
  /** Show a pause/resume control (hidden under prefers-reduced-motion). */
  controls?: boolean;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  driftX: number;
  driftY: number;
}

/**
 * Animated cosmic starfield rendered on a canvas.
 * - Static (single paint) when prefers-reduced-motion is set
 * - Pauses when the tab is hidden
 * - Optional pause/resume control (the animation is decorative, so users own it)
 * - Re-seeds on resize
 */
export function Starfield({
  density = 1,
  className = "",
  controls = false,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Only used to hide the pause control when motion is already off.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stars: Star[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const seed = (): void => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((width * height) / 9000 * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.15,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.9 + 0.3,
        driftX: (Math.random() - 0.5) * 0.08,
        driftY: Math.random() * 0.05 + 0.01,
      }));
    };

    const paint = (time: number, animated: boolean): void => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        if (animated) {
          star.x = (star.x + star.driftX + width) % width;
          star.y = (star.y + star.driftY + height) % height;
        }
        const twinkle = animated
          ? Math.sin(time / 1000 * star.twinkleSpeed + star.twinklePhase) * 0.35
          : 0;
        const alpha = Math.min(1, Math.max(0.05, star.baseAlpha + twinkle));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          star.radius > 1.1
            ? `rgba(196, 181, 253, ${alpha})`
            : `rgba(226, 232, 240, ${alpha})`;
        ctx.fill();
      }
    };

    const loop = (time: number): void => {
      paint(time, true);
      raf = window.requestAnimationFrame(loop);
    };

    const start = (): void => {
      window.cancelAnimationFrame(raf);
      if (paused || motionQuery.matches || document.hidden) {
        paint(0, false);
        return;
      }
      raf = window.requestAnimationFrame(loop);
    };

    const onVisibility = (): void => start();
    const onResize = (): void => {
      seed();
      start();
    };
    const onMotionChange = (): void => start();

    seed();
    start();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    motionQuery.addEventListener("change", onMotionChange);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [density, paused]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      />
      {controls && !reducedMotion && (
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={
            paused ? "Resume starfield animation" : "Pause starfield animation"
          }
          title={paused ? "Resume starfield" : "Pause starfield"}
          className="absolute right-4 bottom-4 z-10 hidden size-8 place-items-center rounded-full border border-border/60 bg-background/50 text-muted-foreground backdrop-blur-sm transition hover:border-border hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:grid"
        >
          {paused ? (
            <Play className="size-3.5" aria-hidden />
          ) : (
            <Pause className="size-3.5" aria-hidden />
          )}
        </button>
      )}
    </>
  );
}
