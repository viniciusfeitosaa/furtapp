import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE } from "@/lib/auth/session-constants";
import type { SessionUser } from "@/lib/auth/types";

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getAuthSecret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.userId;
    const email = payload.email;
    const role = payload.role;
    const name = payload.name;
    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      typeof name !== "string"
    ) {
      return null;
    }
    if (role !== "ADMIN" && role !== "ASSISTENTE" && role !== "PACIENTE") {
      return null;
    }
    return { userId, email, role, name };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
