"use client";

import { useEffect, useState, type RefObject } from "react";
import { scrollProgressThrough } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Retorna 0–1 enquanto o elemento atravessa o viewport (rAF só quando visível). */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;

    const el = ref.current;
    if (!el) return;

    let active = false;
    let raf = 0;

    const read = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      setProgress(scrollProgressThrough(rect.top, rect.height, viewH));
    };

    const tick = () => {
      read();
      if (active) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      read();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) start();
    else read();

    return () => {
      stop();
      io.disconnect();
    };
  }, [ref, reduced]);

  return reduced ? 0 : progress;
}
