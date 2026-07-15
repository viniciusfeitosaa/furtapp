"use client";

import { useRef, type ReactNode } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

export function Reveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInViewOnce(ref);

  return (
    <Tag
      ref={ref as never}
      className={`ff-reveal ${inView ? "is-inview" : ""} ${className}`}
      style={{ ["--ff-reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
