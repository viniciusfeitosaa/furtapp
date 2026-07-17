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
 * Silhueta de CABEÇA vista de cima (axial), não oval:
 * - testa estreita / quase reta
 * - reentrâncias temporais (entradas)
 * - máxima largura nas orelhas / parietal
 * - occipital largo e arredondado
 * viewBox 0 0 420 520 · frente = topo
 */
const SCALP = [
  "M210 68",
  // testa direita (estreita)
  "C238 68 258 74 268 92",
  "C278 110 282 128 276 148",
  // reentrância temporal D (entrada)
  "C268 165 262 178 268 198",
  // sai para a orelha / parietal D (bem largo)
  "C278 225 302 250 318 285",
  "C332 318 338 355 330 395",
  // occipital D → nuca larga
  "C320 435 285 468 210 474",
  // occipital E
  "C135 468 100 435 90 395",
  "C82 355 88 318 102 285",
  // parietal / orelha E
  "C118 250 142 225 152 198",
  // reentrância temporal E
  "C158 178 152 165 145 148",
  "C138 128 142 110 152 92",
  "C162 74 182 68 210 68",
  "Z",
].join(" ");

/** Miolo receptor (vazio da ferradura). */
const RECEPTOR_CORE = [
  "M210 118",
  "C242 118 265 140 272 182",
  "C280 228 268 285 240 322",
  "C225 340 195 340 180 322",
  "C152 285 140 228 148 182",
  "C155 140 178 118 210 118",
  "Z",
].join(" ");

const DONOR = `${SCALP} ${RECEPTOR_CORE}`;

const ZONE_PATH: Record<ReceptorZoneId, string> = {
  // Cunhas nas reentrâncias temporais
  templeL: [
    "M148 130",
    "C138 148 136 172 145 200",
    "C162 192 172 175 174 155",
    "C172 140 162 128 148 130",
    "Z",
  ].join(" "),
  templeR: [
    "M272 130",
    "C286 128 276 140 274 155",
    "C276 175 286 192 303 200",
    "C312 172 310 148 300 130",
    "C288 128 278 128 272 130",
    "Z",
  ].join(" "),
  // Faixa frontal estreita (testa)
  frontal: [
    "M168 95",
    "C188 82 232 82 252 95",
    "C258 112 250 132 232 140",
    "C218 132 202 130 188 140",
    "C170 132 162 112 168 95",
    "Z",
  ].join(" "),
  // Escudo no meio
  mid: [
    "M165 155",
    "C190 142 230 142 255 155",
    "C268 190 265 245 242 278",
    "C220 266 200 264 178 278",
    "C155 245 152 190 165 155",
    "Z",
  ].join(" "),
  // Coroa — mais atrás, sobre o vértice
  crown: [
    "M210 288",
    "C236 288 256 308 256 334",
    "C256 360 236 380 210 380",
    "C184 380 164 360 164 334",
    "C164 308 184 288 210 288",
    "Z",
  ].join(" "),
};

const ZONE_META: Record<
  ReceptorZoneId,
  {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    n: number;
    bias: number;
    label: string;
    lx: number;
    ly: number;
  }
> = {
  templeL: {
    cx: 158,
    cy: 162,
    rx: 18,
    ry: 32,
    n: 34,
    bias: -0.9,
    label: "E",
    lx: 118,
    ly: 165,
  },
  templeR: {
    cx: 262,
    cy: 162,
    rx: 18,
    ry: 32,
    n: 34,
    bias: 0.9,
    label: "D",
    lx: 302,
    ly: 165,
  },
  frontal: {
    cx: 210,
    cy: 112,
    rx: 42,
    ry: 22,
    n: 48,
    bias: -0.1,
    label: "LINHA",
    lx: 210,
    ly: 108,
  },
  mid: {
    cx: 210,
    cy: 210,
    rx: 48,
    ry: 52,
    n: 70,
    bias: 0.05,
    label: "MÉDIO",
    lx: 210,
    ly: 212,
  },
  crown: {
    cx: 210,
    cy: 334,
    rx: 36,
    ry: 34,
    n: 46,
    bias: 0.25,
    label: "COROA",
    lx: 210,
    ly: 338,
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
      len: 2.6 + rnd() * 3,
    });
  }
  return out;
}

function makeDonorHair(): Follicle[] {
  const pts: Follicle[] = [];
  // Laterais largas (parietal → orelha)
  for (let i = 0; i < 70; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = 0.35 + (Math.floor(i / 2) / 34) * 1.1;
    const r = 135 + (i % 5) * 10;
    const x = 210 + side * Math.sin(t) * r;
    const y = 270 + Math.cos(t) * r * 0.72;
    // só fora do miolo
    if (Math.hypot((x - 210) / 70, (y - 230) / 95) < 1.02) continue;
    if (y < 160) continue;
    pts.push({
      x,
      y,
      a: side * 0.7 + (i % 5) * 0.05,
      len: 3.2 + (i % 4) * 0.7,
    });
  }
  // Nuca larga
  for (let i = 0; i < 42; i += 1) {
    pts.push({
      x: 130 + (i % 10) * 16 + (i % 3) * 2,
      y: 400 + Math.floor(i / 10) * 14 + (i % 2) * 3,
      a: (i % 6) * 0.08 - 0.2,
      len: 3 + (i % 3) * 0.6,
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
      map[id] = makeFollicles(z.cx, z.cy, z.rx, z.ry, z.n, 14000 + i * 149, z.bias);
    });
    return map;
  }, []);
  const donorHair = useMemo(() => makeDonorHair(), []);

  return (
    <svg
      viewBox="0 0 420 520"
      className={className}
      role="img"
      aria-label="Mapa axial da cabeça — visão de cima do couro cabeludo"
    >
      <defs>
        <radialGradient id={`skull-${uid}`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#2c3448" />
          <stop offset="50%" stopColor="#1e2330" />
          <stop offset="100%" stopColor="#141820" />
        </radialGradient>
        <linearGradient id={`donor-${uid}`} x1="50%" y1="20%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.2" />
          <stop offset="55%" stopColor="#b6a46e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8a7438" stopOpacity="0.58" />
        </linearGradient>
        <radialGradient id={`cyan-${uid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#5ee7ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={SCALP} />
        </clipPath>
        <pattern
          id={`scan-${uid}`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 2 H4" stroke="rgba(0,210,255,0.05)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="420" height="520" fill="#0f1115" />

      {/* Grade HUD */}
      <g opacity="0.12" stroke="#3d4a63" strokeWidth="0.6" fill="none">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={30 + i * 30} y1={24} x2={30 + i * 30} y2={496} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`h${i}`} x1={30} y1={24 + i * 30} x2={390} y2={24 + i * 30} />
        ))}
      </g>
      <g stroke="rgba(0,210,255,0.1)" strokeWidth="0.7" fill="none">
        <ellipse cx="210" cy="270" rx="48" ry="58" />
        <ellipse cx="210" cy="270" rx="95" ry="115" />
        <line x1="210" y1="60" x2="210" y2="485" />
      </g>

      {/* Cantos */}
      <g stroke="rgba(0,210,255,0.45)" strokeWidth="1.2" fill="none">
        <path d="M20 20 H50 M20 20 V50" />
        <path d="M400 20 H370 M400 20 V50" />
        <path d="M20 500 H50 M20 500 V470" />
        <path d="M400 500 H370 M400 500 V470" />
      </g>

      {/* NARIZ — saliência frontal clara */}
      <g transform="translate(210 48)">
        <path
          d="M0 2 L-14 26 Q0 34 14 26 Z"
          fill="rgba(0,210,255,0.1)"
          stroke="rgba(0,210,255,0.75)"
          strokeWidth="1.3"
        />
        <path
          d="M-5 14 Q0 18 5 14"
          fill="none"
          stroke="rgba(0,210,255,0.45)"
          strokeWidth="0.9"
        />
        <circle cx="0" cy="10" r="1.6" fill="rgba(94,231,255,0.9)" />
      </g>
      <text
        x="210"
        y="32"
        textAnchor="middle"
        fill="rgba(0,210,255,0.75)"
        fontSize="9"
        letterSpacing="0.34em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        FRENTE · NARIZ
      </text>

      {/* ORELHAS — na máxima largura parietal */}
      <Ear side="left" />
      <Ear side="right" />
      <text
        x="48"
        y="310"
        fill="rgba(0,210,255,0.4)"
        fontSize="7"
        letterSpacing="0.1em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        ORELHA
      </text>
      <text
        x="372"
        y="310"
        textAnchor="end"
        fill="rgba(0,210,255,0.4)"
        fontSize="7"
        letterSpacing="0.1em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        ORELHA
      </text>

      <g clipPath={`url(#clip-${uid})`}>
        <path d={SCALP} fill={`url(#skull-${uid})`} />
        <path d={SCALP} fill={`url(#scan-${uid})`} />

        {/* Sombra na testa (volume) */}
        <ellipse cx="210" cy="100" rx="48" ry="22" fill="rgba(0,0,0,0.2)" />

        {/* Doadora */}
        <path d={DONOR} fill={`url(#donor-${uid})`} fillRule="evenodd" />
        <path
          d={DONOR}
          fill="none"
          fillRule="evenodd"
          stroke="rgba(182,164,110,0.5)"
          strokeWidth="1.15"
        />

        <g stroke="rgba(226,211,160,0.38)" strokeLinecap="round">
          {donorHair.map((f, i) => (
            <line
              key={i}
              x1={f.x}
              y1={f.y}
              x2={f.x + Math.sin(f.a) * f.len}
              y2={f.y - Math.cos(f.a) * f.len}
              strokeWidth={0.85 + (i % 3) * 0.15}
            />
          ))}
        </g>

        {(Object.keys(ZONE_PATH) as ReceptorZoneId[]).map((id) => (
          <ZonePath
            key={id}
            d={ZONE_PATH[id]}
            fill={fills[id]}
            active={isZoneFocused(id, focus)}
            gradId={`cyan-${uid}`}
          />
        ))}

        {(Object.keys(follicles) as ReceptorZoneId[]).map((id) => {
          const level = fills[id];
          if (level <= 0.02) return null;
          const pts = follicles[id];
          const n = Math.max(1, Math.round(pts.length * level));
          return (
            <g
              key={id}
              stroke="rgba(8, 36, 48, 0.88)"
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

      {/* Contorno da cabeça */}
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(170,190,220,0.65)"
        strokeWidth="1.7"
      />
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(0,210,255,0.22)"
        strokeWidth="3.2"
      />

      {/* Linha anterior — segue a testa estreita */}
      <path
        d="M158 118 C180 100 200 108 210 104 C220 108 240 100 262 118"
        fill="none"
        stroke="#00d2ff"
        strokeWidth={1.2 + fills.frontal * 1.8}
        strokeLinecap="round"
        opacity={0.22 + fills.frontal * 0.72}
      />

      {/* Fluxo doadora → receptora */}
      <g
        fill="none"
        stroke="rgba(182,164,110,0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="3 4"
        opacity={0.18 + Math.min(fill, 0.4) * 0.75}
      >
        <path d="M148 400 C152 340 158 280 168 220" />
        <path d="M272 400 C268 340 262 280 252 220" />
      </g>
      <g
        fill="rgba(182,164,110,0.7)"
        opacity={0.18 + Math.min(fill, 0.4) * 0.75}
      >
        <polygon points="168,214 174,226 162,224" />
        <polygon points="252,214 258,224 246,226" />
      </g>

      {/* Labels */}
      {(Object.keys(ZONE_META) as ReceptorZoneId[]).map((id) => {
        const level = fills[id];
        const m = ZONE_META[id];
        const active = isZoneFocused(id, focus);
        if (fill >= 0.03 && level < 0.06 && !active) return null;
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
            letterSpacing="0.16em"
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
        letterSpacing="0.26em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        OCCIPITAL · DOADORA
      </text>

      <text
        x="34"
        y="68"
        fill="rgba(0,210,255,0.4)"
        fontSize="8"
        letterSpacing="0.18em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        AXIAL
      </text>
      <text
        x="386"
        y="68"
        textAnchor="end"
        fill="rgba(0,210,255,0.4)"
        fontSize="8"
        letterSpacing="0.18em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        HEAD MAP
      </text>
    </svg>
  );
}

/** Orelha no ponto de máxima largura da cabeça. */
function Ear({ side }: { side: "left" | "right" }) {
  const mirror = side === "right" ? "translate(420 0) scale(-1 1)" : undefined;
  return (
    <g transform={mirror}>
      <path
        d={[
          "M96 255",
          "C72 262 58 282 60 308",
          "C62 332 78 350 98 354",
          "C92 338 88 318 92 298",
          "C96 280 108 268 118 262",
          "C110 256 102 254 96 255",
          "Z",
        ].join(" ")}
        fill="rgba(0,210,255,0.07)"
        stroke="rgba(0,210,255,0.55)"
        strokeWidth="1.25"
      />
      <path
        d="M88 280 C78 290 76 312 84 330"
        fill="none"
        stroke="rgba(0,210,255,0.35)"
        strokeWidth="1"
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
          "fill-opacity 480ms cubic-bezier(0.22,1,0.36,1), stroke 280ms ease",
      }}
    />
  );
}
