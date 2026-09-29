import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "../cidade/CidadeTopo";
import { garantirTabelasExpedicoes, nomeModo } from "@/lib/expedicoes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Expedições dos viajantes · JobPago",
  description: "Quem está cruzando o Brasil a pé, de bicicleta, de van ou de carona — e como patrocinar. O patrocínio passa pela JobPago e 85% vão para o viajante.",
};

export default async function ExpedicoesPage() {
  const pool = await garantirTabelasExpedicoes();
  const lista = pool ? (await pool.query(`SELECT e.slug, e.nome, e.origem, e.destino, e.modo, e.tema, split_part(u.nome, ' ', 1) viajante
    FROM expedicoes e JOIN usuarios u ON u.id = e.usuario_id WHERE e.status = 'publicada' ORDER BY e.atualizado_em DESC`)).rows : [];
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Expedições</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Quem está na estrada agora</h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl">Viajantes cruzando o Brasil — e como a sua empresa pode patrocinar. O patrocínio passa pela JobPago e 85% vão direto para o viajante.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link href="/expedicao" className="glass-panel rounded-3xl p-6 border border-amber-400/40 hover:border-amber-400">
            <p className="text-xs font-mono font-bold text-amber-400">Nº 01 · JobPago</p>
            <p className="mt-2 text-xl font-black">Travessia de reconhecimento</p>
            <p className="mt-1 text-sm text-slate-300">Paraty → Fortaleza, pelo litoral · saída em 15 de outubro</p>
          </Link>
          {lista.map((e) => (
            <Link key={e.slug} href={`/expedicoes/${e.slug}`} className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-amber-400/60">
              <p className="text-xs font-mono font-bold text-amber-400">{nomeModo(e.modo)} · por {e.viajante}</p>
              <p className="mt-2 text-xl font-black">{e.nome}</p>
              <p className="mt-1 text-sm text-slate-300">{e.origem} → {e.destino}</p>
              {e.tema && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{e.tema}</p>}
            </Link>
          ))}
        </div>
        <div className="mt-12 glass-panel rounded-3xl p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-lg font-black">Está viajando? Crie a sua expedição e a gente procura patrocínio.</p>
          <Link href="/viajante/expedicao" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black whitespace-nowrap">Criar minha expedição</Link>
        </div>
      </main>
    </div>
  );
}
