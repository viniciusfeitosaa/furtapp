import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login administrativo",
  robots: { index: false, follow: false },
};

export default function AdminLoginRedirect() {
  redirect("/login");
}
