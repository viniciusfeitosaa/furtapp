export type UserRole = "ADMIN" | "ASSISTENTE" | "PACIENTE";

export type SessionUser = {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
};

export const ADMIN_ROLES: UserRole[] = ["ADMIN", "ASSISTENTE"];

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function homePathForRole(role: UserRole): string {
  return isAdminRole(role) ? "/admin" : "/paciente";
}
