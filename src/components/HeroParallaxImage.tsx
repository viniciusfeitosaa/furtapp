"use client";

import { useEffect, useRef } from "react";
import { scrollProgressThrough } from "@/lib/motion";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  imgClassName: string;
  alt: string;
  ariaHidden?: boolean;
  maxShift?: number;
};

export function HeroParallaxImage({
  className,
  style,
  imgClassName,
  alt,
  ariaHidden,
  maxShift = 36,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const section = document.getElementById("inicio");

    let active = false;
    let raf = 0;

    const apply = () => {
      if (reduce.matches) {
        img.style.transform = "";
        return;
      }
      const el = section ?? wrap;
      const rect = el.getBoundingClientRect();
      const p = scrollProgressThrough(
        rect.top,
        rect.height,
        window.innerHeight || 1,
      );
      img.style.transform = `translate3d(0, ${p * maxShift}px, 0) scale(1.04)`;
    };

    const tick = () => {
      apply();
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
      apply();
    };

    const target = section ?? wrap;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { root: null, threshold: [0, 0.01] },
    );
    io.observe(target);

    const rect = target.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) start();
    else apply();

    reduce.addEventListener("change", apply);

    return () => {
      stop();
      io.disconnect();
      reduce.removeEventListener("change", apply);
    };
  }, [maxShift]);

  return (
    <div ref={wrapRef} className={className} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src="/media/dr-francisco-retrato-hero6.jpg"
        alt={alt}
        width={922}
        height={1152}
        decoding="async"
        fetchPriority="high"
        aria-hidden={ariaHidden}
        className={`origin-center will-change-transform ${imgClassName}`}
        style={{ transform: "translate3d(0,0,0) scale(1.04)" }}
      />
    </div>
  );
}
