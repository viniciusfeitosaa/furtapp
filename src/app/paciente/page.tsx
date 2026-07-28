import type { Metadata } from "next";
import { PhotoUploadGrid } from "@/components/patient/PhotoUploadGrid";
import { requirePatient } from "@/lib/auth/guards";
import { formatCheckpointLabel, daysUntil } from "@/lib/checkpoints";
import { prisma } from "@/lib/db";
import { CHECKPOINTS, PHOTO_REGIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Meu acompanhamento",
  robots: { index: false, follow: false },
};

const STATUS_PT: Record<string, string> = {
  PENDING: "Aguardando",
  OPEN: "Em janela",
  SUBMITTED: "Enviado — em análise",
  IN_REVIEW: "Em análise",
  COMPLETED: "Concluído",
  LATE: "Janela encerrada",
};

export default async function PacienteDashboardPage() {
  const session = await requirePatient();

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.userId },
    include: {
      checkpoints: {
        include: { photos: true, review: true },
        orderBy: { code: "asc" },
      },
    },
  });

  if (!profile) {
    return (
      <p className="text-sm text-brand-gray">
        Perfil de paciente não encontrado. Contate a clínica.
      </p>
    );
  }

  const active =
    profile.checkpoints.find((c) => c.status === "OPEN" || c.status === "LATE") ??
    profile.checkpoints.find((c) => c.status === "SUBMITTED" || c.status === "IN_REVIEW");

  const latestFeedback = profile.checkpoints
    .filter((c) => c.review?.releasedAt && c.review.patientFeedback)
    .sort((a, b) => (b.review!.releasedAt!.getTime() - a.review!.releasedAt!.getTime()))
    [0];

  return (
    <div>
      <p className="text-[0.7rem] tracking-[0.3em] text-brand-charcoal uppercase">
        Olá, {session.name.split(" ")[0]}
      </p>
      <h1 className="font-display mt-2 text-4xl text-black md:text-5xl">
        Acompanhamento 12 meses
      </h1>

      {latestFeedback?.review?.patientFeedback ? (
        <div className="mt-6 border border-brand-gold/40 bg-brand-quiet p-5">
          <p className="text-xs font-semibold tracking-wide text-brand-gold-dark uppercase">
            Último feedback — {latestFeedback.code}
          </p>
          <p className="font-serif-body mt-2 text-brand-charcoal">
            {latestFeedback.review.patientFeedback}
          </p>
        </div>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-5">
        {CHECKPOINTS.map((cp) => {
          const row = profile.checkpoints.find((c) => c.code === cp);
          const status = row?.status ?? "PENDING";
          const isActive = active?.code === cp;
          return (
            <div
              key={cp}
              className={`border px-3 py-4 text-center ${
                isActive ? "border-black bg-brand-quiet" : "border-brand-gray-mid"
              }`}
            >
              <span className="text-xs tracking-widest text-brand-gray uppercase">
                {formatCheckpointLabel(cp)}
              </span>
              <span className="mt-1 block text-xl font-semibold">{cp}</span>
              <span className="mt-2 block text-[0.65rem] text-brand-gray">
                {STATUS_PT[status] ?? status}
              </span>
            </div>
          );
        })}
      </div>

      {active && (active.status === "OPEN" || active.status === "LATE") ? (
        <section className="mt-14">
          <h2 className="text-sm tracking-[0.2em] uppercase">
            Upload — 5 regiões ({active.code})
          </h2>
          {active.windowEnd ? (
            <p className="mt-2 text-sm text-brand-gray">
              {active.status === "OPEN"
                ? `Janela fecha em ${daysUntil(active.windowEnd)} dia(s).`
                : "Janela encerrada — envio ainda permitido para regularização."}
            </p>
          ) : null}
          <div className="mt-4">
            <PhotoUploadGrid
              checkpointId={active.id}
              code={active.code}
              regions={PHOTO_REGIONS}
              uploaded={active.photos.map((p) => p.region)}
            />
          </div>
        </section>
      ) : (
        <p className="mt-10 text-sm text-brand-gray">
          {active?.status === "SUBMITTED" || active?.status === "IN_REVIEW"
            ? `Seu envio ${active.code} está em análise. Você receberá o feedback aqui.`
            : "Nenhum checkpoint aberto no momento. Aguarde a próxima janela."}
        </p>
      )}
    </div>
  );
}
