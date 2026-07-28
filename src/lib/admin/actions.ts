"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  hashPassword,
  validatePasswordStrength,
} from "@/lib/auth/password";
import { ensureCheckpointsForPatient } from "@/lib/patient-setup";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

const createPatientSchema = z.object({
  name: z.string().min(2, "Nome muito curto."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8),
  phone: z.string().optional(),
  surgeryDate: z.string().min(1, "Informe a data da cirurgia."),
});

export type CreatePatientState = { error?: string; success?: string };

export async function createPatientAction(
  _prev: CreatePatientState,
  formData: FormData,
): Promise<CreatePatientState> {
  const admin = await requireAdmin();
  const parsed = createPatientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    surgeryDate: formData.get("surgeryDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const pwErr = validatePasswordStrength(parsed.data.password);
  if (pwErr) return { error: pwErr };

  const email = parsed.data.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este e-mail já está cadastrado." };

  const surgeryDate = new Date(parsed.data.surgeryDate);
  if (Number.isNaN(surgeryDate.getTime())) {
    return { error: "Data da cirurgia inválida." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.PACIENTE,
      name: parsed.data.name.trim(),
      patientProfile: {
        create: {
          phone: parsed.data.phone?.trim() || null,
          surgeryDate,
        },
      },
    },
    include: { patientProfile: true },
  });

  if (user.patientProfile) {
    await ensureCheckpointsForPatient(
      prisma,
      user.patientProfile.id,
      surgeryDate,
    );
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: "CREATE_PATIENT",
      meta: JSON.stringify({ patientEmail: email }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pacientes");
  redirect("/admin/pacientes");
}

const reviewSchema = z.object({
  checkpointId: z.string().min(1),
  privateNote: z.string().optional(),
  patientFeedback: z.string().optional(),
  densityScore: z.coerce.number().min(1).max(5).optional(),
  release: z.enum(["0", "1"]).optional(),
});

export type ReviewState = { error?: string; success?: string };

export async function saveReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    checkpointId: formData.get("checkpointId"),
    privateNote: formData.get("privateNote") || undefined,
    patientFeedback: formData.get("patientFeedback") || undefined,
    densityScore: formData.get("densityScore") || undefined,
    release: formData.get("release") || "0",
  });

  if (!parsed.success) {
    return { error: "Dados da análise inválidos." };
  }

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: parsed.data.checkpointId },
    include: { review: true },
  });
  if (!checkpoint) return { error: "Checkpoint não encontrado." };

  const release = parsed.data.release === "1";

  await prisma.clinicalReview.upsert({
    where: { checkpointId: checkpoint.id },
    create: {
      checkpointId: checkpoint.id,
      privateNote: parsed.data.privateNote ?? null,
      patientFeedback: parsed.data.patientFeedback ?? null,
      densityScore: parsed.data.densityScore ?? null,
      releasedAt: release ? new Date() : null,
    },
    update: {
      privateNote: parsed.data.privateNote ?? null,
      patientFeedback: parsed.data.patientFeedback ?? null,
      densityScore: parsed.data.densityScore ?? null,
      releasedAt: release ? new Date() : checkpoint.review?.releasedAt,
    },
  });

  await prisma.checkpoint.update({
    where: { id: checkpoint.id },
    data: {
      status: release ? "COMPLETED" : "IN_REVIEW",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: release ? "RELEASE_FEEDBACK" : "SAVE_REVIEW",
      meta: JSON.stringify({ checkpointId: checkpoint.id }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/analises");
  revalidatePath(`/admin/analise/${checkpoint.id}`);
  revalidatePath("/paciente");

  return {
    success: release
      ? "Feedback liberado para o paciente."
      : "Análise salva (rascunho).",
  };
}

export async function markInReviewAction(checkpointId: string) {
  await requireAdmin();
  await prisma.checkpoint.update({
    where: { id: checkpointId },
    data: { status: "IN_REVIEW" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/analises");
}
