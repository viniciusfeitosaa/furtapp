export const SESSION_COOKIE = "furtapp_session";

export function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ??
    "dev-secret-change-in-production-min-32-chars!!";
  return new TextEncoder().encode(secret);
}
