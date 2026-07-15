import type { Metadata, Viewport } from "next";
import {
  Arapey,
  Bebas_Neue,
  Great_Vibes,
  Poppins,
} from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const arapey = Arapey({
  variable: "--font-arapey",
  subsets: ["latin"],
  weight: "400",
});

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | Transplante Capilar em Fortaleza e Ceará`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Dr. Francisco Furtado — tricologia e transplante capilar com resultado natural, ética e acompanhamento humanizado em Fortaleza e em todo o Ceará.",
  metadataBase: new URL(SITE.url),
  openGraph: {
    title: `${SITE.name} | Transplante Capilar`,
    description:
      "Ciência, arte e cuidado humano. Avaliação e acompanhamento em Fortaleza e no Ceará.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/brand/simbolo-pincelada.png",
        width: 512,
        height: 512,
        alt: SITE.name,
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${bebas.variable} ${arapey.variable} ${script.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-black">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
