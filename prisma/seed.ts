import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ensureCheckpointsForPatient } from "../src/lib/patient-setup";

export async function seedDatabase(prisma: PrismaClient) {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@ffurtado.com.br";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "Admin@Furtado2026";
  const patientEmail =
    process.env.SEED_PATIENT_EMAIL ?? "paciente@demo.com";
  const patientPassword =
    process.env.SEED_PATIENT_PASSWORD ?? "Paciente@Demo2026";

  const adminHash = await hashPassword(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    create: {
      email: adminEmail.toLowerCase(),
      passwordHash: adminHash,
      role: Role.ADMIN,
      name: "Dr. Francisco Furtado",
    },
    update: {
      passwordHash: adminHash,
      name: "Dr. Francisco Furtado",
      role: Role.ADMIN,
    },
  });

  const patientHash = await hashPassword(patientPassword);
  const patientUser = await prisma.user.upsert({
    where: { email: patientEmail.toLowerCase() },
    create: {
      email: patientEmail.toLowerCase(),
      passwordHash: patientHash,
      role: Role.PACIENTE,
      name: "Maria Silva (demo)",
    },
    update: {
      passwordHash: patientHash,
      name: "Maria Silva (demo)",
      role: Role.PACIENTE,
    },
  });

  const surgeryDate = new Date();
  surgeryDate.setMonth(surgeryDate.getMonth() - 3);

  const profile = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    create: {
      userId: patientUser.id,
      phone: "(88) 99999-0000",
      surgeryDate,
      notes: "Paciente demo para testes do portal.",
    },
    update: {
      surgeryDate,
      phone: "(88) 99999-0000",
    },
  });

  await ensureCheckpointsForPatient(prisma, profile.id, surgeryDate);

  const m3 = await prisma.checkpoint.findFirst({
    where: { patientId: profile.id, code: "M3" },
  });
  if (m3) {
    await prisma.checkpoint.update({
      where: { id: m3.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  }

  const demoPatients = [
    { name: "João Pereira", email: "joao.demo@ffurtado.com.br", monthsAgo: 6 },
    { name: "Ana Costa", email: "ana.demo@ffurtado.com.br", monthsAgo: 9 },
  ];

  for (const demo of demoPatients) {
    const hash = await hashPassword("Demo@Paciente1");
    const u = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        passwordHash: hash,
        role: Role.PACIENTE,
        name: demo.name,
      },
      update: { name: demo.name },
    });
    const sd = new Date();
    sd.setMonth(sd.getMonth() - demo.monthsAgo);
    const p = await prisma.patientProfile.upsert({
      where: { userId: u.id },
      create: { userId: u.id, surgeryDate: sd },
      update: { surgeryDate: sd },
    });
    await ensureCheckpointsForPatient(prisma, p.id, sd);
  }

  console.log("Seed OK — admin:", admin.email, "| paciente demo:", patientUser.email);
}

const prisma = new PrismaClient();
seedDatabase(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
