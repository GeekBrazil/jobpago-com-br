import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormPatrocinio from "./FormPatrocinio";
import Compartilhar from "@/components/Compartilhar";
import { garantirTabelasExpedicoes, nomeModo, ATRASO_DIARIO_HORAS } from "@/lib/expedicoes";

export const dynamic = "force-dynamic";
const nf = new Intl.NumberFormat("pt-BR");
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

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
  const d = await carrega(slug);
  if (!d) return { title: "Expedição · JobPago" };
  return { title: `${d.e.nome} · expedição de ${d.e.viajante} · JobPago`, description: `${d.e.origem} → ${d.e.destino}, ${nomeModo(d.e.modo).toLowerCase()}. ${d.e.tema ?? ""}`.slice(0, 160) };
}

export default async function ExpedicaoViajantePublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Expedição de {e.viajante} · {nomeModo(e.modo)}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{e.nome}</h1>
        <p className="mt-4 text-lg text-slate-300">{e.origem} → {e.destino}{mes ? ` · saída em ${MESES[Number(mes) - 1]} de ${ano}` : ""}{e.veiculo ? ` · ${e.veiculo}` : ""}</p>
        {e.tema && <p className="mt-4 text-slate-300 whitespace-pre-line">{e.tema}</p>}

        {e.mostrar_roteiro && e.paradas?.length > 0 && (
          <section className="mt-10"><h2 className="text-xl font-black">Roteiro planejado</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {[e.origem, ...e.paradas, e.destino].map((c: string, i: number) => <span key={i} className="rounded-xl border border-white/10 px-3 py-1.5">{c}</span>)}
            </div>
          </section>
        )}

        {redes.length > 0 && (
          <section className="mt-10"><h2 className="text-xl font-black">Onde acompanhar</h2>
            <ul className="mt-3 space-y-2 text-sm">{redes.map((r) => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">{r.rede}</a>
                {r.seguidores ? <span className="text-slate-400"> · {nf.format(r.seguidores)} seguidores</span> : null}</li>))}</ul>
            {alcance > 0 && <p className="mt-2 text-xs text-slate-500">Números de seguidores informados pelo viajante.</p>}
          </section>
        )}

        <section className="mt-10"><h2 className="text-xl font-black">Diário</h2>
          {diario.length === 0 ? <p className="mt-2 text-sm text-slate-400">As primeiras notícias aparecem aqui — sempre com pelo menos um dia de atraso, pela segurança de quem está na estrada.</p> : (
            <ol className="mt-4 space-y-4">{diario.map((p, i) => (
              <li key={i} className="glass-panel rounded-2xl p-5">
                <p className="text-xs font-mono text-amber-300">{p.dia}{p.cidade ? ` · ${p.cidade}${p.uf ? `/${p.uf}` : ""}` : ""}</p>
                <p className="mt-2 text-sm text-slate-200 whitespace-pre-line">{p.texto}</p>
                {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline text-slate-400">ver post</a>}
              </li>))}</ol>)}
        </section>

        <Compartilhar card={`/card/viajante/${e.slug}`} titulo={`${e.nome}: expedição de ${e.viajante}`} link={`https://jobpago.com.br/expedicoes/${e.slug}`} />

        <section className="mt-12 glass-panel rounded-3xl p-6 sm:p-8" aria-labelledby="patrocinar">
          <h2 id="patrocinar" className="text-2xl font-black">Patrocinar esta expedição</h2>
          <p className="mt-2 text-sm text-slate-300">
            O patrocínio passa pela JobPago: sua empresa paga a JobPago e <strong className="text-white">85% vão para {e.viajante}</strong>. A contrapartida (menção,
            vídeo, logo, visita) é combinada com contrato simples antes do pagamento.
          </p>
          <FormPatrocinio slug={e.slug} />
        </section>
        <p className="mt-8 text-xs text-slate-500">Por segurança, esta página nunca mostra onde {e.viajante} está agora. <Link href="/expedicoes" className="underline">Outras expedições</Link></p>
      </main>
    </div>
  );
}
