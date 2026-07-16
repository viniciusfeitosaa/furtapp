import { SITE } from "@/lib/site";

const physician = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: "Dr. Francisco Furtado",
  url: SITE.url,
  image: `${SITE.url}/brand/simbolo-pincelada.png`,
  telephone: SITE.phoneE164,
  email: SITE.email,
  medicalSpecialty: "Tricologia",
  areaServed: [
    { "@type": "City", name: "Fortaleza" },
    { "@type": "State", name: "Ceará" },
  ],
  sameAs: [SITE.instagram],
  description:
    "Tricologia e transplante capilar em Fortaleza e no Ceará — avaliação individualizada e acompanhamento de 12 meses.",
};

type FaqItem = { q: string; a: string };

export function PhysicianJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(physician) }}
    />
  );
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
