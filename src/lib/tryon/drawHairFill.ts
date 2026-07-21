import {
  CHIN_INDEX,
  FOREHEAD_TOP_INDEX,
  HAIRLINE_INDICES,
  type Landmark,
  pointOnVideo,
} from "@/lib/tryon/landmarks";

type Pt = { x: number; y: number };

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Desenha preenchimento ilustrativo de densidade na zona frontal/vértex
 * a partir da malha facial (extrapolando um “capacete” acima da linha).
 * `density` em 0..1.
 */
export function drawHairFill(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  density: number,
  mirrored = true,
) {
  if (!landmarks.length || density <= 0.01) return;

  const chin = landmarks[CHIN_INDEX];
  const brow = landmarks[FOREHEAD_TOP_INDEX];
  if (!chin || !brow) return;

  const chinP = pointOnVideo(chin, width, height, mirrored);
  const browP = pointOnVideo(brow, width, height, mirrored);
  const upX = browP.x - chinP.x;
  const upY = browP.y - chinP.y;
  const faceLen = Math.hypot(upX, upY) || 1;
  const ux = upX / faceLen;
  const uy = upY / faceLen;

  const hairline: Pt[] = [];
  for (const idx of HAIRLINE_INDICES) {
    const lm = landmarks[idx];
    if (!lm) continue;
    hairline.push(pointOnVideo(lm, width, height, mirrored));
  }
  if (hairline.length < 4) return;

  const extend = faceLen * (0.28 + density * 0.42);
  const scalp: Pt[] = hairline.map((p) => ({
    x: p.x + ux * extend,
    y: p.y + uy * extend,
  }));

  // Máscara suave da zona
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(hairline[0].x, hairline[0].y);
  for (let i = 1; i < hairline.length; i += 1) {
    ctx.lineTo(hairline[i].x, hairline[i].y);
  }
  for (let i = scalp.length - 1; i >= 0; i -= 1) {
    ctx.lineTo(scalp[i].x, scalp[i].y);
  }
  ctx.closePath();
  ctx.clip();

  const midX = (browP.x + chinP.x) * 0.5 + ux * extend * 0.35;
  const midY = browP.y + uy * extend * 0.55;
  const grad = ctx.createRadialGradient(
    midX,
    midY,
    faceLen * 0.05,
    midX,
    midY,
    faceLen * (0.55 + density * 0.35),
  );
  const a0 = 0.12 + density * 0.28;
  const a1 = 0.04 + density * 0.12;
  grad.addColorStop(0, `rgba(182, 164, 110, ${a0})`);
  grad.addColorStop(0.55, `rgba(90, 78, 46, ${a1})`);
  grad.addColorStop(1, "rgba(14, 12, 18, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Fios ilustrativos (seed estável por posição facial)
  const seed =
    Math.round(browP.x * 10) * 1000 + Math.round(browP.y * 10) + Math.round(density * 20);
  const rand = mulberry32(seed);
  const count = Math.floor(40 + density * 220);

  for (let i = 0; i < count; i += 1) {
    const t = rand();
    const u = rand();
    // amostra ao longo da hairline + altura
    const hi = Math.floor(t * (hairline.length - 1));
    const base = hairline[hi];
    const tip = scalp[hi];
    if (!base || !tip) continue;
    const along = 0.15 + u * 0.85;
    const x = base.x + (tip.x - base.x) * along + (rand() - 0.5) * faceLen * 0.08;
    const y = base.y + (tip.y - base.y) * along + (rand() - 0.5) * faceLen * 0.06;
    const len = faceLen * (0.02 + density * 0.045) * (0.6 + rand());
    const ang = Math.atan2(uy, ux) + (rand() - 0.5) * 0.7;

    ctx.strokeStyle = `rgba(212, 196, 138, ${0.15 + density * 0.45})`;
    ctx.lineWidth = 0.8 + density * 1.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }

  ctx.restore();

  // Contorno sutil da linha
  ctx.save();
  ctx.strokeStyle = `rgba(182, 164, 110, ${0.2 + density * 0.35})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hairline[0].x, hairline[0].y);
  for (let i = 1; i < hairline.length; i += 1) {
    ctx.lineTo(hairline[i].x, hairline[i].y);
  }
  ctx.stroke();
  ctx.restore();
}
