"use client";

export function ResultsVideo({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[min(100%,20.5rem)] sm:max-w-[22rem] md:max-w-[24rem] ${className}`}
    >
      <div className="overflow-hidden bg-[#0a0c12] ring-1 ring-black/10">
        <video
          className="aspect-[9/16] h-auto w-full bg-black object-contain"
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          aria-label="Vídeo de acompanhamento de paciente e trabalho clínico do Dr. Francisco Furtado"
        >
          <source src="/media/acompanhamento-paciente.mp4" type="video/mp4" />
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>
    </div>
  );
}
