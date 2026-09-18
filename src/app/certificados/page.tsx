import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import CertificadosLista from "@/components/CertificadosLista";

export const metadata: Metadata = {
  title: "Estabelecimentos Certificados · JobPago.com.br",
  description:
    "Postos, pousadas e campings visitados e verificados pessoalmente na Expedição JobPago Angra dos Reis → Fortaleza.",
  robots: { index: true, follow: true },
};

export default function CertificadosPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* HEADER SIMPLES DE NAVEGAÇÃO */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:border-emerald-400 transition-colors">
              <img
                src="/icon_flutuante-96.webp"
                width={96}
                height={96}
                alt="JobPago Logo"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                JobPago<span className="text-emerald-400">.</span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                Renda &amp; Estrada
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            ← Voltar para a Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* HERO */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <Icon name="shield" width={15} height={15} /> Selo Verificado
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            Estabelecimentos Certificados
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Não é adesivo comprado. O selo diz que alguém da JobPago esteve no
            local, testou a estrutura de verdade — chuveiro, tomada, Wi-Fi,
            pátio — e anotou a data. Se a estrutura mudar, o selo cai. Cada
            pin âmbar no mapa da home é um lugar assim.
          </p>
        </div>

        {/* QR CODE ÚNICO */}
        <section className="mt-14 glass-panel border border-amber-400/25 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
          <img
            src="/qrcode-certificados.png"
            alt="QR Code para jobpago.com.br/certificados"
            width={160}
            height={160}
            className="rounded-2xl border-4 border-white shrink-0"
          />
          <div>
            <h2 className="text-lg font-black text-white">O QR code do selo</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
              Um único QR code, o mesmo em todo adesivo físico entregue na
              estrada. Ele sempre aponta pra esta página — quem escaneia vê a
              lista completa de estabelecimentos certificados, não uma vaga
              individual, então o mesmo adesivo serve pra qualquer parceiro
              sem precisar gerar um código por local.
            </p>
            <a
              href="/qrcode-certificados.png"
              download
              className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer mt-4"
            >
              <Icon name="check" width={15} height={15} /> Baixar PNG pra impressão
            </a>
          </div>
        </section>

        {/* LISTA DE CERTIFICADOS */}
        <CertificadosLista />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · Marketplace Passivo mantido por Allan Candido.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/como-funciona" className="hover:text-emerald-400 transition-colors">
              Como Funciona
            </Link>
            <Link href="/parceiros/planos" className="hover:text-emerald-400 transition-colors">
              Seja Parceiro
            </Link>
            <a href="mailto:allan@jobpago.com.br" className="hover:text-emerald-400 transition-colors">
              allan@jobpago.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
