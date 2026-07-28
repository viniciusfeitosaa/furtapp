import { describe, expect, it } from "vitest";
import {
  checkpointStatusForDate,
  checkpointWindow,
  daysUntil,
} from "@/lib/checkpoints";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { homePathForRole, isAdminRole } from "@/lib/auth/types";

describe("auth roles", () => {
  it("identifica perfis administrativos", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("ASSISTENTE")).toBe(true);
    expect(isAdminRole("PACIENTE")).toBe(false);
  });

  it("redireciona para o painel correto", () => {
    expect(homePathForRole("ADMIN")).toBe("/admin");
    expect(homePathForRole("PACIENTE")).toBe("/paciente");
  });
});

describe("password security", () => {
  it("rejeita senhas fracas", () => {
    expect(validatePasswordStrength("abc")).toMatch(/8 caracteres/);
    expect(validatePasswordStrength("abcdefgh")).toMatch(/maiúsculas/);
  });

  it("aceita senha forte e verifica hash", async () => {
    const plain = "SenhaForte1";
    expect(validatePasswordStrength(plain)).toBeNull();
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword("errada", hash)).toBe(false);
  });
});

describe("checkpoint windows", () => {
  const surgery = new Date("2026-01-15T12:00:00Z");

  it("calcula janela M3 (−7 / +14 dias)", () => {
    const { windowStart, windowEnd } = checkpointWindow(surgery, "M3");
    expect(windowStart.getMonth()).toBe(3);
    expect(windowEnd.getDate()).toBeGreaterThan(windowStart.getDate());
  });

  it("marca OPEN dentro da janela", () => {
    const mid = new Date("2026-04-15T12:00:00Z");
    expect(checkpointStatusForDate(surgery, "M3", mid)).toBe("OPEN");
  });

  it("marca PENDING antes da janela", () => {
    const early = new Date("2026-01-20T12:00:00Z");
    expect(checkpointStatusForDate(surgery, "M3", early)).toBe("PENDING");
  });

  it("conta dias até o fim da janela", () => {
    const future = new Date(Date.now() + 5 * 86400000);
    expect(daysUntil(future)).toBeGreaterThanOrEqual(4);
  });
});
