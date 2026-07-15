import { PHOTO_REGIONS, CHECKPOINTS } from "@/lib/site";

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
          <p
            className={`mb-3 text-[0.7rem] tracking-[0.3em] uppercase ${
              tone === "dark" ? "text-brand-gold" : "text-brand-charcoal"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function HomeSections() {
  return (
    <>
      <SectionShell id="sobre" eyebrow="Sobre" title="O médico atrás do resultado natural">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <p className="font-serif-body text-lg leading-relaxed text-brand-charcoal">
            Atendimento técnico, criterioso e acolhedor — com foco em
            transplantes capilares de excelência. Conteúdo completo da bio,
            formação e CRM será inserido assim que o material oficial for
            enviado (ver MAPA DE BORDO).
          </p>
          <p className="font-signature text-3xl text-brand-gold-dark md:self-end">
            Dr. Francisco Furtado
          </p>
        </div>
      </SectionShell>

      {/* Pilares no estilo do hero: texto + foto fundidos no degradê */}
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
          className="relative flex min-h-[100svh] scroll-mt-24 flex-col justify-end overflow-hidden md:block md:min-h-[90svh]"
          style={{
            background:
              "linear-gradient(180deg, #3a4152 0%, #1a2030 35%, #0c1018 70%, #060810 100%)",
          }}
        >
          {/* Fundo desktop: azul escuro → cinza (esq. → dir.) */}
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, #060810 0%, #0a0e16 12%, #0f1420 24%, #141a28 36%, #1a2232 48%, #2a3344 60%, #4a5260 72%, #7a7a7a 86%, #afafaf 100%)",
            }}
          />

          {/* Mobile: foto em cima — sem máscara/blur nas bordas */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 h-[52svh] max-w-[92vw] -translate-x-1/2 md:hidden"
            style={{ aspectRatio: "1 / 1" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/procedimento-precisao.jpg"
              alt="Dr. Francisco Furtado em procedimento — precisão clínica com lupas"
              width={640}
              height={640}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Desktop: foto à direita — sem blur */}
          <div
            className="pointer-events-none absolute top-1/2 right-0 hidden h-[min(85svh,720px)] max-w-[48%] -translate-y-1/2 md:block"
            style={{ aspectRatio: "1 / 1" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/procedimento-precisao.jpg"
              alt=""
              width={640}
              height={640}
              loading="lazy"
              decoding="async"
              aria-hidden
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Overlay desktop — só na zona do texto (não cobre a foto) */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[54%] md:block"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, #060810 0%, rgba(6,8,16,0.94) 55%, rgba(6,8,16,0.4) 82%, transparent 100%)",
            }}
          />

          {/* Overlay mobile — só na base, sob o texto */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] md:hidden"
            aria-hidden
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(6,8,16,0.55) 35%, rgba(6,8,16,0.92) 70%, #060810 100%)",
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-5 md:absolute md:inset-x-0 md:bottom-0 md:px-6 md:pt-32 md:pb-28">
            <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
              Diferenciais
            </p>
            <h2 className="font-display max-w-xl text-[2.15rem] leading-[1.05] sm:text-4xl md:max-w-lg md:text-5xl">
              Ciência · Arte · Cuidado
            </h2>
            <div className="mt-8 grid max-w-md gap-7 md:max-w-lg">
              {[
                {
                  t: "Ciência",
                  d: "Critério médico, personalização e protocolos seguros em cada etapa.",
                },
                {
                  t: "Arte",
                  d: "Linha anterior e densidade pensadas para um resultado natural e harmônico.",
                },
                {
                  t: "Cuidado",
                  d: "Acolhimento real — da avaliação ao pós-operatório e ao acompanhamento de 12 meses.",
                },
              ].map((item) => (
                <div key={item.t}>
                  <h3 className="text-lg font-semibold tracking-wide text-brand-gold">
                    {item.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white px-4 py-20 text-brand-charcoal md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-charcoal uppercase">
              Procedimentos
            </p>
            <h2 className="font-display text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl">
              Tratamentos
            </h2>
            <p className="font-serif-body mt-6 max-w-2xl text-lg leading-relaxed text-brand-charcoal">
              Avaliação criteriosa, técnica individualizada e acompanhamento —
              do procedimento ao pós-operatório.
            </p>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                "Transplante capilar (técnicas e indicação individualizada)",
                "Avaliação tricológica completa",
                "Cuidados pós-operatórios (incl. menção à câmara hiperbárica)",
              ].map((item) => (
                <li
                  key={item}
                  className="border-t border-brand-gray-mid pt-4 text-sm leading-relaxed text-brand-charcoal"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SectionShell
        id="resultados"
        eyebrow="Prova visual"
        title="Resultados / Antes e depois"
      >
        <p className="font-serif-body max-w-2xl text-lg text-brand-charcoal">
          Galeria com fotos reais (com consentimento). Placeholders até o envio
          dos casos — lazy loading e WebP na implementação final.
        </p>
      </SectionShell>

      <SectionShell
        id="depoimentos"
        eyebrow="Pacientes"
        title="Depoimentos"
        tone="soft"
      >
        <p className="max-w-2xl text-brand-charcoal">
          Espaço para relatos reais. Tom humano, sem exagero promocional.
        </p>
      </SectionShell>

      <SectionShell
        id="jornada"
        eyebrow="Pós-operatório"
        title="Cuidado contínuo — inclusive por 12 meses"
      >
        <p className="font-serif-body max-w-2xl text-lg text-brand-charcoal">
          Da janela crítica das primeiras 48 horas ao acompanhamento fotográfico
          padronizado a cada 3 meses até completar 1 ano — disponível na{" "}
          <a href="/paciente/login" className="text-black underline decoration-brand-gold underline-offset-4">
            área do paciente
          </a>
          .
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-5">
          {CHECKPOINTS.map((cp) => (
            <li
              key={cp}
              className="border border-brand-gray-light px-3 py-4 text-center"
            >
              <span className="block text-xs tracking-[0.2em] text-brand-gray uppercase">
                Checkpoint
              </span>
              <span className="mt-2 block text-xl font-semibold text-black">
                {cp}
              </span>
            </li>
          ))}
        </ol>
        <ul className="mt-8 grid gap-2 text-sm text-brand-gray md:grid-cols-2">
          {PHOTO_REGIONS.map((r) => (
            <li key={r.id}>• {r.label}</li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="faq" eyebrow="Dúvidas" title="Perguntas frequentes">
        <div className="space-y-6">
          {[
            {
              q: "O resultado fica natural?",
              a: "O planejamento da linha e da densidade busca harmonia com o seu rosto — naturalidade é prioridade clínica.",
            },
            {
              q: "Quanto tempo dura o acompanhamento?",
              a: "O protocolo digital prevê fotos padronizadas em M0, M3, M6, M9 e M12 para o Dr. avaliar a evolução com você.",
            },
            {
              q: "Atendem fora de Fortaleza?",
              a: "Sim — Fortaleza e toda a região do Ceará. Detalhes de deslocamento na avaliação.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group border-b border-brand-gray-light pb-4"
            >
              <summary className="cursor-pointer list-none text-base font-medium">
                {item.q}
              </summary>
              <p className="font-serif-body mt-3 text-brand-charcoal">{item.a}</p>
            </details>
          ))}
        </div>
      </SectionShell>
    </>
  );
}
