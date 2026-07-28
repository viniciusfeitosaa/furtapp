"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  homePathForRole,
  isAdminRole,
  type SessionUser,
} from "@/lib/auth/types";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos." };
  }

  const session: SessionUser = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  await createSession(session);
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      meta: JSON.stringify({ role: user.role }),
    },
  });

  const callback = formData.get("callbackUrl");
  const safeCallback =
    typeof callback === "string" &&
    callback.startsWith("/") &&
    !callback.startsWith("//")
      ? callback
      : null;

  if (safeCallback) {
    if (isAdminRole(user.role) && safeCallback.startsWith("/admin")) {
      redirect(safeCallback);
    }
    if (user.role === "PACIENTE" && safeCallback.startsWith("/paciente")) {
      redirect(safeCallback);
    }
  }

  redirect(homePathForRole(user.role));
}
