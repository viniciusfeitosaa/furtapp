import Image from "next/image";
import Link from "next/link";
import { SITE, whatsappUrl } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3 md:px-6">
        <div>
          <Image
            src="/brand/simbolo-pincelada.svg"
            alt=""
            width={48}
            height={48}
            className="mb-4 h-12 w-12 rounded-sm"
          />
          <p className="text-sm font-semibold tracking-[0.18em] uppercase">
            {SITE.name}
          </p>
          <p className="mt-2 text-[0.65rem] tracking-[0.28em] text-white/70 uppercase">
            {SITE.tagline}
          </p>
          <p className="font-signature mt-6 text-2xl text-brand-gold">
            Dr. Francisco Furtado
          </p>
        </div>

        <div className="space-y-2 text-sm text-white/75">
          <p className="text-xs tracking-[0.2em] text-brand-gold uppercase">
            Contato
          </p>
          <a
            href={whatsappUrl()}
            className="block transition-colors hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {SITE.phoneDisplay}
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="block transition-colors hover:text-white"
          >
            {SITE.email}
          </a>
          <a
            href={SITE.instagram}
            className="block transition-colors hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram {SITE.instagramHandle}
          </a>
          <p className="pt-2 text-white/55">{SITE.region}</p>
        </div>

        <div className="space-y-2 text-sm text-white/75">
          <p className="text-xs tracking-[0.2em] text-brand-gold uppercase">
            Acesso
          </p>
          <Link href="/paciente/login" className="block hover:text-white">
            Área do paciente
          </Link>
          <Link href="/admin/login" className="block hover:text-white">
            Área administrativa
          </Link>
          <Link href="/contato" className="block hover:text-white">
            Agendar avaliação
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {SITE.name}. Ciência, arte e cuidado
        humano.
      </div>
    </footer>
  );
}
