import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { NOTICIAS_ESTRADA } from "@/data/apoiadores";

export const metadata: Metadata = {
  title: "Notícias da Estrada · JobPago.com.br",
  description:
    "Atualizações da Expedição JobPago e reconhecimento de quem apoia — Angra dos Reis → Fortaleza.",
  robots: { index: true, follow: true },
};

export default function NoticiasEstradaPage() {
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
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Expedição Angra → Fortaleza
        </span>

        <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
          Notícias da Estrada
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
          Atualizações reais da viagem, estabelecimentos recém-certificados e
          reconhecimento de quem apoiou a Expedição com uma{" "}
          <Link href="/parceiros/planos" className="text-emerald-400 underline hover:text-emerald-300">
            contribuição PIX
          </Link>
          .
        </p>

        <div className="mt-12 flex flex-col gap-6">
          {NOTICIAS_ESTRADA.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Icon name="rocket" width={52} height={52} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                A estrada ainda não começou
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                O primeiro post aparece aqui quando a Expedição sair do papel
                — atualização de trecho, selo novo ou apoiador reconhecido.
              </p>
            </div>
          ) : (
            NOTICIAS_ESTRADA.map((post) => (
              <article key={post.id} className="glass-card rounded-3xl p-6 sm:p-8">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  {post.data}
                </span>
                <h2 className="text-xl font-black text-white mt-1">{post.titulo}</h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">{post.corpo}</p>
                {post.autor && (
                  <p className="mt-4 text-xs text-slate-500">Apoiado por {post.autor}</p>
                )}
              </article>
            ))
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · Marketplace Passivo mantido por Allan Candido.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/parceiros/planos" className="hover:text-emerald-400 transition-colors">
              Seja Parceiro
            </Link>
            <Link href="/certificados" className="hover:text-emerald-400 transition-colors">
              Certificados
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
