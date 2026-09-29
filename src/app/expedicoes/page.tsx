import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "../cidade/CidadeTopo";
import { garantirTabelasExpedicoes, nomeModo } from "@/lib/expedicoes";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Expedições dos viajantes · JobPago", "Expediciones de los viajeros · JobPago", "Travellers' expeditions · JobPago"),
    description: L(i,
      "Quem está cruzando o Brasil a pé, de bicicleta, de van ou de carona — e como patrocinar. O patrocínio passa pela JobPago e 85% vão para o viajante.",
      "Quién está cruzando Brasil a pie, en bicicleta, en van o a dedo, y cómo patrocinar. El patrocinio pasa por JobPago y el 85% va al viajero.",
      "Who is crossing Brazil on foot, by bike, by van or hitchhiking — and how to sponsor. Sponsorship goes through JobPago and 85% goes to the traveller."),
  };
}

export default async function ExpedicoesPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const pool = await garantirTabelasExpedicoes();
  const lista = pool ? (await pool.query(`SELECT e.slug, e.nome, e.origem, e.destino, e.modo, e.tema, split_part(u.nome, ' ', 1) viajante
    FROM expedicoes e JOIN usuarios u ON u.id = e.usuario_id WHERE e.status = 'publicada' ORDER BY e.atualizado_em DESC`)).rows : [];
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{t("Expedições", "Expediciones", "Expeditions")}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{t("Quem está cruzando o Brasil", "Quién está cruzando Brasil", "Who is crossing Brazil")}</h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl">{t("Viajantes cruzando o Brasil — e como a sua empresa pode patrocinar. O patrocínio passa pela JobPago e 85% vão direto para o viajante.", "Viajeros cruzando Brasil, y cómo tu empresa puede patrocinar. El patrocinio pasa por JobPago y el 85% va directo al viajero.", "Travellers crossing Brazil — and how your company can sponsor them. Sponsorship goes through JobPago and 85% goes straight to the traveller.")}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link href="/expedicao" className="glass-panel rounded-3xl p-6 border border-amber-400/40 hover:border-amber-400">
            <p className="text-xs font-mono font-bold text-amber-400">Nº 01 · JobPago</p>
            <p className="mt-2 text-xl font-black">{t("Travessia de reconhecimento", "Travesía de reconocimiento", "Scouting crossing")}</p>
            <p className="mt-1 text-sm text-slate-300">{t("Paraty → Fortaleza, pelo litoral · saída em 15 de outubro", "Paraty → Fortaleza, por la costa · salida el 15 de octubre", "Paraty → Fortaleza, along the coast · leaving 15 October")}</p>
          </Link>
          {lista.map((e) => (
            <Link key={e.slug} href={`/expedicoes/${e.slug}`} className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-amber-400/60">
              <p className="text-xs font-mono font-bold text-amber-400">{nomeModo(e.modo, i)} · {t("por", "por", "by")} {e.viajante}</p>
              <p className="mt-2 text-xl font-black">{e.nome}</p>
              <p className="mt-1 text-sm text-slate-300">{e.origem} → {e.destino}</p>
              {e.tema && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{e.tema}</p>}
            </Link>
          ))}
        </div>
        <div className="mt-12 glass-panel rounded-3xl p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-lg font-black">{t("Está viajando? Crie a sua expedição e a gente procura patrocínio.", "¿Estás viajando? Creá tu expedición y buscamos patrocinio.", "Travelling? Create your expedition and we'll look for sponsors.")}</p>
          <Link href="/viajante/expedicao" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black whitespace-nowrap">{t("Criar minha expedição", "Crear mi expedición", "Create my expedition")}</Link>
        </div>
      </main>
    </div>
  );
}
