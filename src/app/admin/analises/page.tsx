import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Análises",
  robots: { index: false, follow: false },
};

export default async function AdminAnalisesPage() {
  await requireAdmin();

  const items = await prisma.checkpoint.findMany({
    where: {
      status: { in: ["SUBMITTED", "IN_REVIEW", "COMPLETED"] },
    },
    include: {
      patient: { include: { user: true } },
      photos: true,
      review: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
        Admin
      </p>
      <h1 className="font-display mt-2 text-4xl">Análises clínicas</h1>

      <div className="mt-8 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-brand-gray">Nenhuma análise ainda.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/analise/${item.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border border-black/5 bg-white p-4 transition-colors hover:border-brand-gold/40"
            >
              <div>
                <p className="font-medium">{item.patient.user.name}</p>
                <p className="text-sm text-brand-gray">
                  {item.code} · {item.photos.length}/5 fotos
                </p>
              </div>
              <span className="text-xs tracking-wide text-brand-gold-dark uppercase">
                {item.review?.releasedAt ? "Liberado" : item.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
