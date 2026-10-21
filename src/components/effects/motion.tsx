"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Seconds before the animation starts. */
  delay?: number;
  /** Travel distance in px. */
  y?: number;
}

/**
 * Scroll-triggered fade-and-rise. Runs once per element.
 * `prefers-reduced-motion` renders a plain wrapper with no transform.
 */
export function FadeIn({ children, className, delay = 0, y = 16 }: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

interface MotionItemProps {
  children: ReactNode;
  className?: string;
  /** Position in a grid — used for a subtle stagger. */
  index?: number;
}

/** Mount animation for grid children (server components stay server-rendered). */
export function MotionItem({ children, className, index = 0 }: MotionItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 8) * 0.04,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
