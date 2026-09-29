import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CidadeTopo from "../../cidade/CidadeTopo";
import GuardaIndicacao from "./GuardaIndicacao";
import { garantirTabelasIndicacao, codigoValido } from "@/lib/indicacao";
import { NIVEIS_HONRA } from "@/data/honra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Você foi indicado para a JobPago",
  description: "Negócios da estrada entram no mapa da Expedição JobPago com o selo de verificado. Veja como participar.",
  robots: { index: false },
};

export default async function IndicacaoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params;
  const codigo = bruto.toUpperCase();
  if (!codigoValido(codigo)) notFound();
  const pool = await garantirTabelasIndicacao();
  const r = pool ? await pool.query(`SELECT u.nome FROM indicadores i JOIN usuarios u ON u.id = i.usuario_id WHERE i.codigo = $1`, [codigo]) : null;
  const nome = r?.rows[0]?.nome?.split(" ")[0];
  if (!nome) notFound();

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <GuardaIndicacao codigo={codigo} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Indicação de {nome}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{nome} indicou o seu negócio para a JobPago</h1>
        <p className="mt-4 text-lg text-slate-300">
          A JobPago liga negócios do bairro e da estrada a quem está passando e a quem faz as tarefas do dia a dia. Na Expedição nº 01
          (Paraty → Fortaleza, saída em 15 de outubro), a gente visita e verifica os lugares da rota.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/refugio" className="glass-panel rounded-3xl p-6 border border-amber-400/40 hover:border-amber-400">
            <p className="font-black text-white text-lg">Tem onde dormir?</p>
            <p className="mt-1 text-sm text-slate-300">Camping, hostel, pousada, hotel ou pátio: peça a visita e seja um Refúgio da Estrada.</p>
          </Link>
          <Link href="/parceiros/planos" className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-amber-400/60">
            <p className="font-black text-white text-lg">Outro tipo de negócio?</p>
            <p className="mt-1 text-sm text-slate-300">Veja os planos de parceiro: selo, minisite, perfil no Google e vídeo no local.</p>
          </Link>
        </div>
        <section className="mt-10">
          <h2 className="text-xl font-black">Alta Honra</h2>
          <p className="mt-2 text-sm text-slate-300">O selo de verificado não se compra — só a visita dá o selo. A Honra mostra como o lugar apoia a expedição:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {NIVEIS_HONRA.map((n) => <li key={n.id} className="text-sm"><span className={`inline-block text-xs font-black px-2 py-0.5 rounded-full border mr-2 ${n.cor}`}>{n.nome}</span>{n.como}</li>)}
          </ul>
        </section>
        <p className="mt-10 text-xs text-slate-400">
          Transparência: {nome} recebe uma comissão se você fechar um plano de parceiro da JobPago. É assim que a gente remunera quem apresenta
          a rede — o preço para você é o mesmo.
        </p>
      </main>
    </div>
  );
}
