import { PrismaClient } from "@prisma/client";
import { CHECKPOINTS } from "@/lib/site";
import { checkpointWindow } from "@/lib/checkpoints";

export async function ensureCheckpointsForPatient(
  prisma: PrismaClient,
  patientId: string,
  surgeryDate: Date,
) {
  for (const code of CHECKPOINTS) {
    const { windowStart, windowEnd } = checkpointWindow(surgeryDate, code);
    await prisma.checkpoint.upsert({
      where: { patientId_code: { patientId, code } },
      create: {
        patientId,
        code,
        status: code === "M0" ? "COMPLETED" : "PENDING",
        windowStart,
        windowEnd,
      },
      update: { windowStart, windowEnd },
    });
  }
}
