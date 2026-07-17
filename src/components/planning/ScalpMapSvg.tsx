"use client";

import { useId, useMemo } from "react";
import {
  isZoneFocused,
  type PlanZoneId,
  type ReceptorZoneId,
  zoneFills,
} from "@/lib/planningMap";

const HEAD_PHOTO = "/media/head-axial-scan.jpg";

type Props = {
  /** 0..1 */
  fill: number;
  focus?: PlanZoneId | "temples" | "idle";
  className?: string;
};

type Follicle = { x: number; y: number; a: number; len: number };

/**
 * Silhueta axial CORRETA: ovo/elipse contínua.
 * Testa um pouco mais estreita no topo, occipital mais largo embaixo.
 * SEM cintura, SEM formato 8, SEM amendoim.
 */
const SCALP = [
  "M210 58",
  "C252 58 288 88 300 145",
  "C312 200 314 270 304 340",
  "C292 405 258 455 210 470",
  "C162 455 128 405 116 340",
  "C106 270 108 200 120 145",
  "C132 88 168 58 210 58",
  "Z",
].join(" ");

/** Miolo receptor (interior da ferradura doadora). */
const RECEPTOR_CORE = [
  "M210 125",
  "C248 125 272 155 276 210",
  "C278 270 258 330 228 360",
  "C215 370 205 370 192 360",
  "C162 330 142 270 145 210",
  "C148 155 172 125 210 125",
  "Z",
].join(" ");

const DONOR = `${SCALP} ${RECEPTOR_CORE}`;

/** Zonas DENTRO do ovo — não deformam o contorno. */
const ZONE_PATH: Record<ReceptorZoneId, string> = {
  templeL: [
    "M145 135",
    "C135 160 136 195 150 225",
    "C168 212 178 188 178 162",
    "C176 145 162 132 145 135",
    "Z",
  ].join(" "),
  templeR: [
    "M275 135",
    "C292 132 278 145 276 162",
    "C276 188 286 212 304 225",
    "C318 195 319 160 309 135",
    "C294 132 282 132 275 135",
    "Z",
  ].join(" "),
  frontal: [
    "M160 95",
    "C185 78 235 78 260 95",
    "C266 115 256 138 236 146",
    "C220 138 200 136 184 146",
    "C164 138 154 115 160 95",
    "Z",
  ].join(" "),
  mid: [
    "M158 160",
    "C186 145 234 145 262 160",
    "C276 205 272 265 246 300",
    "C222 288 198 286 174 300",
    "C148 265 144 205 158 160",
    "Z",
  ].join(" "),
  crown: [
    "M210 305",
    "C238 305 258 325 258 350",
    "C258 375 238 395 210 395",
    "C182 395 162 375 162 350",
    "C162 325 182 305 210 305",
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
    cy: 175,
    rx: 18,
    ry: 36,
    n: 30,
    bias: -0.85,
    label: "E",
    lx: 122,
    ly: 175,
  },
  templeR: {
    cx: 262,
    cy: 175,
    rx: 18,
    ry: 36,
    n: 30,
    bias: 0.85,
    label: "D",
    lx: 298,
    ly: 175,
  },
  frontal: {
    cx: 210,
    cy: 112,
    rx: 46,
    ry: 24,
    n: 44,
    bias: -0.1,
    label: "LINHA",
    lx: 210,
    ly: 108,
  },
  mid: {
    cx: 210,
    cy: 220,
    rx: 52,
    ry: 58,
    n: 68,
    bias: 0.05,
    label: "MÉDIO",
    lx: 210,
    ly: 222,
  },
  crown: {
    cx: 210,
    cy: 350,
    rx: 36,
    ry: 34,
    n: 44,
    bias: 0.2,
    label: "COROA",
    lx: 210,
    ly: 354,
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
    if (r > 0.95) continue;
    const x = cx + Math.cos(t) * r * rx;
    const y = cy + Math.sin(t) * r * ry;
    const outward = Math.atan2(y - 260, x - 210);
    out.push({
      x,
      y,
      a: angleBias + outward * 0.28 + (rnd() - 0.5) * 0.4,
      len: 2.3 + rnd() * 2.6,
    });
  }
  return out;
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
      map[id] = makeFollicles(z.cx, z.cy, z.rx, z.ry, z.n, 18000 + i * 163, z.bias);
    });
    return map;
  }, []);

  return (
    <svg
      viewBox="0 0 420 520"
      className={className}
      role="img"
      aria-label="Scanner axial sobre couro cabeludo — silhueta oval de cabeça"
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={SCALP} />
        </clipPath>
        <linearGradient id={`donor-${uid}`} x1="50%" y1="20%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#b6a46e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8a7438" stopOpacity="0.42" />
        </linearGradient>
        <radialGradient id={`cyan-${uid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#5ee7ff" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.2" />
        </radialGradient>
        <filter id={`scanTone-${uid}`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="
              0.38 0.38 0.38 0 0.02
              0.4  0.48 0.55 0 0.05
              0.5  0.6  0.72 0 0.12
              0    0    0    1 0"
          />
        </filter>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="45%" r="58%">
          <stop offset="50%" stopColor="#0f1115" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f1115" stopOpacity="0.5" />
        </radialGradient>
        <pattern
          id={`scanlines-${uid}`}
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 1.5 H3" stroke="rgba(0,210,255,0.06)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="420" height="520" fill="#0f1115" />

      <g opacity="0.09" stroke="#3d4a63" strokeWidth="0.6" fill="none">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={30 + i * 30} y1={24} x2={30 + i * 30} y2={496} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`h${i}`} x1={30} y1={24 + i * 30} x2={390} y2={24 + i * 30} />
        ))}
      </g>

      <g stroke="rgba(0,210,255,0.45)" strokeWidth="1.2" fill="none">
        <path d="M20 20 H50 M20 20 V50" />
        <path d="M400 20 H370 M400 20 V50" />
        <path d="M20 500 H50 M20 500 V470" />
        <path d="M400 500 H370 M400 500 V470" />
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
        FRENTE · TESTA
      </text>
      <text
        x="34"
        y="64"
        fill="rgba(0,210,255,0.4)"
        fontSize="8"
        letterSpacing="0.16em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        LIVE SCAN
      </text>
      <text
        x="386"
        y="64"
        textAnchor="end"
        fill="rgba(0,210,255,0.4)"
        fontSize="8"
        letterSpacing="0.16em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        VERTEX
      </text>

      {/* Foto do couro — ovo contínuo */}
      <g clipPath={`url(#clip-${uid})`}>
        <image
          href={HEAD_PHOTO}
          x="70"
          y="50"
          width="280"
          height="430"
          preserveAspectRatio="xMidYMid slice"
          filter={`url(#scanTone-${uid})`}
        />
        <rect x="50" y="40" width="320" height="450" fill="rgba(0,70,110,0.3)" />
        <rect
          x="50"
          y="40"
          width="320"
          height="450"
          fill={`url(#scanlines-${uid})`}
        />
        <rect
          x="50"
          y="40"
          width="320"
          height="450"
          fill={`url(#vignette-${uid})`}
        />

        <path d={DONOR} fill={`url(#donor-${uid})`} fillRule="evenodd" />
        <path
          d={DONOR}
          fill="none"
          fillRule="evenodd"
          stroke="rgba(182,164,110,0.5)"
          strokeWidth="1.15"
        />

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
              stroke="rgba(8, 30, 42, 0.72)"
              strokeLinecap="round"
              opacity={0.5 + level * 0.45}
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

      {/* Contorno ovo — contínuo */}
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(0,210,255,0.6)"
        strokeWidth="1.7"
      />
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(0,210,255,0.16)"
        strokeWidth="4"
      />

      {/* Retícula leve */}
      <g stroke="rgba(0,210,255,0.18)" strokeWidth="0.8" fill="none">
        <ellipse cx="210" cy="260" rx="55" ry="78" />
        <line x1="210" y1="80" x2="210" y2="450" />
        <line x1="110" y1="260" x2="310" y2="260" />
      </g>

      {/* Linha anterior */}
      <path
        d="M158 120 C182 100 200 108 210 104 C220 108 238 100 262 120"
        fill="none"
        stroke="#00d2ff"
        strokeWidth={1.2 + fills.frontal * 1.7}
        strokeLinecap="round"
        opacity={0.25 + fills.frontal * 0.7}
      />

      <g
        fill="none"
        stroke="rgba(182,164,110,0.5)"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeDasharray="3 4"
        opacity={0.2 + Math.min(fill, 0.4) * 0.65}
      >
        <path d="M145 410 C150 350 158 290 170 230" />
        <path d="M275 410 C270 350 262 290 250 230" />
      </g>

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
                  ? "rgba(0,210,255,0.8)"
                  : "rgba(200,220,240,0.45)"
            }
            fontSize={id === "templeL" || id === "templeR" ? 13 : 9}
            letterSpacing="0.14em"
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
        letterSpacing="0.24em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        OCCIPITAL · DOADORA
      </text>
    </svg>
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
      fill={empty ? "rgba(0,210,255,0.05)" : `url(#${gradId})`}
      fillOpacity={empty ? 1 : 0.16 + fill * 0.6}
      stroke={
        active
          ? "rgba(94,231,255,0.95)"
          : empty
            ? "rgba(0,210,255,0.35)"
            : "rgba(0,210,255,0.7)"
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
