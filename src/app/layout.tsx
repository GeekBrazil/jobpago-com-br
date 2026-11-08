import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import AuthProvider from "@/components/AuthProvider";
import IndicacaoNoWhats from "@/components/IndicacaoNoWhats";
import IdiomaProvider from "@/components/IdiomaProvider";
import IdiomaFlutuante from "@/components/IdiomaFlutuante";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CenarioLitoral from "@/components/CenarioLitoral";

const fontDisplay = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  const title = L(i, "JobPago · Renda na viagem para nômades e viajantes", "JobPago · Ingresos en el viaje para nómades y viajeros", "JobPago · Income on the go for nomads and travellers");
  const description = L(i,
    "Negócios locais e da rota encontram quem resolve fotos, Instagram, cardápio, frete e apoio na viagem, com Pix direto e sem comissão. Relatório grátis da sua cidade e lugares visitados pela Expedição Paraty → Fortaleza.",
    "Negocios locales y de la ruta encuentran quién hace la tarea (fotos, Instagram, menú, flete, apoyo en el viaje) con Pix directo y sin comisión. Informe gratis de tu ciudad y los lugares visitados por la Expedición Paraty → Fortaleza.",
    "Local businesses along the route find people for photos, Instagram, menus, freight and travel support, with direct Pix and no commission. Free town reports and the places visited by the Paraty → Fortaleza Expedition.");
  return {
  metadataBase: new URL("https://www.jobpago.com.br"),
  title,
  description,
  alternates: { canonical: "https://www.jobpago.com.br" },
  openGraph: {
    title,
    description,
    url: "https://www.jobpago.com.br",
    siteName: "JobPago",
    locale: i === "es" ? "es_AR" : i === "en" ? "en_US" : "pt_BR",
    type: "website",
    images: [{ url: "/icon_flutuante.png", width: 512, height: 512, alt: "JobPago — Renda na viagem" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/icon_flutuante.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JobPago",
  },
  };
}

export const viewport: Viewport = {
  themeColor: "#060913",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const idioma = await idiomaServidor();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.jobpago.com.br/#website",
        url: "https://www.jobpago.com.br",
        name: "JobPago",
        description: "Renda na viagem para nômades e viajantes, serviços locais com Pix direto e relatório oficial por cidade.",
        inLanguage: ["pt-BR", "es", "en"],
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.jobpago.com.br/cidade?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://www.jobpago.com.br/#organization",
        name: "JobPago",
        url: "https://www.jobpago.com.br",
        logo: "https://www.jobpago.com.br/icon_flutuante.png",
      },
    ],
  };
  return (
    <html
      lang={idioma === "pt" ? "pt-BR" : idioma}
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CenarioLitoral />
        {/* Google Analytics 4 */}
        {(process.env.NEXT_PUBLIC_GA_ID || "G-8GECCQR1L0") && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-8GECCQR1L0"} />
        )}
        <div className="relative z-10 flex flex-col min-h-full">
          <AuthProvider>
            <IdiomaProvider inicial={idioma}>
              {children}
              <p className="relative z-10 border-t border-white/10 bg-slate-950/90 px-4 py-3 text-center text-xs text-slate-300">
                {L(idioma,
                  "Viu exploração sexual de criança ou adolescente? Denuncie: ",
                  "¿Viste explotación sexual de niños, niñas o adolescentes en Brasil? Denunciá: ",
                  "Seen child sexual exploitation in Brazil? Report it: ")}
                <a href="tel:100" className="font-bold text-white underline">Disque 100</a>
                {L(idioma, " (gratuito, 24 horas).", " (gratuito, 24 horas).", " (free, 24 hours).")}
              </p>
              <IdiomaFlutuante />
            </IdiomaProvider>
            <IndicacaoNoWhats />
            {/* rastreio próprio + passo de 1 toque antes do WhatsApp — arquivo único servido pelo allancandido.com */}
            <Script src="https://allancandido.com/r.js" data-site="jobpago" data-cor="#F59E0B" strategy="afterInteractive" />
            {/* chat de atendimento — widget único servido pelo allancandido.com (substitui o Dify) */}
            <Script src="https://allancandido.com/chat/widget.js" data-site="jobpago" strategy="lazyOnload" />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
