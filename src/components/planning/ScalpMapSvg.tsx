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
 * Máscara suave alinhada à foto axial (testa cima, nuca baixo, orelhas laterais).
 * Um pouco mais “cabeça real” e menos esquemática — a foto carrega a anatomia.
 */
const SCALP = [
  "M210 62",
  "C248 62 275 78 288 108",
  "C300 138 302 165 295 190",
  "C308 215 328 245 338 285",
  "C348 325 346 365 330 405",
  "C310 450 265 478 210 482",
  "C155 478 110 450 90 405",
  "C74 365 72 325 82 285",
  "C92 245 112 215 125 190",
  "C118 165 120 138 132 108",
  "C145 78 172 62 210 62",
  "Z",
].join(" ");

const RECEPTOR_CORE = [
  "M210 115",
  "C248 115 272 140 278 185",
  "C286 235 272 295 242 330",
  "C225 348 195 348 178 330",
  "C148 295 134 235 142 185",
  "C148 140 172 115 210 115",
  "Z",
].join(" ");

const DONOR = `${SCALP} ${RECEPTOR_CORE}`;

const ZONE_PATH: Record<ReceptorZoneId, string> = {
  templeL: [
    "M140 125",
    "C128 148 126 178 138 208",
    "C158 198 170 178 172 155",
    "C170 138 158 124 140 125",
    "Z",
  ].join(" "),
  templeR: [
    "M280 125",
    "C298 124 286 138 284 155",
    "C286 178 298 198 318 208",
    "C330 178 328 148 316 125",
    "C300 124 288 124 280 125",
    "Z",
  ].join(" "),
  frontal: [
    "M162 92",
    "C186 78 234 78 258 92",
    "C264 110 254 132 234 140",
    "C218 132 202 130 186 140",
    "C166 132 156 110 162 92",
    "Z",
  ].join(" "),
  mid: [
    "M160 152",
    "C188 138 232 138 260 152",
    "C274 190 270 248 246 282",
    "C222 270 198 268 174 282",
    "C150 248 146 190 160 152",
    "Z",
  ].join(" "),
  crown: [
    "M210 295",
    "C238 295 258 315 258 342",
    "C258 369 238 389 210 389",
    "C182 389 162 369 162 342",
    "C162 315 182 295 210 295",
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
    cx: 152,
    cy: 160,
    rx: 20,
    ry: 34,
    n: 32,
    bias: -0.9,
    label: "E",
    lx: 112,
    ly: 162,
  },
  templeR: {
    cx: 268,
    cy: 160,
    rx: 20,
    ry: 34,
    n: 32,
    bias: 0.9,
    label: "D",
    lx: 308,
    ly: 162,
  },
  frontal: {
    cx: 210,
    cy: 110,
    rx: 44,
    ry: 22,
    n: 44,
    bias: -0.1,
    label: "LINHA",
    lx: 210,
    ly: 105,
  },
  mid: {
    cx: 210,
    cy: 210,
    rx: 50,
    ry: 54,
    n: 64,
    bias: 0.05,
    label: "MÉDIO",
    lx: 210,
    ly: 212,
  },
  crown: {
    cx: 210,
    cy: 342,
    rx: 36,
    ry: 34,
    n: 42,
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
    if (r > 0.95) continue;
    const x = cx + Math.cos(t) * r * rx;
    const y = cy + Math.sin(t) * r * ry;
    const outward = Math.atan2(y - 260, x - 210);
    out.push({
      x,
      y,
      a: angleBias + outward * 0.3 + (rnd() - 0.5) * 0.4,
      len: 2.4 + rnd() * 2.8,
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
      map[id] = makeFollicles(z.cx, z.cy, z.rx, z.ry, z.n, 16000 + i * 151, z.bias);
    });
    return map;
  }, []);

  return (
    <svg
      viewBox="0 0 420 520"
      className={className}
      role="img"
      aria-label="Scanner axial sobre foto real do couro cabeludo"
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={SCALP} />
        </clipPath>
        <linearGradient id={`donor-${uid}`} x1="50%" y1="15%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#b6a46e" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#8a7438" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`cyan-${uid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#5ee7ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.22" />
        </radialGradient>
        {/* Tom de scanner clínico sobre a foto */}
        <filter id={`scanTone-${uid}`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="
              0.35 0.35 0.35 0 0.02
              0.42 0.48 0.55 0 0.06
              0.55 0.62 0.75 0 0.14
              0    0    0    1 0"
          />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.05" intercept="0.02" />
            <feFuncG type="linear" slope="1.08" intercept="0.03" />
            <feFuncB type="linear" slope="1.15" intercept="0.06" />
          </feComponentTransfer>
        </filter>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="55%" stopColor="#0f1115" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f1115" stopOpacity="0.55" />
        </radialGradient>
        <pattern
          id={`scanlines-${uid}`}
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 1.5 H3" stroke="rgba(0,210,255,0.07)" strokeWidth="1" />
        </pattern>
        <linearGradient id={`hudTop-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1115" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0f1115" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="420" height="520" fill="#0f1115" />

      {/* Grade HUD de fundo */}
      <g opacity="0.1" stroke="#3d4a63" strokeWidth="0.6" fill="none">
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
        y="30"
        textAnchor="middle"
        fill="rgba(0,210,255,0.7)"
        fontSize="9"
        letterSpacing="0.32em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        FRENTE
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
        AXIAL CAM
      </text>

      {/* === FOTO DA CABEÇA + overlay de scanner === */}
      <g clipPath={`url(#clip-${uid})`}>
        <image
          href={HEAD_PHOTO}
          x="48"
          y="48"
          width="324"
          height="424"
          preserveAspectRatio="xMidYMid slice"
          filter={`url(#scanTone-${uid})`}
        />
        {/* Tint ciano clínico */}
        <rect
          x="40"
          y="40"
          width="340"
          height="440"
          fill="rgba(0, 80, 120, 0.28)"
        />
        <rect
          x="40"
          y="40"
          width="340"
          height="440"
          fill={`url(#scanlines-${uid})`}
        />
        <rect
          x="40"
          y="40"
          width="340"
          height="440"
          fill={`url(#vignette-${uid})`}
        />

        {/* Doadora — âmbar translúcido sobre a ferradura real da foto */}
        <path d={DONOR} fill={`url(#donor-${uid})`} fillRule="evenodd" />
        <path
          d={DONOR}
          fill="none"
          fillRule="evenodd"
          stroke="rgba(182,164,110,0.55)"
          strokeWidth="1.2"
        />

        {/* Zonas receptoras */}
        {(Object.keys(ZONE_PATH) as ReceptorZoneId[]).map((id) => (
          <ZonePath
            key={id}
            d={ZONE_PATH[id]}
            fill={fills[id]}
            active={isZoneFocused(id, focus)}
            gradId={`cyan-${uid}`}
          />
        ))}

        {/* Unidades foliculares do plano (só onde o slider preenche) */}
        {(Object.keys(follicles) as ReceptorZoneId[]).map((id) => {
          const level = fills[id];
          if (level <= 0.02) return null;
          const pts = follicles[id];
          const n = Math.max(1, Math.round(pts.length * level));
          return (
            <g
              key={id}
              stroke="rgba(8, 30, 42, 0.75)"
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

      {/* Contorno scanner */}
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(0,210,255,0.55)"
        strokeWidth="1.6"
      />
      <path
        d={SCALP}
        fill="none"
        stroke="rgba(0,210,255,0.18)"
        strokeWidth="4"
      />

      {/* Mira / retícula */}
      <g stroke="rgba(0,210,255,0.2)" strokeWidth="0.8" fill="none">
        <ellipse cx="210" cy="250" rx="52" ry="62" />
        <line x1="210" y1="90" x2="210" y2="455" />
        <line x1="95" y1="250" x2="325" y2="250" />
      </g>

      {/* Linha anterior */}
      <path
        d="M155 118 C180 98 200 106 210 102 C220 106 240 98 265 118"
        fill="none"
        stroke="#00d2ff"
        strokeWidth={1.2 + fills.frontal * 1.8}
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
        opacity={0.2 + Math.min(fill, 0.4) * 0.7}
      >
        <path d="M150 400 C154 340 160 280 170 220" />
        <path d="M270 400 C266 340 260 280 250 220" />
      </g>

      {/* Labels de zona */}
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
      fillOpacity={empty ? 1 : 0.18 + fill * 0.62}
      stroke={
        active
          ? "rgba(94,231,255,0.95)"
          : empty
            ? "rgba(0,210,255,0.35)"
            : "rgba(0,210,255,0.7)"
      }
      strokeWidth={active ? 2 : 1.2}
      strokeDasharray={empty ? "4 3" : undefined}
      style={{
        transition:
          "fill-opacity 480ms cubic-bezier(0.22,1,0.36,1), stroke 280ms ease",
      }}
    />
  );
}
