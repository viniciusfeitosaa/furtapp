/** Comentários reais em posts do Instagram do Dr. Francisco Furtado */
export const TESTIMONIALS = [
  {
    handle: "luizricardoholanda",
    quote: "Um serviço de excelência, com aquela dedicação de sempre!",
  },
  {
    handle: "sabrina_sales",
    quote: "Grande profissional e ser humano 👏👏👏",
  },
  {
    handle: "amandacout0",
    quote: "👏👏👏 competência e excelência",
  },
  {
    handle: "jvictorosas",
    quote: "Ser humano e profissional exemplar!!! 👏👏👏",
  },
  {
    handle: "dr.helioaccioly",
    quote: "Referência no que faz!",
  },
  {
    handle: "luizcarvalhooficial",
    quote:
      "Sou seu paciente e posso dizer com segurança da sua competência. Meu tratamento fez toda diferença na minha autoestima. Parabéns e gratidão. 👏👏 👏👏👏",
  },
  {
    handle: "amandaacoutinho_",
    quote: "Grande profissional! 👏",
  },
] as const;

export function instagramProfileUrl(handle: string) {
  return `https://www.instagram.com/${handle}/`;
}
