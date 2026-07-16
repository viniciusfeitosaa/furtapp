import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

export type ScalpTextures = {
  albedo: CanvasTexture;
  roughness: CanvasTexture;
  normal: CanvasTexture;
  donorShadow: CanvasTexture;
  surgical: CanvasTexture;
};

function makeCanvas(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx, size };
}

function toTexture(canvas: HTMLCanvasElement, srgb: boolean) {
  const tex = new CanvasTexture(canvas);
  if (srgb) tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Texturas procedurais leves (sem assets externos de 50MB):
 * albedo, roughness, normal, sombra de área doadora, pontilhado cirúrgico.
 */
export function createScalpTextures(): ScalpTextures {
  const alb = makeCanvas(512);
  const g = alb.ctx.createRadialGradient(256, 200, 40, 256, 240, 320);
  g.addColorStop(0, "#e8c4b0");
  g.addColorStop(0.45, "#d4a890");
  g.addColorStop(0.75, "#c4977e");
  g.addColorStop(1, "#a87b66");
  alb.ctx.fillStyle = g;
  alb.ctx.fillRect(0, 0, 512, 512);
  const noise = alb.ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < noise.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    noise.data[i] = Math.min(255, Math.max(0, noise.data[i]! + n));
    noise.data[i + 1] = Math.min(255, Math.max(0, noise.data[i + 1]! + n));
    noise.data[i + 2] = Math.min(255, Math.max(0, noise.data[i + 2]! + n));
  }
  alb.ctx.putImageData(noise, 0, 0);

  const rough = makeCanvas(512);
  rough.ctx.fillStyle = "#b0b0b0";
  rough.ctx.fillRect(0, 0, 512, 512);
  const oily = rough.ctx.createRadialGradient(256, 220, 20, 256, 230, 140);
  oily.addColorStop(0, "#4a4a4a");
  oily.addColorStop(1, "#b0b0b0");
  rough.ctx.fillStyle = oily;
  rough.ctx.fillRect(0, 0, 512, 512);

  const norm = makeCanvas(512);
  const nImg = norm.ctx.createImageData(512, 512);
  for (let i = 0; i < nImg.data.length; i += 4) {
    nImg.data[i] = 128 + (Math.random() - 0.5) * 18;
    nImg.data[i + 1] = 128 + (Math.random() - 0.5) * 18;
    nImg.data[i + 2] = 255;
    nImg.data[i + 3] = 255;
  }
  norm.ctx.putImageData(nImg, 0, 0);

  const donor = makeCanvas(512);
  donor.ctx.fillStyle = "#000000";
  donor.ctx.fillRect(0, 0, 512, 512);
  const donorGrad = donor.ctx.createLinearGradient(0, 0, 0, 512);
  donorGrad.addColorStop(0, "rgba(0,0,0,0)");
  donorGrad.addColorStop(0.28, "rgba(0,0,0,0)");
  donorGrad.addColorStop(0.42, "rgba(30,30,30,0.35)");
  donorGrad.addColorStop(0.55, "rgba(20,20,20,0.75)");
  donorGrad.addColorStop(0.75, "rgba(15,15,15,0.9)");
  donorGrad.addColorStop(1, "rgba(10,10,10,0.95)");
  donor.ctx.fillStyle = donorGrad;
  donor.ctx.fillRect(0, 0, 512, 512);
  const sideL = donor.ctx.createLinearGradient(0, 0, 180, 0);
  sideL.addColorStop(0, "rgba(0,0,0,0.85)");
  sideL.addColorStop(1, "rgba(0,0,0,0)");
  donor.ctx.fillStyle = sideL;
  donor.ctx.fillRect(0, 180, 180, 332);
  const sideR = donor.ctx.createLinearGradient(512, 0, 332, 0);
  sideR.addColorStop(0, "rgba(0,0,0,0.85)");
  sideR.addColorStop(1, "rgba(0,0,0,0)");
  donor.ctx.fillStyle = sideR;
  donor.ctx.fillRect(332, 180, 180, 332);
  donor.ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < 4000; i += 1) {
    donor.ctx.fillRect(Math.random() * 512, 200 + Math.random() * 312, 1, 1);
  }

  const surg = makeCanvas(512);
  surg.ctx.clearRect(0, 0, 512, 512);
  surg.ctx.fillStyle = "rgba(180, 40, 40, 0.85)";
  for (let i = 0; i < 2800; i += 1) {
    const x = 80 + Math.random() * 352;
    const y = 20 + Math.random() * 180;
    const r = 0.6 + Math.random() * 1.1;
    surg.ctx.beginPath();
    surg.ctx.arc(x, y, r, 0, Math.PI * 2);
    surg.ctx.fill();
  }
  surg.ctx.strokeStyle = "rgba(200, 60, 60, 0.7)";
  surg.ctx.lineWidth = 1.2;
  surg.ctx.setLineDash([2, 4]);
  surg.ctx.beginPath();
  surg.ctx.moveTo(120, 150);
  surg.ctx.quadraticCurveTo(256, 175, 392, 150);
  surg.ctx.stroke();

  return {
    albedo: toTexture(alb.canvas, true),
    roughness: toTexture(rough.canvas, false),
    normal: toTexture(norm.canvas, false),
    donorShadow: toTexture(donor.canvas, false),
    surgical: toTexture(surg.canvas, true),
  };
}

export function disposeScalpTextures(t: ScalpTextures) {
  t.albedo.dispose();
  t.roughness.dispose();
  t.normal.dispose();
  t.donorShadow.dispose();
  t.surgical.dispose();
}
