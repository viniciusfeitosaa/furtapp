"use client";

import { useId, useMemo } from "react";
import {
  type PlanZoneId,
  zoneFills,
} from "@/lib/planningMap";

type Props = {
  /** 0..1 */
  fill: number;
  focus?: PlanZoneId | "idle";
  className?: string;
};

/** Pontos de densidade por zona (coords no viewBox 0..400 × 0..480). */
const STIPPLE: Record<Exclude<PlanZoneId, "donor">, [number, number][]> = {
  templeL: [
    [118, 148],
    [108, 162],
    [128, 158],
    [112, 178],
    [132, 172],
    [102, 190],
    [122, 188],
    [138, 182],
    [114, 202],
    [130, 198],
    [98, 208],
    [124, 214],
  ],
  templeR: [
    [282, 148],
    [292, 162],
    [272, 158],
    [288, 178],
    [268, 172],
    [298, 190],
    [278, 188],
    [262, 182],
    [286, 202],
    [270, 198],
    [302, 208],
    [276, 214],
  ],
  frontal: [
    [160, 118],
    [180, 112],
    [200, 108],
    [220, 112],
    [240, 118],
    [150, 132],
    [170, 126],
    [190, 122],
    [210, 122],
    [230, 126],
    [250, 132],
    [165, 142],
    [185, 138],
    [205, 136],
    [225, 138],
    [245, 142],
    [175, 152],
    [200, 148],
    [225, 152],
    [190, 158],
    [210, 158],
  ],
  mid: [
    [155, 188],
    [175, 182],
    [200, 178],
    [225, 182],
    [245, 188],
    [150, 208],
    [170, 200],
    [200, 196],
    [230, 200],
    [250, 208],
    [158, 224],
    [180, 218],
    [200, 214],
    [220, 218],
    [242, 224],
    [170, 238],
    [200, 232],
    [230, 238],
    [185, 250],
    [215, 250],
  ],
  crown: [
    [175, 268],
    [200, 262],
    [225, 268],
    [165, 285],
    [190, 278],
    [210, 278],
    [235, 285],
    [180, 298],
    [200, 292],
    [220, 298],
    [190, 312],
    [210, 312],
    [200, 325],
  ],
};

export function ScalpMapSvg({ fill, focus = "idle", className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const fills = useMemo(() => zoneFills(fill), [fill]);

  return (
    <svg
      viewBox="0 0 400 480"
      className={className}
      role="img"
      aria-label="Mapa de planejamento do couro cabeludo visto de cima"
    >
      <defs>
        <radialGradient id={`skin-${uid}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#2a2430" />
          <stop offset="55%" stopColor="#1a1620" />
          <stop offset="100%" stopColor="#0e0c12" />
        </radialGradient>
        <linearGradient id={`donor-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8a7a4a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5a4e2e" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`graft-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4c48a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#b6a46e" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Mesa / fundo do mapa */}
      <rect width="400" height="480" fill="#060810" />
      <g opacity="0.12" stroke="#b6a46e" strokeWidth="0.6">
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={40 + i * 40}
            y1={36}
            x2={40 + i * 40}
            y2={444}
          />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={40}
            y1={36 + i * 40}
            x2={360}
            y2={36 + i * 40}
          />
        ))}
      </g>

      {/* Silhueta do couro */}
      <path
        d="M200 56
           C268 56 318 110 328 178
           C336 240 328 300 308 348
           C286 402 248 430 200 434
           C152 430 114 402 92 348
           C72 300 64 240 72 178
           C82 110 132 56 200 56 Z"
        fill={`url(#skin-${uid})`}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
      />

      {/* Área doadora — ferradura (laterais + nuca) */}
      <path
        d="M78 195
           C70 250 78 310 105 358
           C130 402 165 424 200 428
           C235 424 270 402 295 358
           C322 310 330 250 322 195
           L298 205
           C302 248 296 298 276 332
           C255 368 228 386 200 388
           C172 386 145 368 124 332
           C104 298 98 248 102 205
           Z"
        fill={`url(#donor-${uid})`}
        opacity={0.92}
      />
      {/* Textura residual na doadora */}
      <g opacity="0.35" fill="#1a1610">
        {donorStipple().map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.1} />
        ))}
      </g>

      {/* Zonas receptoras */}
      <ZonePath
        d="M92 140 C88 168 96 198 118 220 C132 200 138 178 136 152 C128 138 110 132 92 140 Z"
        fill={fills.templeL}
        active={focus === "templeL"}
        gradId={`graft-${uid}`}
      />
      <ZonePath
        d="M308 140 C312 168 304 198 282 220 C268 200 262 178 264 152 C272 138 290 132 308 140 Z"
        fill={fills.templeR}
        active={focus === "templeR"}
        gradId={`graft-${uid}`}
      />
      <ZonePath
        d="M128 100 C160 78 240 78 272 100 C278 120 270 148 248 158 C220 148 180 148 152 158 C130 148 122 120 128 100 Z"
        fill={fills.frontal}
        active={focus === "frontal"}
        gradId={`graft-${uid}`}
      />
      <ZonePath
        d="M130 168 C160 158 240 158 270 168 C278 198 274 238 250 258 C220 248 180 248 150 258 C126 238 122 198 130 168 Z"
        fill={fills.mid}
        active={focus === "mid"}
        gradId={`graft-${uid}`}
      />
      <ZonePath
        d="M155 268 C180 255 220 255 245 268 C258 290 252 320 230 340 C210 332 190 332 170 340 C148 320 142 290 155 268 Z"
        fill={fills.crown}
        active={focus === "crown"}
        gradId={`graft-${uid}`}
      />

      {/* Linha anterior — traço ouro que ganha presença com o plano */}
      <path
        d="M132 128 C168 108 232 108 268 128"
        fill="none"
        stroke="#b6a46e"
        strokeWidth={1.2 + fills.frontal * 1.6}
        strokeLinecap="round"
        opacity={0.25 + fills.frontal * 0.65}
      />

      {/* Stipple de densidade nas receptoras */}
      {(Object.keys(STIPPLE) as Exclude<PlanZoneId, "donor">[]).map((id) => {
        const level = fills[id];
        if (level <= 0.02) return null;
        const pts = STIPPLE[id];
        const n = Math.round(pts.length * level);
        return (
          <g key={id} fill="#1c1812" opacity={0.45 + level * 0.4}>
            {pts.slice(0, n).map(([x, y], i) => (
              <circle
                key={i}
                cx={x + ((i * 17) % 5) - 2}
                cy={y + ((i * 13) % 5) - 2}
                r={1.15 + (i % 3) * 0.25}
              />
            ))}
          </g>
        );
      })}

      {/* Rótulos de orientação */}
      <text
        x="200"
        y="48"
        textAnchor="middle"
        fill="rgba(182,164,110,0.7)"
        fontSize="11"
        letterSpacing="0.28em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        FRENTE
      </text>
      <text
        x="200"
        y="462"
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize="11"
        letterSpacing="0.28em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        NUCA
      </text>
      <text
        x="200"
        y="390"
        textAnchor="middle"
        fill="rgba(182,164,110,0.55)"
        fontSize="10"
        letterSpacing="0.18em"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        DOADORA
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
      fill={empty ? "rgba(210,190,150,0.06)" : `url(#${gradId})`}
      fillOpacity={empty ? 1 : 0.12 + fill * 0.72}
      stroke={
        active
          ? "rgba(182,164,110,0.85)"
          : empty
            ? "rgba(255,255,255,0.1)"
            : "rgba(182,164,110,0.35)"
      }
      strokeWidth={active ? 1.8 : 1}
      style={{
        transition:
          "fill-opacity 420ms cubic-bezier(0.22,1,0.36,1), stroke 320ms ease",
      }}
    />
  );
}

function donorStipple(): [number, number][] {
  const pts: [number, number][] = [];
  for (let a = 0; a < 28; a += 1) {
    const t = a / 27;
    const ang = Math.PI * 0.15 + t * Math.PI * 0.7;
    const r = 118 + (a % 3) * 10;
    pts.push([200 + Math.cos(ang) * r * 0.95, 300 + Math.sin(ang) * r * 0.55]);
    pts.push([
      200 - Math.cos(ang) * r * 0.95,
      300 + Math.sin(ang) * r * 0.55,
    ]);
  }
  for (let i = 0; i < 18; i += 1) {
    pts.push([140 + (i % 6) * 24, 340 + Math.floor(i / 6) * 16]);
  }
  return pts;
}
