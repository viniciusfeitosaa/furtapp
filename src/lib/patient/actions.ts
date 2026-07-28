"use server";

import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { PHOTO_REGIONS } from "@/lib/site";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadState = { error?: string; success?: string };

export async function uploadCheckpointPhotoAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const session = await requirePatient();
  const checkpointId = String(formData.get("checkpointId") ?? "");
  const region = String(formData.get("region") ?? "");

  if (!checkpointId || !region) {
    return { error: "Checkpoint ou região inválidos." };
  }

  const validRegion = PHOTO_REGIONS.some((r) => r.id === region);
  if (!validRegion) return { error: "Região fotográfica inválida." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Imagem muito grande (máx. 8 MB)." };
  }
  if (!ALLOWED.has(file.type)) {
    return { error: "Formato não permitido. Use JPG, PNG ou WebP." };
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.userId },
    include: {
      checkpoints: {
        where: { id: checkpointId },
      },
    },
  });

  const checkpoint = profile?.checkpoints[0];
  if (!checkpoint) return { error: "Checkpoint não encontrado." };
  if (checkpoint.status !== "OPEN" && checkpoint.status !== "LATE") {
    return { error: "Este checkpoint não está aberto para envio." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const dir = path.join(UPLOAD_ROOT, profile!.id, checkpointId);
  await mkdir(dir, { recursive: true });
  const storageKey = `${region}.${ext}`;
  const fullPath = path.join(dir, storageKey);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  await prisma.photo.upsert({
    where: {
      checkpointId_region: { checkpointId, region },
    },
    create: {
      checkpointId,
      region,
      storageKey: path.join(profile!.id, checkpointId, storageKey),
      mimeType: file.type,
    },
    update: {
      storageKey: path.join(profile!.id, checkpointId, storageKey),
      mimeType: file.type,
      uploadedAt: new Date(),
    },
  });

  const photoCount = await prisma.photo.count({ where: { checkpointId } });
  if (photoCount >= PHOTO_REGIONS.length) {
    await prisma.checkpoint.update({
      where: { id: checkpointId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  }

  revalidatePath("/paciente");
  revalidatePath("/admin");

  return {
    success:
      photoCount >= PHOTO_REGIONS.length
        ? "Todas as 5 regiões enviadas! Aguarde a análise do Dr."
        : `Foto de ${region} enviada (${photoCount}/5).`,
  };
}
