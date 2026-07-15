"use client";

import { useEffect, useState, type RefObject } from "react";
import { getPrefersReducedMotion } from "@/lib/motion";

export function useInViewOnce(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.15,
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (getPrefersReducedMotion()) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  return inView;
}
