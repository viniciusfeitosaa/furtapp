import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login do paciente",
  robots: { index: false, follow: false },
};

export default function PacienteLoginRedirect() {
  redirect("/login");
}
