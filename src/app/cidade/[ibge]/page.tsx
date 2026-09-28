import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CidadeTopo from "../CidadeTopo";
import { relatorioCidade, SETORES, nomeSetor, competencia } from "@/lib/relatorioCidade";

export const revalidate = 86400;

const WHATS = "5524993326966";
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const n = (v: number | null | undefined) => (v == null ? "—" : nf.format(v));
const dataBR = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};
const zap = (texto: string) => `https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`;

type Props = { params: Promise<{ ibge: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ibge } = await params;
  const r = await relatorioCidade(ibge);
  if (!r) return { title: "Cidade não encontrada · JobPago" };
  const nome = `${r.municipio.municipio_nome} (${r.municipio.uf})`;
  const novas = r.negocios_total?.novas_90d;
  return {
    title: `${nome}: ${novas != null ? `${nf.format(novas)} negócios abertos em 90 dias` : "negócios e renda"} · JobPago`,
    description: `Relatório grátis de ${nome}: quem está abrindo negócio por setor, quanto se paga para começar em cada área e compras da prefeitura abertas. Dados da Receita Federal, CAGED e PNCP.`,
    alternates: { canonical: `https://jobpago.com.br/cidade/${ibge}` },
  };
}

export default async function RelatorioCidadePage({ params }: Props) {
  const { ibge } = await params;
  const r = await relatorioCidade(ibge);
  if (!r) notFound();

  const { municipio: m, negocios_total: tot, emprego: emp } = r;
  const cidade = m.municipio_nome;
  const categorias = r.categorias.filter((c) => (c.novas_12m ?? 0) > 0).slice(0, 9);
  const maxNovas = Math.max(1, ...categorias.map((c) => c.novas_90d ?? 0));
  const setores = (emp?.setores ?? []).filter((s) => s.salario_medio_adm).slice(0, 8);

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          Relatório da cidade · {m.uf}
        </p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">{cidade}</h1>

        {/* NÚMEROS DE ABERTURA */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Resumo">
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-5xl font-black text-amber-400 tabular-nums">{n(tot?.novas_90d)}</p>
            <p className="mt-2 text-sm text-slate-300">negócios abertos nos últimos 90 dias</p>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-5xl font-black text-white tabular-nums">{emp?.salario_medio_adm ? brl.format(emp.salario_medio_adm) : "—"}</p>
            <p className="mt-2 text-sm text-slate-300">salário médio de quem foi contratado nos últimos 12 meses</p>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-5xl font-black text-white tabular-nums">{n(r.compras_abertas)}</p>
            <p className="mt-2 text-sm text-slate-300">compras públicas abertas na cidade agora</p>
          </div>
        </section>
        {tot && (
          <p className="mt-4 text-sm text-slate-400">
            {n(tot.novas_12m)} negócios abertos em 12 meses · {n(tot.ativas)} empresas ativas
            {m.populacao ? ` · ${n(m.populacao)} habitantes` : ""}
          </p>
        )}

        {/* QUEM ESTÁ ABRINDO */}
        {categorias.length > 0 && (
          <section className="mt-16" aria-labelledby="abrindo">
            <h2 id="abrindo" className="text-2xl sm:text-3xl font-black">Quem está abrindo negócio em {cidade}</h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              Empresas novas por setor nos últimos 90 dias. Todo negócio novo precisa aparecer — e é aí que entra quem faz a tarefa.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((c) => (
                <article key={c.categoria} className="glass-panel rounded-3xl p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-white">{nomeSetor(c.categoria)}</h3>
                    <span className="text-2xl font-black text-amber-400 tabular-nums">{n(c.novas_90d)}</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/10" aria-hidden>
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(4, ((c.novas_90d ?? 0) / maxNovas) * 100)}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{n(c.novas_12m)} em 12 meses · {n(c.ativas)} ativos</p>
                  {SETORES[c.categoria] && (
                    <p className="mt-2 text-sm text-slate-300">
                      <span className="text-slate-400">Costuma precisar de:</span> {SETORES[c.categoria].tarefas}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* QUANTO SE PAGA */}
        {emp && setores.length > 0 && (
          <section className="mt-16" aria-labelledby="renda">
            <h2 id="renda" className="text-2xl sm:text-3xl font-black">Quanto se paga para começar em {cidade}</h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              Salário médio de admissão com carteira assinada, por setor, de {competencia(emp.de)} a {competencia(emp.ate)}.
              É o piso real da cidade — não promessa de renda fácil.
            </p>
            <div className="mt-6 overflow-x-auto glass-panel rounded-3xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-4">Setor</th>
                    <th className="px-5 py-4 text-right">Contratações</th>
                    <th className="px-5 py-4 text-right">Saldo</th>
                    <th className="px-5 py-4 text-right">Salário de entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {setores.map((s) => (
                    <tr key={s.secao} className="border-t border-white/5">
                      <td className="px-5 py-3 font-bold text-white">{s.setor}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{n(s.admissoes)}</td>
                      <td className={`px-5 py-3 text-right tabular-nums ${s.saldo >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {s.saldo > 0 ? "+" : ""}{n(s.saldo)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-bold text-amber-300">
                        {s.salario_medio_adm ? brl.format(s.salario_medio_adm) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {n(emp.admissoes)} contratações e {n(emp.desligamentos)} desligamentos no período (saldo {emp.saldo > 0 ? "+" : ""}{n(emp.saldo)}).
            </p>
          </section>
        )}

        {/* COMPRAS PÚBLICAS */}
        {r.compras_pequenas.length > 0 && (
          <section className="mt-16" aria-labelledby="compras">
            <h2 id="compras" className="text-2xl sm:text-3xl font-black">A prefeitura e os órgãos da cidade estão comprando</h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              Compras abertas de até R$ 300 mil — o tamanho que um pequeno negócio consegue atender.
            </p>
            <ul className="mt-6 grid gap-3">
              {r.compras_pequenas.map((c, i) => (
                <li key={i} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-white font-bold line-clamp-2">{c.objeto}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.orgao_nome} · até {dataBR(c.data_encerramento)}
                      {c.modalidade_nome ? ` · ${c.modalidade_nome}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-lg font-black text-amber-300 tabular-nums">{brl.format(c.valor_estimado)}</span>
                    {c.url_pncp && (
                      <a href={c.url_pncp} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-300 underline hover:text-amber-400">
                        Ver edital
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* DOIS CAMINHOS */}
        <section className="mt-16 grid gap-4 sm:grid-cols-2" aria-label="Próximo passo">
          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Tenho um negócio</p>
            <h2 className="mt-2 text-2xl font-black">Mais clientes em {cidade}</h2>
            <p className="mt-2 text-slate-300">Cadastre o negócio, ganhe o selo de estabelecimento verificado e encontre quem faça as tarefas digitais.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/cadastrar-servico?tipo=contratante" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">Cadastrar meu negócio</Link>
              <a href={zap(`Tenho um negócio em ${cidade} (${m.uf}) e quero mais clientes.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Quero renda</p>
            <h2 className="mt-2 text-2xl font-black">Trabalho de verdade, pago por Pix</h2>
            <p className="mt-2 text-slate-300">Os negócios que abriram aqui precisam de gente. Diga o que você sabe fazer e de onde você trabalha.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/cadastrar-servico" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">Quero fazer tarefas</Link>
              <a href={zap(`Quero renda. Estou em ${cidade} (${m.uf}) ou atendo a cidade.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-slate-400 space-y-1">
          <p>
            Fontes: Receita Federal (cadastro de CNPJ{tot?.atualizado_em ? `, atualizado em ${dataBR(tot.atualizado_em)}` : ""}),
            Novo CAGED / Ministério do Trabalho{emp ? ` (${competencia(emp.de)} a ${competencia(emp.ate)})` : ""} e
            Portal Nacional de Contratações Públicas. Dados públicos, sem informação pessoal.
          </p>
          <p><Link href="/cidade" className="underline hover:text-amber-400">Ver outra cidade</Link></p>
        </footer>
      </main>
    </div>
  );
}
