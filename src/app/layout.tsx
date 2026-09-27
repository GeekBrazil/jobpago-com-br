import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import EventoVisita from "@/components/EventoVisita";
import Script from "next/script";
import AuthProvider from "@/components/AuthProvider";
import EstradaNevadaScrollytelling from "@/components/EstradaNevadaScrollytelling";

const fontDisplay = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobPago.com.br · Renda Online & Conexão para Nômades Digitais",
  description: "Marketplace de conexão direta para nômades digitais, profissionais remotos, devs e infraestrutura van life. Vagas, serviços e comodidades com negociação direta e PIX sem taxas.",
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

export const viewport: Viewport = {
  themeColor: "#060913",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative">
        <EstradaNevadaScrollytelling />
        <div className="relative z-10 flex flex-col min-h-full">
          <AuthProvider>
            {children}
            <EventoVisita />
            {/* chat de atendimento — widget único servido pelo allancandido.com (substitui o Dify) */}
            <Script src="https://allancandido.com/chat/widget.js" data-site="jobpago" strategy="lazyOnload" />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
