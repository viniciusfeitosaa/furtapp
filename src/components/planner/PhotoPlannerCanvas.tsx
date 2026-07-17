"use client";

import { useEffect, useRef } from "react";
import {
  buildPhotoHairSites,
  graftMask,
  type PhotoHairSite,
} from "@/components/planner/photoDensity";

const RESIDUAL = 5600;
const GRAFT = 4200;

function drawScalp(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0c1018";
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.42;
  const rx = w * 0.38;
  const ry = h * 0.48;

  const skin = ctx.createRadialGradient(cx, cy - ry * 0.2, rx * 0.1, cx, cy, rx);
  skin.addColorStop(0, "#c9a07c");
  skin.addColorStop(0.55, "#a67a55");
  skin.addColorStop(1, "#7a5538");
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Zona calva evidente (entradas + frontal + coroa) — brilho do couro
  paintBaldGlow(ctx, w, h);

  // Contorno
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** Manchas claras onde o slider vai plantar — leitura imediata da calvície. */
function paintBaldGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const step = 4;
  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const g = graftMask(px / w, py / h);
      if (g < 0.2) continue;
      const a = 0.1 + g * 0.28;
      ctx.fillStyle = `rgba(210, 175, 140, ${a})`;
      ctx.fillRect(px, py, step + 1, step + 1);
    }
  }
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
  const scale = Math.min(w, h);
  const len = site.len * scale * 2.8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(site.angle);
  if (site.kind === "graft") {
    ctx.strokeStyle = `rgba(22, 18, 14, ${0.88 * alpha})`;
    ctx.lineWidth = 1.45;
  } else {
    ctx.strokeStyle = `rgba(20, 16, 12, ${0.72 * alpha})`;
    ctx.lineWidth = 1.25;
  }
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
      const h = Math.max(240, Math.floor(rect.height));
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
        // Últimos fios (frente da onda) um pouco mais fortes
        const edge = visible <= 1 ? 1 : Math.min(1, (visible - i) / 120);
        drawHair(ctx, s, w, h, 0.65 + 0.35 * edge);
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
      className="aspect-[16/11] h-auto w-full bg-[#060810] md:aspect-[18/9]"
      aria-label="Simulação 2.5D da densidade capilar sobre o couro"
    />
  );
}

function clampFill(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
