import {
  CHIN_INDEX,
  FOREHEAD_TOP_INDEX,
  HAIRLINE_INDICES,
  type Landmark,
  pointOnVideo,
} from "@/lib/tryon/landmarks";
import { getWigStyle, type WigStyle, type WigStyleId } from "@/lib/tryon/wigStyles";

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
 * Desenha uma peruca 2D ancorada na malha facial.
 * `opacity` 0..1 = intensidade da peruca.
 */
export function drawWig(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  styleId: WigStyleId,
  opacity: number,
  mirrored = false,
) {
  if (!landmarks.length || opacity <= 0.02) return;
  const style = getWigStyle(styleId);
  const chin = landmarks[CHIN_INDEX];
  const brow = landmarks[FOREHEAD_TOP_INDEX];
  if (!chin || !brow) return;

  const chinP = pointOnVideo(chin, width, height, mirrored);
  const browP = pointOnVideo(brow, width, height, mirrored);
  const faceLen = Math.hypot(browP.x - chinP.x, browP.y - chinP.y) || 1;
  const ux = (browP.x - chinP.x) / faceLen;
  const uy = (browP.y - chinP.y) / faceLen;
  const rx = -uy;
  const ry = ux;

  // Linha anterior (base da peruca), com franja opcional descendo
  const hairline: Pt[] = [];
  for (const idx of HAIRLINE_INDICES) {
    const lm = landmarks[idx];
    if (!lm) continue;
    const p = pointOnVideo(lm, width, height, mirrored);
    hairline.push({
      x: p.x - ux * faceLen * style.bangs,
      y: p.y - uy * faceLen * style.bangs,
    });
  }
  if (hairline.length < 5) return;

  const left = hairline[0]!;
  const right = hairline[hairline.length - 1]!;
  const mid = hairline[Math.floor(hairline.length / 2)]!;

  const crown = {
    x: browP.x + ux * faceLen * style.crown + rx * faceLen * style.part * 0.2,
    y: browP.y + uy * faceLen * style.crown + ry * faceLen * style.part * 0.2,
  };

  // Laterais da peruca (caem em direção às orelhas / maxilar)
  const leftLobe = {
    x: left.x - rx * faceLen * (0.12 + style.flare) - ux * faceLen * 0.02,
    y: left.y - ry * faceLen * (0.12 + style.flare) - uy * faceLen * 0.02,
  };
  const rightLobe = {
    x: right.x + rx * faceLen * (0.12 + style.flare) - ux * faceLen * 0.02,
    y: right.y + ry * faceLen * (0.12 + style.flare) - uy * faceLen * 0.02,
  };
  const leftTip = {
    x: leftLobe.x - ux * faceLen * style.sideDrop * 0.15 - rx * faceLen * 0.04,
    y:
      leftLobe.y +
      (-uy * faceLen * style.sideDrop) +
      (-ry * faceLen * 0.02),
  };
  const rightTip = {
    x: rightLobe.x - ux * faceLen * style.sideDrop * 0.15 + rx * faceLen * 0.04,
    y:
      rightLobe.y +
      (-uy * faceLen * style.sideDrop) +
      (ry * faceLen * 0.02),
  };

  // Ajuste: down = direção do queixo
  leftTip.x = leftLobe.x - ux * faceLen * style.sideDrop * 0.05 - rx * faceLen * 0.06;
  leftTip.y = leftLobe.y - uy * faceLen * style.sideDrop;
  rightTip.x = rightLobe.x - ux * faceLen * style.sideDrop * 0.05 + rx * faceLen * 0.06;
  rightTip.y = rightLobe.y - uy * faceLen * style.sideDrop;

  const leftCrown = {
    x: lerp(leftLobe.x, crown.x, 0.45) - rx * faceLen * 0.1,
    y: lerp(leftLobe.y, crown.y, 0.55),
  };
  const rightCrown = {
    x: lerp(rightLobe.x, crown.x, 0.45) + rx * faceLen * 0.1,
    y: lerp(rightLobe.y, crown.y, 0.55),
  };

  ctx.save();
  ctx.globalAlpha = 0.62 + opacity * 0.38;

  // Path: hairline → lado dir → arco superior → lado esq
  ctx.beginPath();
  ctx.moveTo(hairline[0]!.x, hairline[0]!.y);
  for (let i = 1; i < hairline.length; i += 1) {
    ctx.lineTo(hairline[i]!.x, hairline[i]!.y);
  }
  ctx.quadraticCurveTo(rightLobe.x, rightLobe.y, rightTip.x, rightTip.y);
  ctx.quadraticCurveTo(rightCrown.x, rightCrown.y, crown.x, crown.y);
  ctx.quadraticCurveTo(leftCrown.x, leftCrown.y, leftTip.x, leftTip.y);
  ctx.quadraticCurveTo(leftLobe.x, leftLobe.y, hairline[0]!.x, hairline[0]!.y);
  ctx.closePath();

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = faceLen * 0.1;
  ctx.fillStyle = style.color.base;
  ctx.fill();
  ctx.restore();

  const grad = ctx.createRadialGradient(
    crown.x,
    crown.y,
    faceLen * 0.04,
    mid.x,
    mid.y,
    faceLen * (0.75 + style.crown * 0.4),
  );
  grad.addColorStop(0, hexAlpha(style.color.hi, 0.95));
  grad.addColorStop(0.4, hexAlpha(style.color.mid, 1));
  grad.addColorStop(1, hexAlpha(style.color.base, 1));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.clip();
  paintStrands(ctx, style, hairline, crown, faceLen, ux, uy, rx, ry, opacity);

  if (style.bangs > 0.08) {
    paintBangs(ctx, style, hairline, faceLen, ux, uy, rx, opacity);
  }

  ctx.restore();
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function paintStrands(
  ctx: CanvasRenderingContext2D,
  style: WigStyle,
  hairline: Pt[],
  crown: Pt,
  faceLen: number,
  ux: number,
  uy: number,
  rx: number,
  ry: number,
  opacity: number,
) {
  const rand = mulberry32(
    Math.round(crown.x * 3) * 1009 + Math.round(crown.y * 3) * 17 + style.wave * 100,
  );
  const n = Math.floor(120 + opacity * 180 + style.wave * 100);

  for (let i = 0; i < n; i += 1) {
    const hi = Math.floor(rand() * (hairline.length - 1));
    const base = hairline[hi]!;
    const along = 0.12 + rand() * 0.88;
    const sway = (rand() - 0.5) * style.wave * faceLen * 0.18;
    const x0 = base.x + (crown.x - base.x) * along + rx * sway;
    const y0 = base.y + (crown.y - base.y) * along + ry * sway;
    const len = faceLen * (0.035 + style.wave * 0.07 + rand() * 0.04);
    const ang = Math.atan2(uy, ux) + style.part * 0.4 + (rand() - 0.5) * (0.55 + style.wave);

    ctx.strokeStyle =
      rand() > 0.5
        ? `rgba(70, 56, 40, ${0.2 + opacity * 0.28})`
        : `rgba(20, 16, 12, ${0.22 + opacity * 0.3})`;
    ctx.lineWidth = 0.8 + rand() * 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    if (style.wave > 0.45) {
      const cpx = x0 + Math.cos(ang) * len * 0.5 + rx * faceLen * 0.04 * Math.sin(i * 0.7);
      const cpy = y0 + Math.sin(ang) * len * 0.5;
      ctx.quadraticCurveTo(cpx, cpy, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
    } else {
      ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
    }
    ctx.stroke();
  }
}

function paintBangs(
  ctx: CanvasRenderingContext2D,
  style: WigStyle,
  hairline: Pt[],
  faceLen: number,
  ux: number,
  uy: number,
  rx: number,
  opacity: number,
) {
  const left = hairline[Math.floor(hairline.length * 0.2)]!;
  const mid = hairline[Math.floor(hairline.length * 0.5)]!;
  const right = hairline[Math.floor(hairline.length * 0.8)]!;
  const tip = {
    x: mid.x - ux * faceLen * style.bangs * 1.2 + rx * faceLen * style.part * 0.08,
    y: mid.y - uy * faceLen * style.bangs * 1.2,
  };

  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.quadraticCurveTo(mid.x, mid.y - uy * faceLen * 0.03, right.x, right.y);
  ctx.quadraticCurveTo(tip.x + rx * faceLen * 0.12, tip.y, tip.x, tip.y);
  ctx.quadraticCurveTo(tip.x - rx * faceLen * 0.12, tip.y, left.x, left.y);
  ctx.closePath();

  const g = ctx.createLinearGradient(mid.x, mid.y, tip.x, tip.y);
  g.addColorStop(0, style.color.mid);
  g.addColorStop(1, style.color.base);
  ctx.globalAlpha = 0.55 + opacity * 0.4;
  ctx.fillStyle = g;
  ctx.fill();
}

/** Compat: antigo preenchimento vira peruca clássica. */
export function drawHairFill(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  density: number,
  mirrored = true,
) {
  drawWig(ctx, landmarks, width, height, "classico", density, mirrored);
}
