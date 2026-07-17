export function FollicleFallback({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#0c1018] md:aspect-[21/9] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/simbolo-pincelada.png"
        alt="Símbolo Francisco Furtado — folículo estilizado"
        width={160}
        height={160}
        className="h-28 w-28 opacity-90 sm:h-36 sm:w-36"
      />
    </div>
  );
}
