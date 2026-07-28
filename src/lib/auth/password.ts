import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Use letras maiúsculas, minúsculas e números.";
  }
  return null;
}
