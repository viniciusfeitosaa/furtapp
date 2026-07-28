import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { requireAdmin } from "@/lib/auth/guards";
import { markInReviewAction } from "@/lib/admin/actions";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sala de análise",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ checkpointId: string }> };

export default async function AnalisePage({ params }: Props) {
  await requireAdmin();
  const { checkpointId } = await params;

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: checkpointId },
    include: {
      patient: { include: { user: true } },
      photos: true,
      review: true,
    },
  });

  if (!checkpoint) notFound();

  if (checkpoint.status === "SUBMITTED") {
    await markInReviewAction(checkpointId);
  }

  return (
    <div>
      <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
        Sala de análise
      </p>
      <h1 className="font-display mt-2 text-4xl">
        {checkpoint.patient.user.name}
      </h1>
      <p className="mt-2 text-sm text-brand-gray">
        Checkpoint {checkpoint.code}
      </p>
      <ReviewForm
        checkpointId={checkpoint.id}
        patientName={checkpoint.patient.user.name}
        code={checkpoint.code}
        photoCount={checkpoint.photos.length}
        defaultPrivate={checkpoint.review?.privateNote ?? undefined}
        defaultFeedback={checkpoint.review?.patientFeedback ?? undefined}
        defaultScore={checkpoint.review?.densityScore ?? undefined}
        released={!!checkpoint.review?.releasedAt}
      />
    </div>
  );
}
