export const SITE = {
  name: "Francisco Furtado",
  tagline: "Tricologia e Transplante Capilar",
  url: "https://www.ffurtado.com.br",
  phoneDisplay: "(88) 9.9252-4200",
  phoneE164: "5588992524200",
  email: "atendimento@ffurtado.com.br",
  instagram: "https://www.instagram.com/dr.franciscofurtado/",
  instagramHandle: "@dr.franciscofurtado",
  region: "Fortaleza e todo o Ceará",
  whatsappMessage:
    "Olá! Gostaria de agendar minha avaliação de tricologia/transplante capilar.",
} as const;

export function whatsappUrl(message: string = SITE.whatsappMessage) {
  return `https://wa.me/${SITE.phoneE164}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { href: "/#inicio", label: "Início" },
  { href: "/#tratamentos", label: "Tratamentos" },
  { href: "/#resultados", label: "Resultados" },
  { href: "/#depoimentos", label: "Depoimentos" },
  { href: "/contato", label: "Contato" },
  { href: "/blog", label: "Blog" },
] as const;

/** Regiões do protocolo fotográfico (portal do paciente) */
export const PHOTO_REGIONS = [
  { id: "FRONTAL", label: "Frontal / linha anterior" },
  { id: "VERTEX", label: "Superior / vértex" },
  { id: "CROWN", label: "Coroa / occipital receptor" },
  { id: "TEMPORAL_L", label: "Temporal / perfil esquerdo" },
  { id: "TEMPORAL_R", label: "Temporal / perfil direito" },
] as const;

export const CHECKPOINTS = ["M0", "M3", "M6", "M9", "M12"] as const;
