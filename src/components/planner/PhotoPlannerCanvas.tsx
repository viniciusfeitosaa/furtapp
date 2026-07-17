"use client";

import { useEffect, useRef } from "react";
import {
  buildPhotoHairSites,
  type PhotoHairSite,
} from "@/components/planner/photoDensity";

const RESIDUAL = 4200;
const GRAFT = 2800;

function drawScalp(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0c1018";
  ctx.fillRect(0, 0, w, h);

  // Couro — oval
  const cx = w * 0.5;
  const cy = h * 0.42;
  const rx = w * 0.38;
  const ry = h * 0.48;

  const skin = ctx.createRadialGradient(cx, cy - ry * 0.2, rx * 0.1, cx, cy, rx);
  skin.addColorStop(0, "#c49a78");
  skin.addColorStop(0.55, "#a67a55");
  skin.addColorStop(1, "#8a6240");
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sombra suave nas entradas (zona calva)
  ctx.fillStyle = "rgba(90, 55, 35, 0.22)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * rx * 0.48, cy - ry * 0.1, rx * 0.22, ry * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Contorno
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHair(
  ctx: CanvasRenderingContext2D,
  site: PhotoHairSite,
  w: number,
  h: number,
  alpha: number,
) {
  const x = site.x * w;
  const y = site.y * h;
  const len = site.len * Math.min(w, h) * 2.2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(site.angle);
  ctx.strokeStyle =
    site.kind === "graft"
      ? `rgba(32, 28, 24, ${0.75 * alpha})`
      : `rgba(28, 24, 20, ${0.55 * alpha})`;
  ctx.lineWidth = site.kind === "graft" ? 1.15 : 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -len);
  ctx.stroke();
  ctx.restore();
}

export function PhotoPlannerCanvas({
  fill = 0,
}: {
  /** 0..1 fração da zona de enxerto preenchida */
  fill?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sitesRef = useRef<ReturnType<typeof buildPhotoHairSites> | null>(null);

  useEffect(() => {
    sitesRef.current = buildPhotoHairSites(RESIDUAL, GRAFT);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(200, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawScalp(ctx, w, h);

      const sites = sitesRef.current ?? buildPhotoHairSites(RESIDUAL, GRAFT);
      sitesRef.current = sites;

      for (const s of sites.residual) {
        drawHair(ctx, s, w, h, 1);
      }

      const visible = Math.round(sites.graft.length * clampFill(fill));
      for (let i = 0; i < visible; i += 1) {
        const s = sites.graft[i]!;
        const t = visible <= 1 ? 1 : (visible - i) / Math.min(80, visible);
        drawHair(ctx, s, w, h, 0.55 + 0.45 * Math.min(1, t));
      }
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [fill]);

  return (
    <canvas
      ref={canvasRef}
      className="aspect-[16/10] h-auto w-full bg-[#060810] md:aspect-[21/9]"
      aria-label="Simulação 2.5D da densidade capilar sobre o couro"
    />
  );
}

function clampFill(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
