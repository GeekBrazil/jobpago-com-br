import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "../cidade/CidadeTopo";
import FormRefugio from "./FormRefugio";
import { NIVEIS_HONRA } from "@/data/honra";

export const metadata: Metadata = {
  title: "Seja um Refúgio da Estrada · Expedição JobPago Paraty → Fortaleza",
  description:
    "Camping, hostel, pousada, hotel ou pátio para motorhome na rota Paraty → Fortaleza: peça a visita da Expedição JobPago e ganhe o selo de Refúgio da Estrada verificado.",
  alternates: { canonical: "https://jobpago.com.br/refugio" },
};

export default function RefugioPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Expedição nº 01 · saída 15 de outubro</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">Seja um Refúgio da Estrada</h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl">
          Camping, hostel, pousada, hotel ou pátio para motorhome entre Paraty e Fortaleza: peça a visita. A gente passa a noite,
          confere o que está combinado e, se estiver tudo certo, seu lugar entra no mapa com o selo e a data da visita.
        </p>

        <section className="mt-12" aria-labelledby="honra">
          <h2 id="honra" className="text-2xl sm:text-3xl font-black">Alta Honra: como seu lugar apoia a estrada</h2>
          <p className="mt-2 text-slate-300 max-w-2xl">
            O selo de verificado não se compra — só entra quem passou na visita. A Honra mostra, identificada no selo, quanto o lugar
            apoia a expedição.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {NIVEIS_HONRA.map((n) => (
              <div key={n.id} className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${n.cor}`}>{n.nome}</span>
                  <span className="text-xs font-mono text-slate-400">{n.como}</span>
                </div>
                <p className="mt-3 text-sm text-slate-200">{n.desc}</p>
                <p className="mt-2 text-sm text-slate-400"><span className="text-slate-300 font-bold">Ganha:</span> {n.ganha}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Valores dos planos em <Link href="/parceiros/planos" className="underline hover:text-amber-400">Parceiros</Link>. O que conferimos na visita está em{" "}
            <Link href="/#refugio-estrada" className="underline hover:text-amber-400">Refúgio da Estrada</Link>.
          </p>
        </section>

        <section className="mt-14" aria-labelledby="cadastro">
          <h2 id="cadastro" className="text-2xl sm:text-3xl font-black">Pedir a visita</h2>
          <p className="mt-2 text-slate-300">Leva 2 minutos. A gente responde pelo WhatsApp para combinar a data.</p>
          <FormRefugio />
        </section>
      </main>
    </div>
  );
}
