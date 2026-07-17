"use client";

import { useRef, type ReactNode } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

export type RevealVariant = "up" | "left" | "right" | "fade" | "scale";

export function Reveal({
  children,
  className = "",
  delayMs = 0,
  variant = "up",
  as: Tag = "div",
  threshold = 0.12,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: RevealVariant;
  as?: "div" | "li" | "article" | "p" | "h2" | "h3";
  threshold?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInViewOnce(ref, threshold);

  return (
    <Tag
      ref={ref as never}
      className={`ff-reveal ff-reveal--${variant} ${inView ? "is-inview" : ""} ${className}`}
      style={{ ["--ff-reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
