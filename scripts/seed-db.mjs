import { prisma } from "@/lib/db";
import { seedDatabase } from "../prisma/seed";

seedDatabase(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
