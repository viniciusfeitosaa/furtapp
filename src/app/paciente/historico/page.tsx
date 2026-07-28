import type { Metadata } from "next";
import { requirePatient } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Histórico",
  robots: { index: false, follow: false },
};

export default async function PacienteHistoricoPage() {
  const session = await requirePatient();
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.userId },
    include: {
      checkpoints: {
        include: { review: true, photos: true },
        orderBy: { code: "asc" },
      },
    },
  });

  if (!profile) return null;

  return (
    <div>
      <h1 className="font-display text-4xl">Histórico</h1>
      <div className="mt-8 space-y-4">
        {profile.checkpoints.map((cp) => (
          <article key={cp.id} className="border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{cp.code}</h2>
              <span className="text-xs text-brand-gray">{cp.status}</span>
            </div>
            <p className="mt-2 text-sm text-brand-gray">
              {cp.photos.length}/5 fotos ·{" "}
              {cp.submittedAt
                ? `Enviado em ${cp.submittedAt.toLocaleDateString("pt-BR")}`
                : "Não enviado"}
            </p>
            {cp.review?.releasedAt && cp.review.patientFeedback ? (
              <div className="mt-4 border-l-2 border-brand-gold pl-4">
                <p className="text-xs font-medium text-brand-gold-dark uppercase">
                  Feedback do Dr.
                </p>
                <p className="mt-1 text-sm text-brand-charcoal">
                  {cp.review.patientFeedback}
                </p>
                {cp.review.densityScore ? (
                  <p className="mt-2 text-xs text-brand-gray">
                    Densidade: {cp.review.densityScore}/5
                  </p>
                ) : null}
              </div>
            ) : cp.status === "COMPLETED" || cp.status === "IN_REVIEW" ? (
              <p className="mt-3 text-xs text-brand-gray">
                Aguardando liberação do feedback.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
