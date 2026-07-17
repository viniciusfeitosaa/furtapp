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

/** Gera unidades foliculares estáveis dentro de uma elipse. */
function makeFollicles(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  seed: number,
  angleBias = -0.2,
): Follicle[] {
  const out: Follicle[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
  let tries = 0;
  while (out.length < count && tries < count * 8) {
    tries += 1;
    const u = rnd();
    const v = rnd();
    const t = 2 * Math.PI * u;
    const r = Math.sqrt(v);
    const x = cx + Math.cos(t) * r * rx;
    const y = cy + Math.sin(t) * r * ry;
    // leve rejeição nas bordas muito externas
    if (r > 0.97) continue;
    const outward = Math.atan2(y - 240, x - 200);
    out.push({
      x,
      y,
      a: angleBias + outward * 0.35 + (rnd() - 0.5) * 0.5,
      len: 3.2 + rnd() * 3.8,
    });
  }
  return out;
}

const ZONE_ELLIPSE: Record<
  ReceptorZoneId,
  { cx: number; cy: number; rx: number; ry: number; n: number; bias: number }
> = {
  templeL: { cx: 118, cy: 175, rx: 28, ry: 42, n: 42, bias: -0.9 },
  templeR: { cx: 282, cy: 175, rx: 28, ry: 42, n: 42, bias: 0.9 },
  frontal: { cx: 200, cy: 128, rx: 72, ry: 32, n: 70, bias: -0.15 },
  mid: { cx: 200, cy: 210, rx: 68, ry: 48, n: 78, bias: 0.05 },
  crown: { cx: 200, cy: 295, rx: 42, ry: 38, n: 52, bias: 0.2 },
};

const ZONE_PATH: Record<ReceptorZoneId, string> = {
  templeL:
    "M95 128 C86 150 88 188 108 218 C128 208 138 188 140 160 C136 140 118 124 95 128 Z",
  templeR:
    "M305 128 C314 150 312 188 292 218 C272 208 262 188 260 160 C264 140 282 124 305 128 Z",
  frontal:
    "M120 95 C155 70 245 70 280 95 C286 118 276 148 248 156 C220 146 180 146 152 156 C124 148 114 118 120 95 Z",
  mid: "M128 162 C162 150 238 150 272 162 C282 196 278 242 252 268 C220 256 180 256 148 268 C122 242 118 196 128 162 Z",
  crown:
    "M158 258 C182 242 218 242 242 258 C258 284 254 322 226 342 C210 334 190 334 174 342 C146 322 142 284 158 258 Z",
};

const ZONE_LABEL: Record<ReceptorZoneId, { x: number; y: number; t: string }> =
  {
    templeL: { x: 72, y: 168, t: "E" },
    templeR: { x: 328, y: 168, t: "D" },
    frontal: { x: 200, y: 88, t: "LINHA" },
    mid: { x: 200, y: 208, t: "MÉDIO" },
    crown: { x: 200, y: 298, t: "COROA" },
  };

export function ScalpMapSvg({
  fill,
  focus = "idle",
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const fills = useMemo(() => zoneFills(fill), [fill]);

  const follicles = useMemo(() => {
    const map = {} as Record<ReceptorZoneId, Follicle[]>;
    (Object.keys(ZONE_ELLIPSE) as ReceptorZoneId[]).forEach((id, i) => {
      const z = ZONE_ELLIPSE[id];
      map[id] = makeFollicles(z.cx, z.cy, z.rx, z.ry, z.n, 9000 + i * 97, z.bias);
    });
    return map;
  }, []);

  const donorHair = useMemo(() => makeDonorHair(), []);

  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      role="img"
      aria-label="Mapa de planejamento do couro cabeludo visto de cima"
    >
      <defs>
        <radialGradient id={`skin-${uid}`} cx="50%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#3a322c" />
          <stop offset="45%" stopColor="#241e1a" />
          <stop offset="100%" stopColor="#120f0e" />
        </radialGradient>
        <linearGradient id={`donor-${uid}`} x1="50%" y1="20%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#9a8850" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#6e5f36" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#4a3f24" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`graft-${uid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#e2d3a0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b6a46e" stopOpacity="0.75" />
        </radialGradient>
        <clipPath id={`scalp-${uid}`}>
          <path d={SCALP_OUTLINE} />
        </clipPath>
      </defs>

      {/* Prancheta */}
      <rect width="400" height="500" fill="#060810" />
      {/* Marcas de registro */}
      <g stroke="rgba(182,164,110,0.35)" strokeWidth="1" fill="none">
        <path d="M24 24 H48 M24 24 V48" />
        <path d="M376 24 H352 M376 24 V48" />
        <path d="M24 476 H48 M24 476 V452" />
        <path d="M376 476 H352 M376 476 V452" />
      </g>
      {/* Grade sutil radial */}
      <g opacity="0.07" stroke="#b6a46e" strokeWidth="0.7" fill="none">
        <ellipse cx="200" cy="230" rx="70" ry="85" />
        <ellipse cx="200" cy="230" rx="105" ry="125" />
        <ellipse cx="200" cy="230" rx="140" ry="165" />
        <line x1="200" y1="55" x2="200" y2="445" />
        <line x1="55" y1="230" x2="345" y2="230" />
      </g>

      <g clipPath={`url(#scalp-${uid})`}>
        {/* Pele */}
        <path d={SCALP_OUTLINE} fill={`url(#skin-${uid})`} />

        {/* Sombra da face / testa (área sem plano) */}
        <ellipse
          cx="200"
          cy="95"
          rx="78"
          ry="28"
          fill="rgba(0,0,0,0.22)"
        />

        {/* Doadora — ferradura com interior recortado */}
        <path
          d={DONOR_PATH}
          fill={`url(#donor-${uid})`}
          fillRule="evenodd"
        />

        {/* Cabelo residual na doadora */}
        <g stroke="#1a1510" strokeLinecap="round" opacity="0.55">
          {donorHair.map((f, i) => (
            <line
              key={i}
              x1={f.x}
              y1={f.y}
              x2={f.x + Math.sin(f.a) * f.len}
              y2={f.y - Math.cos(f.a) * f.len}
              strokeWidth={1.05 + (i % 3) * 0.15}
            />
          ))}
        </g>

        {/* Zonas receptoras */}
        {(Object.keys(ZONE_PATH) as ReceptorZoneId[]).map((id) => (
          <ZonePath
            key={id}
            d={ZONE_PATH[id]}
            fill={fills[id]}
            active={isZoneFocused(id, focus)}
            gradId={`graft-${uid}`}
          />
        ))}

        {/* Densidade — unidades foliculares */}
        {(Object.keys(follicles) as ReceptorZoneId[]).map((id) => {
          const level = fills[id];
          if (level <= 0.02) return null;
          const pts = follicles[id];
          const n = Math.max(1, Math.round(pts.length * level));
          return (
            <g
              key={id}
              stroke="#17130f"
              strokeLinecap="round"
              opacity={0.5 + level * 0.45}
            >
              {pts.slice(0, n).map((f, i) => (
                <line
                  key={i}
                  x1={f.x}
                  y1={f.y}
                  x2={f.x + Math.sin(f.a) * f.len * (0.7 + level * 0.4)}
                  y2={f.y - Math.cos(f.a) * f.len * (0.7 + level * 0.4)}
                  strokeWidth={1.1 + (i % 2) * 0.25}
                  style={{
                    transition: "opacity 400ms ease",
                  }}
                />
              ))}
            </g>
          );
        })}
      </g>

      {/* Contorno do couro */}
      <path
        d={SCALP_OUTLINE}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.6"
      />

      {/* Sugestão de orelhas */}
      <path
        d="M72 200 C58 210 54 235 62 255 C72 248 78 230 78 212 Z"
        fill="#1a1620"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
      <path
        d="M328 200 C342 210 346 235 338 255 C328 248 322 230 322 212 Z"
        fill="#1a1620"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Linha anterior M — ganha peso com o plano */}
      <path
        d="M118 132 C148 108 170 118 200 112 C230 118 252 108 282 132"
        fill="none"
        stroke="#b6a46e"
        strokeWidth={1.4 + fills.frontal * 2}
        strokeLinecap="round"
        opacity={0.2 + fills.frontal * 0.75}
      />

      {/* Setas doadora → receptora (aparecem no início do plano) */}
      <g
        fill="none"
        stroke="#b6a46e"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.15 + Math.min(fill, 0.35) * 0.9}
      >
        <path d="M145 320 C150 280 155 240 160 200" markerEnd="" />
        <path d="M255 320 C250 280 245 240 240 200" />
        <polygon points="158,196 164,208 152,206" fill="#b6a46e" stroke="none" />
        <polygon points="242,196 248,206 236,208" fill="#b6a46e" stroke="none" />
      </g>

      {/* Labels de zona */}
      {(Object.keys(ZONE_LABEL) as ReceptorZoneId[]).map((id) => {
        const level = fills[id];
        const lab = ZONE_LABEL[id];
        const active = isZoneFocused(id, focus);
        const show = level > 0.08 || active || fill < 0.02;
        if (!show && fill > 0.02) return null;
        return (
          <text
            key={id}
            x={lab.x}
            y={lab.y}
            textAnchor="middle"
            fill={
              active
                ? "rgba(226,211,160,0.95)"
                : level > 0.2
                  ? "rgba(182,164,110,0.75)"
                  : "rgba(255,255,255,0.28)"
            }
            fontSize={id === "templeL" || id === "templeR" ? 12 : 9}
            letterSpacing="0.16em"
            style={{
              fontFamily: "var(--font-poppins), system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            {lab.t}
          </text>
        );
      })}

      {/* Orientação */}
      <text
        x="200"
        y="36"
        textAnchor="middle"
        fill="rgba(182,164,110,0.75)"
        fontSize="10"
        letterSpacing="0.32em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        FRENTE
      </text>
      <text
        x="200"
        y="488"
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize="10"
        letterSpacing="0.32em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        NUCA · DOADORA
      </text>
    </svg>
  );
}

const SCALP_OUTLINE =
  "M200 52 C275 52 330 108 338 182 C346 248 336 318 310 372 C280 430 242 452 200 456 C158 452 120 430 90 372 C64 318 54 248 62 182 C70 108 125 52 200 52 Z";

/** Ferradura: outer scalp minus inner receptor oval (evenodd). */
const DONOR_PATH = `${SCALP_OUTLINE}
  M200 145
  C250 145 285 175 292 230
  C298 285 278 335 240 360
  C220 372 180 372 160 360
  C122 335 102 285 108 230
  C115 175 150 145 200 145 Z`;

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
      fill={empty ? "rgba(220,200,160,0.05)" : `url(#${gradId})`}
      fillOpacity={empty ? 1 : 0.1 + fill * 0.78}
      stroke={
        active
          ? "rgba(226,211,160,0.95)"
          : empty
            ? "rgba(255,255,255,0.12)"
            : "rgba(182,164,110,0.4)"
      }
      strokeWidth={active ? 2 : 1.1}
      strokeDasharray={empty ? "3 3" : undefined}
      style={{
        transition:
          "fill-opacity 480ms cubic-bezier(0.22,1,0.36,1), stroke 280ms ease, stroke-width 280ms ease",
      }}
    />
  );
}

function makeDonorHair(): Follicle[] {
  const pts: Follicle[] = [];
  // Laterais
  for (let i = 0; i < 55; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = (Math.floor(i / 2) / 27) * Math.PI * 0.85 + 0.2;
    const r = 118 + (i % 4) * 9;
    const x = 200 + side * Math.sin(t) * r;
    const y = 210 + Math.cos(t) * r * 0.85;
    // só na faixa doadora (fora do miolo)
    if (Math.hypot((x - 200) / 90, (y - 240) / 110) < 0.85) continue;
    pts.push({
      x,
      y,
      a: side * 0.7 + (i % 5) * 0.08,
      len: 4 + (i % 4),
    });
  }
  // Nuca
  for (let i = 0; i < 40; i += 1) {
    const x = 130 + (i % 10) * 14 + (i % 3) * 2;
    const y = 355 + Math.floor(i / 10) * 14 + (i % 2) * 3;
    pts.push({ x, y, a: (i % 7) * 0.1 - 0.3, len: 3.5 + (i % 3) });
  }
  return pts;
}
