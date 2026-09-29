import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { NOTICIAS_ESTRADA } from "@/data/apoiadores";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";

export const metadata: Metadata = {
  title: "Notícias da Estrada · JobPago.com.br",
  description:
    "Atualizações da Expedição JobPago e reconhecimento de quem apoia — Paraty → Fortaleza.",
  robots: { index: true, follow: true },
};

export default function NoticiasEstradaPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Expedição Paraty → Fortaleza
        </span>

        <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
          Notícias da Estrada
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
          Atualizações reais da viagem, estabelecimentos recém-certificados e
          reconhecimento de quem apoiou a Expedição com uma{" "}
          <Link href="/parceiros/planos" className="text-amber-400 underline hover:text-amber-300">
            contribuição PIX
          </Link>
          .
        </p>

        <div className="mt-12 flex flex-col gap-6">
          {NOTICIAS_ESTRADA.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
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
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
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

      <RodapeSimples />
    </div>
  );
}
