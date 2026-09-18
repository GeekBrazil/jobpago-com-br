import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import ContribuirFotoForm from "@/components/ContribuirFotoForm";

export const metadata: Metadata = {
  title: "Contribuir com uma Foto · JobPago.com.br",
  description:
    "Envie a foto de um posto, pousada, camping ou ponto de apoio na estrada — a localização é lida automaticamente da foto.",
  robots: { index: true, follow: true },
};

export default function ContribuirPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-black">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <Icon name="pin" width={30} height={30} /> Camada da Comunidade
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            Achou um ponto de apoio? Manda a foto.
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Posto com chuveiro, pousada que aceita motorhome, oficina de
            confiança — se a foto tiver GPS, a localização entra sozinha no
            mapa. Toda contribuição passa por uma revisão antes de aparecer
            pra todo mundo.
          </p>
        </div>

        <div className="mt-12">
          <ContribuirFotoForm />
        </div>
      </main>

      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · Marketplace Passivo mantido por Allan Candido.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/certificados" className="hover:text-emerald-400 transition-colors">
              Certificados
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
