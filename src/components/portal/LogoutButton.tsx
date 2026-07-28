"use client";

import { logoutAction } from "@/lib/auth/logout-action";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-sm text-brand-gray underline transition-colors hover:text-black"
      >
        Sair
      </button>
    </form>
  );
}
