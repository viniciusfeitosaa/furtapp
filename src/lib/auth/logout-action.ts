"use server";

import { redirect } from "next/navigation";
import { destroySession, getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "LOGOUT",
      },
    });
  }
  await destroySession();
  redirect("/login");
}
