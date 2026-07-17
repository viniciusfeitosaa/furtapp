import { PlanningMapSection } from "@/components/planning/PlanningMapSection";
import { FaqJsonLd } from "@/components/JsonLd";
import { JourneyTrack } from "@/components/JourneyTrack";
import { ResultsVideo } from "@/components/ResultsVideo";
import { Reveal } from "@/components/Reveal";
import { ScrollZoomImage } from "@/components/ScrollZoomImage";
import { FAQ_ITEMS } from "@/lib/faq";
import { PHOTO_REGIONS } from "@/lib/site";

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
        eyebrow="Prova visual"
        title="Acompanhamento real — do consultório ao resultado"
      >
        <Reveal delayMs={80}>
          <p className="font-serif-body max-w-2xl text-base leading-relaxed text-brand-charcoal sm:text-lg">
            Um olhar sobre o acompanhamento de um paciente e o trabalho clínico
            do Dr. Francisco Furtado — o mesmo critério que guia cada etapa do
            protocolo de{" "}
            <a
              href="#jornada"
              className="text-black underline decoration-brand-gold underline-offset-4"
            >
              12 meses pós-operatório
            </a>
            .
          </p>
        </Reveal>

        <Reveal delayMs={160} variant="scale" className="mt-8 sm:mt-10">
          <ResultsVideo />
        </Reveal>

        <Reveal delayMs={220}>
          <p className="mt-5 text-center text-xs leading-relaxed tracking-wide text-brand-gray sm:mt-6">
            Conteúdo real, publicado com consentimento. O resultado individual
            varia conforme avaliação, área doadora e aderência ao pós-operatório.
          </p>
        </Reveal>
      </SectionShell>

      <SectionShell
        id="depoimentos"
        eyebrow="Pacientes"
        title="O que dizem os pacientes"
        tone="soft"
      >
        <Reveal delayMs={120}>
          <p className="font-serif-body max-w-2xl text-lg text-brand-charcoal">
            Estamos reunindo os relatos dos pacientes que já concluíram o
            acompanhamento de 12 meses. Em breve, você vai poder ler a experiência
            de quem passou por cada etapa — da avaliação ao resultado final.
          </p>
        </Reveal>
      </SectionShell>

      <SectionShell
        id="jornada"
        eyebrow="Pós-operatório"
        title="Cuidado contínuo — inclusive depois que você já esqueceu que fez a cirurgia"
      >
        <Reveal delayMs={120}>
          <p className="font-serif-body max-w-2xl text-lg text-brand-charcoal">
            As primeiras 48 horas são a janela mais delicada da recuperação — e é
            nelas que o acompanhamento é mais próximo. Depois, o protocolo
            continua: fotos padronizadas a cada 3 meses, por 12 meses, disponíveis
            na{" "}
            <a
              href="/paciente/login"
              className="text-black underline decoration-brand-gold underline-offset-4"
            >
              área do paciente
            </a>
            .
          </p>
        </Reveal>
        <Reveal delayMs={200}>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-gray">
            M0 → M3 → M6 → M9 → M12 — cinco registros fotográficos padronizados
            (frontal, superior, coroa, e ambos os perfis temporais), para
            acompanhar a evolução real da densidade, não só a memória de como era
            antes.
          </p>
        </Reveal>
        <Reveal delayMs={280} variant="scale">
          <JourneyTrack />
        </Reveal>
        <ul className="mt-8 grid gap-2 text-sm text-brand-gray md:grid-cols-2">
          {PHOTO_REGIONS.map((r, i) => (
            <Reveal key={r.id} as="li" delayMs={80 + i * 60}>
              • {r.label}
            </Reveal>
          ))}
        </ul>
      </SectionShell>

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
