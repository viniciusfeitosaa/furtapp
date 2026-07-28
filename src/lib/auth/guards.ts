import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminRole, type SessionUser } from "@/lib/auth/types";

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (!isAdminRole(session.role)) redirect("/paciente");
  return session;
}

export async function requirePatient(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "PACIENTE") redirect("/admin");
  return session;
}
