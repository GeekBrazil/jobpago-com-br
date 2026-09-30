import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";
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
  return {
  title: L(i, "JobPago · Renda na viagem para nômades e viajantes", "JobPago · Ingresos en el viaje para nómades y viajeros", "JobPago · Income on the go for nomads and travellers"),
  description: L(i,
    "Negócios locais e da rota encontram quem faz a tarefa — fotos, Instagram, cardápio, frete, apoio na viagem — com Pix direto e sem comissão. Relatório grátis da sua cidade e os lugares visitados pela Expedição Paraty → Fortaleza.",
    "Negocios locales y de la ruta encuentran quién hace la tarea (fotos, Instagram, menú, flete, apoyo en el viaje) con Pix directo y sin comisión. Informe gratis de tu ciudad y los lugares visitados por la Expedición Paraty → Fortaleza.",
    "Local businesses along the route find people to do the tasks — photos, Instagram, menus, freight, travel support — with direct Pix and no commission. Free town reports and the places visited by the Paraty → Fortaleza Expedition."),
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
  return (
    <html
      lang={idioma === "pt" ? "pt-BR" : idioma}
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative">
        <CenarioLitoral />
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
