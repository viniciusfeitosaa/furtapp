"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Escala máxima no fim do scroll (1.08 = +8%). */
  maxScale?: number;
  /** Seletor do container que define o progresso do scroll. */
  sectionSelector?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  "aria-hidden"?: boolean | "true" | "false";
};

/**
 * Zoom suave na imagem enquanto a seção passa pelo viewport.
 * Respeita prefers-reduced-motion.
 */
export function ScrollZoomImage({
  src,
  alt,
  width,
  height,
  className = "",
  maxScale = 1.1,
  sectionSelector = "#pilares",
  loading = "lazy",
  decoding = "async",
  "aria-hidden": ariaHidden,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const section =
      (img.closest(sectionSelector) as HTMLElement | null) ??
      (img.parentElement as HTMLElement | null);
    if (!section) return;

    let raf = 0;

    const apply = () => {
      raf = 0;
      if (reduce.matches) {
        img.style.transform = "scale(1)";
        return;
      }
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const total = viewH + rect.height;
      const progressed = viewH - rect.top;
      const p = Math.min(1, Math.max(0, progressed / total));
      const scale = 1 + p * (maxScale - 1);
      img.style.transform = `scale(${scale})`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reduce.addEventListener("change", apply);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduce.removeEventListener("change", apply);
    };
  }, [maxScale, sectionSelector]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      aria-hidden={ariaHidden}
      className={`origin-center will-change-transform ${className}`}
      style={{ transform: "scale(1)" }}
    />
  );
}
