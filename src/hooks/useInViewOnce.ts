"use client";

import { useEffect, useState, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function useInViewOnce(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.15,
) {
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) return;

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, reduced]);

  // CSS .ff-reveal sob reduced-motion já força visível; true aqui cobre uso programático.
  return reduced || inView;
}
