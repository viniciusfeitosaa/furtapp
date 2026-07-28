import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret, SESSION_COOKIE } from "@/lib/auth/session-constants";
import type { SessionUser, UserRole } from "@/lib/auth/types";
import { homePathForRole, isAdminRole } from "@/lib/auth/types";

async function readSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.userId;
    const email = payload.email;
    const role = payload.role as UserRole;
    const name = payload.name;
    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      (role !== "ADMIN" && role !== "ASSISTENTE" && role !== "PACIENTE")
    ) {
      return null;
    }
    return { userId, email, role, name };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/paciente/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await readSession(request);

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(
        new URL(homePathForRole(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdminRole(session.role)) {
      return NextResponse.redirect(new URL("/paciente", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/paciente")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== "PACIENTE") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/paciente/:path*",
    "/admin/login",
    "/paciente/login",
  ],
};
