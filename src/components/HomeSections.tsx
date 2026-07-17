import { PlanningMapSection } from "@/components/planning/PlanningMapSection";
import { FaqJsonLd } from "@/components/JsonLd";
import { JourneyTrack } from "@/components/JourneyTrack";
import { ResultsVideo } from "@/components/ResultsVideo";
import { Reveal } from "@/components/Reveal";
import { ScrollZoomImage } from "@/components/ScrollZoomImage";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE } from "@/lib/site";
import {
  TESTIMONIALS,
  instagramProfileUrl,
} from "@/lib/testimonials";

export function SectionShell({
  id,
  eyebrow,
  title,
  children,
  tone = "light",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  tone?: "light" | "soft" | "dark";
}) {
  const tones = {
    light: "bg-white text-brand-charcoal",
    soft: "bg-brand-quiet text-brand-charcoal",
    dark: "bg-brand-navy text-white",
  } as const;

  return (
    <section id={id} className={`${tones[tone]} px-4 py-20 md:px-6 md:py-28`}>
      <div className="mx-auto max-w-6xl">
        {eyebrow ? (
          <Reveal delayMs={0}>
            <p
              className={`mb-3 text-[0.7rem] tracking-[0.3em] uppercase ${
                tone === "dark" ? "text-brand-gold" : "text-brand-charcoal"
              }`}
            >
              {eyebrow}
            </p>
          </Reveal>
        ) : null}
        <Reveal delayMs={80}>
          <h2 className="font-display text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl">
            {title}
          </h2>
        </Reveal>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const TREATMENTS = [
  {
    t: "Avaliação tricológica completa",
    d: "Diagnóstico da causa da queda ou da calvície, mapeamento da área doadora e da área receptora, e definição do plano de tratamento antes de qualquer decisão cirúrgica.",
  },
  {
    t: "Transplante capilar",
    d: "Indicação individualizada da técnica, planejamento de linha anterior e densidade, e execução com foco em resultado natural — nunca em série.",
  },
  {
    t: "Cuidados pós-operatórios",
    d: "Protocolo de recuperação com acompanhamento clínico, incluindo, quando indicada, câmara hiperbárica para otimizar a cicatrização. Acompanhamento fotográfico padronizado a cada 3 meses, por 12 meses.",
  },
] as const;

const PILLARS = [
  {
    t: "Ciência",
    d: "Cada protocolo é definido com base em critério médico — não em modelo padrão. Diagnóstico tricológico, indicação da técnica certa e acompanhamento clínico em todas as etapas.",
  },
  {
    t: "Arte",
    d: "Linha anterior e densidade são desenhadas para o formato do seu rosto, não copiadas de um padrão. O objetivo nunca é \"mais cabelo\" — é o resultado que ninguém nota como transplante.",
  },
  {
    t: "Cuidado",
    d: "Acompanhamento real, do primeiro contato ao 12º mês pós-operatório. Você não desaparece da agenda depois da cirurgia.",
  },
] as const;

export function HomeSections() {
  return (
    <>
      <FaqJsonLd items={[...FAQ_ITEMS]} />

      <SectionShell
        id="sobre"
        eyebrow="Sobre"
        title="O médico por trás do resultado natural"
      >
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal delayMs={120} variant="left">
            <p className="font-serif-body text-lg leading-relaxed text-brand-charcoal">
              Cada avaliação começa com uma pergunta simples: o que vai parecer
              natural nesse rosto, daqui a 10 anos? É esse critério — técnico,
              individualizado e sem pressa — que guia o trabalho do Dr. Francisco
              Furtado em cada etapa, da avaliação ao acompanhamento pós-operatório.
            </p>
          </Reveal>
          <Reveal delayMs={220} variant="right">
            <p className="font-signature text-3xl text-brand-gold-dark md:self-end">
              Dr. Francisco Furtado
            </p>
          </Reveal>
        </div>
      </SectionShell>

      <section
        id="tratamentos"
        className="text-white"
        style={{
          background:
            "linear-gradient(90deg, #060810 0%, #0a0e16 18%, #0f1420 36%, #141a28 52%, #1a2232 68%, #243049 84%, #2e3a55 100%)",
        }}
      >
        <div
          id="pilares"
          className="relative flex min-h-[72svh] scroll-mt-24 flex-col justify-end overflow-hidden md:block md:min-h-[64svh]"
          style={{
            background:
              "linear-gradient(180deg, #3a4152 0%, #1a2030 35%, #0c1018 70%, #060810 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, #060810 0%, #0a0e16 12%, #0f1420 24%, #141a28 36%, #1a2232 48%, #2a3344 60%, #4a5260 72%, #7a7a7a 86%, #afafaf 100%)",
            }}
          />

          <div
            className="pointer-events-none absolute top-0 left-1/2 h-[48svh] max-w-[92vw] -translate-x-1/2 overflow-hidden md:hidden"
            style={{
              aspectRatio: "1 / 1",
              WebkitMaskImage:
                "linear-gradient(180deg, #000 0%, #000 88%, transparent 100%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 10%, #000 22%, #000 100%)",
              maskImage:
                "linear-gradient(180deg, #000 0%, #000 88%, transparent 100%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 10%, #000 22%, #000 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          >
            <ScrollZoomImage
              src="/media/procedimento-precisao.jpg"
              alt="Dr. Francisco Furtado em procedimento — precisão clínica com lupas"
              width={640}
              height={640}
              maxScale={1.12}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div
            className="pointer-events-none absolute top-0 right-0 hidden w-[min(48%,64svh)] max-w-[48%] overflow-hidden md:block"
            style={{
              aspectRatio: "1 / 1",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 12%, rgba(0,0,0,0.55) 28%, #000 48%, #000 100%), linear-gradient(180deg, #000 0%, #000 90%, transparent 100%)",
              maskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 12%, rgba(0,0,0,0.55) 28%, #000 48%, #000 100%), linear-gradient(180deg, #000 0%, #000 90%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          >
            <ScrollZoomImage
              src="/media/procedimento-precisao.jpg"
              alt=""
              width={640}
              height={640}
              maxScale={1.12}
              aria-hidden
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, #060810 0%, rgba(6,8,16,0.96) 18%, rgba(10,14,22,0.82) 34%, rgba(15,20,32,0.45) 52%, rgba(26,34,50,0.15) 70%, transparent 100%)",
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 md:hidden"
            aria-hidden
            style={{
              background:
                "linear-gradient(180deg, rgba(10,14,22,0.08) 0%, rgba(10,14,22,0.05) 30%, rgba(8,12,20,0.55) 52%, rgba(6,8,16,0.92) 72%, #060810 100%)",
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-12 pb-14 sm:px-5 md:absolute md:inset-x-0 md:bottom-0 md:px-6 md:pt-16 md:pb-20">
            <Reveal>
              <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
                Diferenciais
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="font-display max-w-xl text-[2.15rem] leading-[1.05] sm:text-4xl md:max-w-lg md:text-5xl">
                Ciência · Arte · Cuidado
              </h2>
            </Reveal>
            <div className="mt-8 grid max-w-md gap-7 md:max-w-lg">
              {PILLARS.map((item, i) => (
                <Reveal key={item.t} delayMs={160 + i * 140} variant="left">
                  <h3 className="text-lg font-semibold tracking-wide text-brand-gold">
                    {item.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {item.d}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white px-4 py-20 text-brand-charcoal md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-charcoal uppercase">
                Procedimentos
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="font-display text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl">
                Avaliação criteriosa. Técnica sob medida. Acompanhamento até o
                fim.
              </h2>
            </Reveal>
            <Reveal delayMs={160}>
              <p className="font-serif-body mt-6 max-w-2xl text-lg leading-relaxed text-brand-charcoal">
                Nenhum protocolo começa pela cirurgia. Começa pela avaliação
                tricológica — é ela que define se, quando e como o transplante
                deve ser feito, sempre com a técnica mais indicada para cada
                caso.
              </p>
            </Reveal>
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {TREATMENTS.map((item, i) => (
                <Reveal
                  key={item.t}
                  as="li"
                  delayMs={i * 120}
                  variant="up"
                  className="border-t border-brand-gray-mid pt-4"
                >
                  <h3 className="text-base font-semibold tracking-wide text-black">
                    {item.t}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-charcoal">
                    {item.d}
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
        <PlanningMapSection />
      </section>

      <SectionShell
        id="resultados"
        title="Da Eslovênia ao Ceará — confiança que atravessa fronteiras"
      >
        <Reveal delayMs={80}>
          <div className="font-serif-body max-w-2xl space-y-4 text-base leading-relaxed text-brand-charcoal sm:text-lg">
            <p>
              Paciente da Eslovênia buscou transplante capilar em vários países
              da Europa. Em nenhum se sentiu verdadeiramente confortável — até
              conhecer o Dr. Francisco Furtado.
            </p>
            <p>
              O vídeo mostra o pós-operatório, os resultados e o relato dele:
              o nível de confiança e a qualidade do cuidado que fizeram a
              diferença na escolha.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={160} variant="scale" className="mt-8 sm:mt-10">
          <ResultsVideo />
        </Reveal>

        <Reveal delayMs={220}>
          <p className="mt-5 text-center text-xs leading-relaxed tracking-wide text-brand-gray sm:mt-6">
            Relato e imagens reais, com consentimento do paciente. O resultado
            individual varia conforme avaliação, área doadora e aderência ao
            pós-operatório.
          </p>
        </Reveal>
      </SectionShell>

      <section
        id="depoimentos"
        className="relative overflow-hidden bg-brand-navy px-4 py-20 text-white md:px-6 md:py-28"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <img
            src="/media/depoimentos-bg.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[70%_30%] opacity-55 sm:object-[75%_28%] sm:opacity-65 md:object-right md:opacity-80"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(26,32,53,0.96) 0%, rgba(26,32,53,0.92) 36%, rgba(26,32,53,0.62) 58%, rgba(26,32,53,0.28) 78%, transparent 100%), linear-gradient(180deg, rgba(26,32,53,0.5) 0%, transparent 20%, transparent 80%, rgba(26,32,53,0.6) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <Reveal delayMs={0}>
            <p className="mb-3 text-[0.7rem] tracking-[0.3em] uppercase text-brand-gold">
              Pacientes
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h2 className="max-w-3xl font-display text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl">
              O que dizem os pacientes
            </h2>
          </Reveal>
          <div className="mt-8">
            <Reveal delayMs={120}>
              <p className="font-serif-body max-w-xl text-lg text-white/85 md:max-w-2xl">
                Comentários reais de quem acompanha o trabalho no Instagram —{" "}
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline decoration-brand-gold underline-offset-4 transition-colors hover:text-brand-gold"
                >
                  {SITE.instagramHandle}
                </a>
                .
              </p>
            </Reveal>

            <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {TESTIMONIALS.map((item, i) => (
                <Reveal
                  key={item.handle}
                  as="li"
                  delayMs={Math.min(80 + i * 50, 320)}
                >
                  <blockquote className="h-full rounded-2xl bg-white px-4 py-3.5 text-brand-charcoal shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <footer className="flex items-center gap-2.5">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px]"
                        aria-hidden
                      >
                        <span className="flex size-full items-center justify-center rounded-full bg-white text-[0.65rem] font-semibold text-brand-charcoal">
                          {item.handle.slice(0, 1).toUpperCase()}
                        </span>
                      </span>
                      <a
                        href={instagramProfileUrl(item.handle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-semibold text-black transition-opacity hover:opacity-70"
                      >
                        {item.handle}
                      </a>
                    </footer>
                    <p className="mt-2.5 text-sm leading-relaxed text-brand-charcoal">
                      {item.quote}
                    </p>
                  </blockquote>
                </Reveal>
              ))}
            </ul>

            <Reveal delayMs={200}>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-12 inline-flex items-center border border-brand-gold/70 px-5 py-3 text-xs font-semibold tracking-[0.16em] uppercase text-brand-gold transition-colors hover:border-brand-gold hover:bg-brand-gold hover:text-brand-charcoal"
              >
                Ver no Instagram
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="jornada"
        className="relative overflow-hidden bg-[#e8e8e6] px-4 py-20 text-brand-charcoal md:px-6 md:py-28"
      >
        {/* Retrato Gemini — base atmosférica */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <img
            src="/media/jornada-pos-op.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[68%_28%] opacity-[0.42] sm:object-[72%_26%] sm:opacity-55 md:object-[100%_32%] md:opacity-70 lg:opacity-80"
          />
          {/* Véu: legibilidade do texto à esquerda / topo */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(232,232,230,0.97) 0%, rgba(232,232,230,0.92) 28%, rgba(232,232,230,0.72) 48%, rgba(232,232,230,0.35) 68%, rgba(232,232,230,0.12) 82%, transparent 100%), linear-gradient(180deg, rgba(232,232,230,0.55) 0%, transparent 22%, transparent 78%, rgba(232,232,230,0.65) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <Reveal delayMs={0}>
            <p className="mb-3 text-[0.7rem] tracking-[0.3em] uppercase text-brand-charcoal">
              Pós-operatório
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h2 className="max-w-3xl font-display text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl">
              Doze meses de acompanhamento — não só as primeiras 48 horas
            </h2>
          </Reveal>
          <div className="mt-8">
            <Reveal delayMs={120}>
              <p className="font-serif-body max-w-xl text-lg text-brand-charcoal md:max-w-2xl">
                As primeiras 48 horas pedem atenção próxima. Depois, o protocolo
                segue com fotos padronizadas a cada três meses, até o marco de 12
                meses — registros na{" "}
                <a
                  href="/paciente/login"
                  className="text-black underline decoration-brand-gold underline-offset-4"
                >
                  área do paciente
                </a>
                , para acompanhar a densidade de verdade.
              </p>
            </Reveal>
            <Reveal delayMs={200} variant="scale">
              <JourneyTrack />
            </Reveal>
          </div>
        </div>
      </section>

      <SectionShell id="faq" eyebrow="Dúvidas" title="Perguntas frequentes">
        <div className="space-y-6">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={item.q} delayMs={Math.min(i * 70, 350)} variant="up">
              <details className="group border-b border-brand-gray-light pb-4">
                <summary className="cursor-pointer list-none text-base font-medium">
                  {item.q}
                </summary>
                <p className="font-serif-body mt-3 text-brand-charcoal">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </>
  );
}
