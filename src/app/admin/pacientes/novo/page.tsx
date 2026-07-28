import type { Metadata } from "next";
import { CreatePatientForm } from "@/components/admin/CreatePatientForm";

export const metadata: Metadata = {
  title: "Novo paciente",
  robots: { index: false, follow: false },
};

export default function NovoPacientePage() {
  return (
    <div>
      <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
        Admin
      </p>
      <h1 className="font-display mt-2 text-4xl">Cadastrar paciente</h1>
      <p className="mt-4 max-w-lg text-sm text-brand-charcoal">
        Cria login do paciente e inicia o protocolo M0–M12 com janelas
        automáticas de envio fotográfico.
      </p>
      <CreatePatientForm />
    </div>
  );
}
