import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormPatrocinio from "./FormPatrocinio";
import Compartilhar from "@/components/Compartilhar";
import { garantirTabelasExpedicoes, nomeModo, ATRASO_DIARIO_HORAS } from "@/lib/expedicoes";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export const dynamic = "force-dynamic";
const nf = new Intl.NumberFormat("pt-BR");
const MESES = {
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

async function carrega(slug: string) {
  const pool = await garantirTabelasExpedicoes();
  if (!pool) return null;
  const { rows } = await pool.query(`SELECT e.*, split_part(u.nome, ' ', 1) viajante FROM expedicoes e JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.slug = $1 AND e.status = 'publicada'`, [slug]);
  if (!rows[0]) return null;
  // diário com atraso: nada do que foi escrito nas últimas 24 h aparece (nunca a posição atual)
  const diario = (await pool.query(`SELECT cidade, uf, texto, link, to_char(criado_em, 'DD/MM/YYYY') dia FROM expedicao_diario
    WHERE expedicao_id = $1 AND criado_em < now() - make_interval(hours => $2) ORDER BY criado_em DESC LIMIT 60`, [rows[0].id, ATRASO_DIARIO_HORAS])).rows;
  return { e: rows[0], diario };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = await idiomaServidor();
  const d = await carrega(slug);
  if (!d) return { title: L(i, "Expedição", "Expedición", "Expedition") + " · JobPago" };
  return { title: `${d.e.nome} · ${L(i, "expedição de", "expedición de", "expedition by")} ${d.e.viajante} · JobPago`, description: `${d.e.origem} → ${d.e.destino}, ${nomeModo(d.e.modo, i).toLowerCase()}. ${d.e.tema ?? ""}`.slice(0, 160) };
}

export default async function ExpedicaoViajantePublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const d = await carrega(slug);
  if (!d) notFound();
  const { e, diario } = d;
  const [ano, mes] = (e.mes_inicio || "").split("-");
  const redes = (e.redes || []) as { rede: string; url: string; seguidores: number }[];
  const alcance = redes.reduce((a, r) => a + (r.seguidores || 0), 0);

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{t("Expedição de", "Expedición de", "Expedition by")} {e.viajante} · {nomeModo(e.modo, i)}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{e.nome}</h1>
        <p className="mt-4 text-lg text-slate-300">{e.origem} → {e.destino}{mes ? ` · ${t("saída em", "salida en", "leaving")} ${MESES[i][Number(mes) - 1]}${i === "en" ? "" : " de"} ${ano}` : ""}{e.veiculo ? ` · ${e.veiculo}` : ""}</p>
        {e.tema && <p className="mt-4 text-slate-300 whitespace-pre-line">{e.tema}</p>}

        {e.mostrar_roteiro && e.paradas?.length > 0 && (
          <section className="mt-10"><h2 className="text-xl font-black">{t("Roteiro planejado", "Ruta planeada", "Planned route")}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {[e.origem, ...e.paradas, e.destino].map((c: string, k: number) => <span key={k} className="rounded-xl border border-white/10 px-3 py-1.5">{c}</span>)}
            </div>
          </section>
        )}

        {redes.length > 0 && (
          <section className="mt-10"><h2 className="text-xl font-black">{t("Onde acompanhar", "Dónde seguirla", "Where to follow")}</h2>
            <ul className="mt-3 space-y-2 text-sm">{redes.map((r) => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">{r.rede}</a>
                {r.seguidores ? <span className="text-slate-400"> · {nf.format(r.seguidores)} {t("seguidores", "seguidores", "followers")}</span> : null}</li>))}</ul>
            {alcance > 0 && <p className="mt-2 text-xs text-slate-500">{t("Números de seguidores informados pelo viajante.", "Número de seguidores informado por el viajero.", "Follower counts as reported by the traveller.")}</p>}
          </section>
        )}

        <section className="mt-10"><h2 className="text-xl font-black">{t("Diário", "Diario", "Diary")}</h2>
          {diario.length === 0 ? <p className="mt-2 text-sm text-slate-400">{t("As primeiras notícias aparecem aqui — sempre com pelo menos um dia de atraso, pela segurança de quem está na estrada.", "Las primeras novedades aparecen acá, siempre con al menos un día de atraso, por la seguridad de quien está en la ruta.", "The first updates appear here — always at least a day late, for the safety of whoever is on the road.")}</p> : (
            <ol className="mt-4 space-y-4">{diario.map((p, k) => (
              <li key={k} className="glass-panel rounded-2xl p-5">
                <p className="text-xs font-mono text-amber-300">{p.dia}{p.cidade ? ` · ${p.cidade}${p.uf ? `/${p.uf}` : ""}` : ""}</p>
                <p className="mt-2 text-sm text-slate-200 whitespace-pre-line">{p.texto}</p>
                {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline text-slate-400">{t("ver post", "ver post", "see post")}</a>}
              </li>))}</ol>)}
        </section>

        <Compartilhar card={`/card/viajante/${e.slug}`} titulo={`${e.nome}: ${t("expedição de", "expedición de", "expedition by")} ${e.viajante}`} link={`https://jobpago.com.br/expedicoes/${e.slug}`} />

        <section className="mt-12 glass-panel rounded-3xl p-6 sm:p-8" aria-labelledby="patrocinar">
          <h2 id="patrocinar" className="text-2xl font-black">{t("Patrocinar esta expedição", "Patrocinar esta expedición", "Sponsor this expedition")}</h2>
          <p className="mt-2 text-sm text-slate-300">
            {t("O patrocínio passa pela JobPago: sua empresa paga a JobPago e", "El patrocinio pasa por JobPago: tu empresa le paga a JobPago y", "Sponsorship goes through JobPago: your company pays JobPago and")}{" "}
            <strong className="text-white">{t(`85% vão para ${e.viajante}`, `el 85% va a ${e.viajante}`, `85% goes to ${e.viajante}`)}</strong>.{" "}
            {t("A contrapartida (menção, vídeo, logo, visita) é combinada com contrato simples antes do pagamento.", "La contrapartida (mención, video, logo, visita) se acuerda con un contrato simple antes del pago.", "What you get in return (mention, video, logo, visit) is agreed in a simple contract before payment.")}
          </p>
          <FormPatrocinio slug={e.slug} />
        </section>
        <p className="mt-8 text-xs text-slate-500">{t(`Por segurança, esta página nunca mostra onde ${e.viajante} está agora.`, `Por seguridad, esta página nunca muestra dónde está ${e.viajante} ahora.`, `For safety, this page never shows where ${e.viajante} is right now.`)} <Link href="/expedicoes" className="underline">{t("Outras expedições", "Otras expediciones", "Other expeditions")}</Link></p>
      </main>
    </div>
  );
}
