import Link from "next/link";
import { SITE, whatsappUrl } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/simbolo-pincelada.png"
              alt=""
              width={48}
              height={48}
              className="mb-4 h-12 w-12"
            />
            <p className="text-sm font-semibold tracking-[0.12em]">
              {SITE.name} — {SITE.tagline}
            </p>
            <p className="mt-2 text-sm text-white/55">{SITE.region}</p>
          </div>

          <div className="space-y-2 text-sm text-white/70">
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
          </div>

          <div className="flex flex-col gap-2 text-sm text-white/70 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <Link href="/experimente" className="hover:text-white">
              Experimente ao vivo
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/paciente/login" className="hover:text-white">
              Área do paciente
            </Link>
            <Link href="/admin/login" className="hover:text-white">
              Área administrativa
            </Link>
            <Link href="/contato" className="hover:text-white">
              Agendar avaliação
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {SITE.name}. Ciência, arte e cuidado
        humano.
      </div>
    </footer>
  );
}
