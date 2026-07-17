"use client";

import { useId, useMemo } from "react";
import {
  isZoneFocused,
  type PlanZoneId,
  type ReceptorZoneId,
  zoneFills,
} from "@/lib/planningMap";

type Props = {
  /** 0..1 */
  fill: number;
  focus?: PlanZoneId | "temples" | "idle";
  className?: string;
};

type Follicle = { x: number; y: number; a: number; len: number };

/**
 * Vista axial (topo) — crânio mais largo no occipital, testa mais estreita.
 * viewBox 0 0 420 520 · frente = topo.
 */
const SCALP =
  "M210 78 C248 78 278 96 292 128 C308 168 318 210 322 258 C326 308 318 358 298 398 C274 446 246 468 210 472 C174 468 146 446 122 398 C102 358 94 308 98 258 C102 210 112 168 128 128 C142 96 172 78 210 78 Z";

/** Ferradura doadora = crânio − miolo receptor (evenodd). */
const DONOR = `${SCALP}
  M210 132
  C248 132 278 158 286 210
  C294 262 280 318 246 348
  C228 362 192 362 174 348
  C140 318 126 262 134 210
  C142 158 172 132 210 132 Z`;

const ZONE_PATH: Record<ReceptorZoneId, string> = {
  // Entradas em cunha (têmporas)
  templeL:
    "M128 138 C118 158 116 188 128 218 C148 208 158 188 160 164 C158 148 146 134 128 138 Z",
  templeR:
    "M292 138 C302 158 304 188 292 218 C272 208 262 188 260 164 C262 148 274 134 292 138 Z",
  // Linha anterior arqueada
  frontal:
    "M142 108 C172 88 248 88 278 108 C282 128 272 150 248 158 C220 148 200 146 172 158 C148 150 138 128 142 108 Z",
  // Meio-escalpo — escudo
  mid: "M148 168 C178 154 242 154 272 168 C282 204 278 252 250 280 C220 268 200 266 170 280 C142 252 138 204 148 168 Z",
  // Coroa — disco no vértice posterior
  crown:
    "M210 292 C238 292 260 314 260 342 C260 370 238 392 210 392 C182 392 160 370 160 342 C160 314 182 292 210 292 Z",
};

const ZONE_META: Record<
  ReceptorZoneId,
  { cx: number; cy: number; rx: number; ry: number; n: number; bias: number; label: string; lx: number; ly: number }
> = {
  templeL: {
    cx: 138,
    cy: 172,
    rx: 22,
    ry: 36,
    n: 36,
    bias: -0.85,
    label: "E",
    lx: 98,
    ly: 172,
  },
  templeR: {
    cx: 282,
    cy: 172,
    rx: 22,
    ry: 36,
    n: 36,
    bias: 0.85,
    label: "D",
    lx: 322,
    ly: 172,
  },
  frontal: {
    cx: 210,
    cy: 128,
    rx: 58,
    ry: 26,
    n: 56,
    bias: -0.12,
    label: "LINHA",
    lx: 210,
    ly: 102,
  },
  mid: {
    cx: 210,
    cy: 218,
    rx: 58,
    ry: 48,
    n: 72,
    bias: 0.05,
    label: "MÉDIO",
    lx: 210,
    ly: 218,
  },
  crown: {
    cx: 210,
    cy: 342,
    rx: 38,
    ry: 36,
    n: 48,
    bias: 0.25,
    label: "COROA",
    lx: 210,
    ly: 346,
  },
};

function makeFollicles(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  seed: number,
  angleBias: number,
): Follicle[] {
  const out: Follicle[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  let tries = 0;
  while (out.length < count && tries < count * 10) {
    tries += 1;
    const t = 2 * Math.PI * rnd();
    const r = Math.sqrt(rnd());
    if (r > 0.96) continue;
    const x = cx + Math.cos(t) * r * rx;
    const y = cy + Math.sin(t) * r * ry;
    const outward = Math.atan2(y - 260, x - 210);
    out.push({
      x,
      y,
      a: angleBias + outward * 0.3 + (rnd() - 0.5) * 0.45,
      len: 2.8 + rnd() * 3.2,
    });
  }
  return out;
}

function makeDonorHair(): Follicle[] {
  const pts: Follicle[] = [];
  for (let i = 0; i < 64; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = (Math.floor(i / 2) / 31) * Math.PI * 0.9 + 0.15;
    const r = 128 + (i % 5) * 8;
    const x = 210 + side * Math.sin(t) * r * 0.92;
    const y = 250 + Math.cos(t) * r * 0.78;
    // fora do miolo receptor
    if (Math.hypot((x - 210) / 78, (y - 250) / 100) < 0.92) continue;
    pts.push({
      x,
      y,
      a: side * 0.65 + (i % 5) * 0.06,
      len: 3.4 + (i % 4) * 0.7,
    });
  }
  for (let i = 0; i < 36; i += 1) {
    pts.push({
      x: 145 + (i % 9) * 14 + (i % 3),
      y: 400 + Math.floor(i / 9) * 12 + (i % 2) * 2,
      a: (i % 6) * 0.08 - 0.25,
      len: 3.2 + (i % 3) * 0.6,
    });
  }
  return pts;
}

export function ScalpMapSvg({
  fill,
  focus = "idle",
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const fills = useMemo(() => zoneFills(fill), [fill]);
  const follicles = useMemo(() => {
    const map = {} as Record<ReceptorZoneId, Follicle[]>;
    (Object.keys(ZONE_META) as ReceptorZoneId[]).forEach((id, i) => {
      const z = ZONE_META[id];
      map[id] = makeFollicles(z.cx, z.cy, z.rx, z.ry, z.n, 12000 + i * 131, z.bias);
    });
    return map;
  }, []);
  const donorHair = useMemo(() => makeDonorHair(), []);

  return (
    <svg
      viewBox="0 0 420 520"
      className={className}
      role="img"
      aria-label="Mapa axial de planejamento capilar — visão de cima"
    >
      <defs>
        <radialGradient id={`skull-${uid}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#2a3142" />
          <stop offset="55%" stopColor="#1e2330" />
          <stop offset="100%" stopColor="#151922" />
        </radialGradient>
        <linearGradient id={`donor-${uid}`} x1="50%" y1="15%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.22" />
          <stop offset="50%" stopColor="#b6a46e" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#8a7438" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`cyan-${uid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#5ee7ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={SCALP} />
        </clipPath>
        {/* Scanlines HUD */}
        <pattern
          id={`scan-${uid}`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 2 H4"
            stroke="rgba(0,210,255,0.06)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Fundo painel */}
      <rect width="420" height="520" fill="#0f1115" />

      {/* Grade técnica */}
      <g opacity="0.14" stroke="#3d4a63" strokeWidth="0.6" fill="none">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={30 + i * 30} y1={28} x2={30 + i * 30} y2={492} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`h${i}`} x1={30} y1={28 + i * 30} x2={390} y2={28 + i * 30} />
        ))}
      </g>
      {/* Cruz de mira central */}
      <g stroke="rgba(0,210,255,0.12)" strokeWidth="0.8" fill="none">
        <circle cx="210" cy="250" r="40" />
        <circle cx="210" cy="250" r="90" />
        <circle cx="210" cy="250" r="140" />
        <line x1="210" y1="70" x2="210" y2="470" />
        <line x1="50" y1="250" x2="370" y2="250" />
      </g>

      {/* Cantos HUD */}
      <g stroke="rgba(0,210,255,0.45)" strokeWidth="1.2" fill="none">
        <path d="M22 22 H52 M22 22 V52" />
        <path d="M398 22 H368 M398 22 V52" />
        <path d="M22 498 H52 M22 498 V468" />
        <path d="M398 498 H368 M398 498 V468" />
      </g>

      {/* Nariz — referência frontal */}
      <g transform="translate(210 52)">
        <path
          d="M0 0 L-10 18 Q0 24 10 18 Z"
          fill="rgba(0,210,255,0.12)"
          stroke="rgba(0,210,255,0.65)"
          strokeWidth="1.1"
        />
        <circle cx="0" cy="8" r="1.4" fill="rgba(0,210,255,0.8)" />
      </g>
      <text
        x="210"
        y="38"
        textAnchor="middle"
        fill="rgba(0,210,255,0.7)"
        fontSize="9"
        letterSpacing="0.34em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        FRENTE
      </text>

      {/* Orelhas translúcidas */}
      <Ear side="left" />
      <Ear side="right" />

      <g clipPath={`url(#clip-${uid})`}>
        {/* Base do crânio */}
        <path d={SCALP} fill={`url(#skull-${uid})`} />
        <path d={SCALP} fill={`url(#scan-${uid})`} />

        {/* Doadora — âmbar clínico */}
        <path d={DONOR} fill={`url(#donor-${uid})`} fillRule="evenodd" />
        <path
          d={DONOR}
          fill="none"
          fillRule="evenodd"
          stroke="rgba(182,164,110,0.45)"
          strokeWidth="1.2"
        />

        {/* Residual doadora — traços finos tech */}
        <g stroke="rgba(226,211,160,0.35)" strokeLinecap="round">
          {donorHair.map((f, i) => (
            <line
              key={i}
              x1={f.x}
              y1={f.y}
              x2={f.x + Math.sin(f.a) * f.len}
              y2={f.y - Math.cos(f.a) * f.len}
              strokeWidth={0.9 + (i % 3) * 0.15}
            />
          ))}
        </g>

        {/* Zonas receptoras ciano */}
        {(Object.keys(ZONE_PATH) as ReceptorZoneId[]).map((id) => (
          <ZonePath
            key={id}
            d={ZONE_PATH[id]}
            fill={fills[id]}
            active={isZoneFocused(id, focus)}
            gradId={`cyan-${uid}`}
          />
        ))}

        {/* Unidades foliculares ciano/escuras */}
        {(Object.keys(follicles) as ReceptorZoneId[]).map((id) => {
          const level = fills[id];
          if (level <= 0.02) return null;
          const pts = follicles[id];
          const n = Math.max(1, Math.round(pts.length * level));
          return (
            <g
              key={id}
              stroke="rgba(10, 40, 55, 0.85)"
              strokeLinecap="round"
              opacity={0.55 + level * 0.4}
            >
              {pts.slice(0, n).map((f, i) => (
                <line
                  key={i}
                  x1={f.x}
                  y1={f.y}
                  x2={f.x + Math.sin(f.a) * f.len * (0.75 + level * 0.35)}
                  y2={f.y - Math.cos(f.a) * f.len * (0.75 + level * 0.35)}
                  strokeWidth={1 + (i % 2) * 0.2}
                />
              ))}
            </g>
          );
        })}
      </g>

      {/* Contorno do crânio */}
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(160,180,210,0.55)"
        strokeWidth="1.5"
      />
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(0,210,255,0.2)"
        strokeWidth="3"
        opacity="0.5"
      />

      {/* Linha anterior em arco M */}
      <path
        d="M138 130 C168 108 190 118 210 112 C230 118 252 108 282 130"
        fill="none"
        stroke="#00d2ff"
        strokeWidth={1.3 + fills.frontal * 1.8}
        strokeLinecap="round"
        opacity={0.25 + fills.frontal * 0.7}
      />

      {/* Fluxo doadora → receptora */}
      <g
        fill="none"
        stroke="rgba(182,164,110,0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="3 4"
        opacity={0.2 + Math.min(fill, 0.4) * 0.8}
      >
        <path d="M155 380 C158 330 162 280 168 230" />
        <path d="M265 380 C262 330 258 280 252 230" />
      </g>
      <g fill="rgba(182,164,110,0.7)" opacity={0.2 + Math.min(fill, 0.4) * 0.8}>
        <polygon points="168,224 174,236 162,234" />
        <polygon points="252,224 258,234 246,236" />
      </g>

      {/* Labels */}
      {(Object.keys(ZONE_META) as ReceptorZoneId[]).map((id) => {
        const level = fills[id];
        const m = ZONE_META[id];
        const active = isZoneFocused(id, focus);
        const idleShow = fill < 0.03;
        if (!idleShow && level < 0.06 && !active) return null;
        return (
          <text
            key={id}
            x={m.lx}
            y={m.ly}
            textAnchor="middle"
            fill={
              active
                ? "rgba(94,231,255,0.95)"
                : level > 0.15
                  ? "rgba(0,210,255,0.75)"
                  : "rgba(160,180,210,0.4)"
            }
            fontSize={id === "templeL" || id === "templeR" ? 13 : 9}
            letterSpacing="0.18em"
            style={{
              fontFamily: "var(--font-poppins), system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            {m.label}
          </text>
        );
      })}

      <text
        x="210"
        y="508"
        textAnchor="middle"
        fill="rgba(182,164,110,0.55)"
        fontSize="9"
        letterSpacing="0.28em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        NUCA · ÁREA DOADORA
      </text>

      {/* HUD meta */}
      <text
        x="36"
        y="70"
        fill="rgba(0,210,255,0.4)"
        fontSize="8"
        letterSpacing="0.2em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        AXIAL · TOPO
      </text>
      <text
        x="384"
        y="70"
        textAnchor="end"
        fill="rgba(0,210,255,0.4)"
        fontSize="8"
        letterSpacing="0.2em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        SCAN 01
      </text>
    </svg>
  );
}

function Ear({ side }: { side: "left" | "right" }) {
  const mirror = side === "right" ? "translate(420 0) scale(-1 1)" : undefined;
  return (
    <g transform={mirror} opacity="0.9">
      {/* Hélice superior translúcida */}
      <path
        d="M78 205
           C62 212 54 228 56 248
           C58 268 70 282 84 286
           C78 270 76 252 80 234
           C84 220 90 210 96 204
           C90 200 84 200 78 205 Z"
        fill="rgba(0,210,255,0.06)"
        stroke="rgba(0,210,255,0.45)"
        strokeWidth="1.2"
      />
      <path
        d="M86 220 C78 228 76 244 80 258"
        fill="none"
        stroke="rgba(0,210,255,0.3)"
        strokeWidth="0.9"
      />
    </g>
  );
}

function ZonePath({
  d,
  fill,
  active,
  gradId,
}: {
  d: string;
  fill: number;
  active: boolean;
  gradId: string;
}) {
  const empty = fill < 0.04;
  return (
    <path
      d={d}
      fill={empty ? "rgba(0,210,255,0.06)" : `url(#${gradId})`}
      fillOpacity={empty ? 1 : 0.2 + fill * 0.75}
      stroke={
        active
          ? "rgba(94,231,255,0.95)"
          : empty
            ? "rgba(0,210,255,0.28)"
            : "rgba(0,210,255,0.65)"
      }
      strokeWidth={active ? 2 : 1.15}
      strokeDasharray={empty ? "4 3" : undefined}
      style={{
        transition:
          "fill-opacity 480ms cubic-bezier(0.22,1,0.36,1), stroke 280ms ease, stroke-width 280ms ease",
      }}
    />
  );
}
