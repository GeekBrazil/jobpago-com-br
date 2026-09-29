import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CidadeTopo from "../CidadeTopo";
import { relatorioCidade, SETORES, nomeSetor } from "@/lib/relatorioCidade";
import Compartilhar from "@/components/Compartilhar";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import { tSetor, tTarefas, tSecao, competenciaEm } from "@/lib/traducoesCadastro";

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
  const i = await idiomaServidor();
  const r = await relatorioCidade(ibge);
  if (!r) return { title: L(i, "Cidade não encontrada", "Ciudad no encontrada", "Town not found") + " · JobPago" };
  const nome = `${r.municipio.municipio_nome} (${r.municipio.uf})`;
  const novas = r.negocios_total?.novas_90d;
  return {
    title: `${nome}: ${novas != null ? `${nf.format(novas)} ${L(i, "negócios abertos em 90 dias", "negocios abiertos en 90 días", "businesses opened in 90 days")}` : L(i, "negócios e renda", "negocios e ingresos", "business and income")} · JobPago`,
    description: L(i,
      `Relatório grátis de ${nome}: quem está abrindo negócio por setor, quanto se paga para começar em cada área e compras da prefeitura abertas. Dados da Receita Federal, CAGED e PNCP.`,
      `Informe gratis de ${nome}: quién abre negocios por sector, cuánto se paga al empezar en cada área y compras públicas abiertas. Datos oficiales de Brasil.`,
      `Free report for ${nome}: who is opening businesses by sector, what each field pays to start, and open public purchases. Official Brazilian data.`),
    alternates: { canonical: `https://jobpago.com.br/cidade/${ibge}` },
  };
}

export default async function RelatorioCidadePage({ params }: Props) {
  const { ibge } = await params;
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const comp = (c: number) => competenciaEm(i, c);
  const r = await relatorioCidade(ibge);
  if (!r) notFound();

  const { municipio: m, negocios_total: tot, emprego: emp } = r;
  const cidade = m.municipio_nome;
  // todos os setores com empresa ativa: o link "#setor-{categoria}" do e-mail cai no card certo
  const categorias = r.categorias.filter((c) => (c.ativas ?? 0) > 0);
  const maxNovas = Math.max(1, ...categorias.map((c) => c.novas_90d ?? 0));
  const setores = (emp?.setores ?? []).filter((s) => s.salario_medio_adm).slice(0, 8);

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          {t("Relatório da cidade", "Informe de la ciudad", "Town report")} · {m.uf}
        </p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">{cidade}</h1>

        {/* NÚMEROS DE ABERTURA */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label={t("Resumo", "Resumen", "Summary")}>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-5xl font-black text-amber-400 tabular-nums">{n(tot?.novas_90d)}</p>
            <p className="mt-2 text-sm text-slate-300">{t("negócios abertos nos últimos 90 dias", "negocios abiertos en los últimos 90 días", "businesses opened in the last 90 days")}</p>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-5xl font-black text-white tabular-nums">{emp?.salario_medio_adm ? brl.format(emp.salario_medio_adm) : "—"}</p>
            <p className="mt-2 text-sm text-slate-300">{t("salário médio de quem foi contratado nos últimos 12 meses", "sueldo medio de quienes fueron contratados en los últimos 12 meses", "average salary of people hired in the last 12 months")}</p>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-5xl font-black text-white tabular-nums">{n(r.compras_abertas)}</p>
            <p className="mt-2 text-sm text-slate-300">{t("compras públicas abertas na cidade agora", "compras públicas abiertas en la ciudad ahora", "public purchases open in town right now")}</p>
          </div>
        </section>
        {tot && (
          <p className="mt-4 text-sm text-slate-400">
            {n(tot.novas_12m)} {t("negócios abertos em 12 meses", "negocios abiertos en 12 meses", "businesses opened in 12 months")} · {n(tot.ativas)} {t("empresas ativas", "empresas activas", "active businesses")}
            {m.populacao ? ` · ${n(m.populacao)} ${t("habitantes", "habitantes", "inhabitants")}` : ""}
          </p>
        )}

        {/* QUEM ESTÁ ABRINDO */}
        {categorias.length > 0 && (
          <section className="mt-16" aria-labelledby="abrindo">
            <h2 id="abrindo" className="text-2xl sm:text-3xl font-black">{t("Quem está abrindo negócio em", "Quién está abriendo negocios en", "Who is opening businesses in")} {cidade}</h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              {t("Empresas novas por setor nos últimos 90 dias. Todo negócio novo precisa aparecer — e é aí que entra quem faz a tarefa.",
                "Empresas nuevas por sector en los últimos 90 días. Todo negocio nuevo necesita hacerse ver, y ahí entra quien hace la tarea.",
                "New businesses by sector in the last 90 days. Every new business needs to be seen — that's where the people who do the tasks come in.")}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((c) => (
                <article key={c.categoria} id={`setor-${c.categoria}`} className="glass-panel rounded-3xl p-5 scroll-mt-24 target:ring-2 target:ring-amber-400">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-white">{tSetor(i, c.categoria, nomeSetor(c.categoria))}</h3>
                    <span className="text-2xl font-black text-amber-400 tabular-nums">{n(c.novas_90d)}</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/10" aria-hidden>
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(4, ((c.novas_90d ?? 0) / maxNovas) * 100)}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{n(c.novas_12m)} {t("em 12 meses", "en 12 meses", "in 12 months")} · {n(c.ativas)} {t("ativos", "activos", "active")}</p>
                  {SETORES[c.categoria] && (
                    <p className="mt-2 text-sm text-slate-300">
                      <span className="text-slate-400">{t("Costuma precisar de:", "Suele necesitar:", "Usually needs:")}</span> {tTarefas(i, c.categoria, SETORES[c.categoria].tarefas)}
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
            <h2 id="renda" className="text-2xl sm:text-3xl font-black">{t("Quanto se paga para começar em", "Cuánto se paga al empezar en", "What it pays to start in")} {cidade}</h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              {t("Salário médio de admissão com carteira assinada, por setor, de", "Sueldo medio de ingreso con empleo formal, por sector, de", "Average starting salary in formal jobs, by sector, from")} {comp(emp.de)} {t("a", "a", "to")} {comp(emp.ate)}.{" "}
              {t("É o piso real da cidade — não promessa de renda fácil.", "Es el piso real de la ciudad, no una promesa de plata fácil.", "It's the town's real floor — not a promise of easy money.")}
            </p>
            <div className="mt-6 overflow-x-auto glass-panel rounded-3xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-4">{t("Setor", "Sector", "Sector")}</th>
                    <th className="px-5 py-4 text-right">{t("Contratações", "Contrataciones", "Hires")}</th>
                    <th className="px-5 py-4 text-right">{t("Saldo", "Saldo", "Net")}</th>
                    <th className="px-5 py-4 text-right">{t("Salário de entrada", "Sueldo de ingreso", "Starting salary")}</th>
                  </tr>
                </thead>
                <tbody>
                  {setores.map((s) => (
                    <tr key={s.secao} className="border-t border-white/5">
                      <td className="px-5 py-3 font-bold text-white">{tSecao(i, s.secao, s.setor)}</td>
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
              {n(emp.admissoes)} {t("contratações e", "contrataciones y", "hires and")} {n(emp.desligamentos)} {t("desligamentos no período", "bajas en el período", "departures in the period")} ({t("saldo", "saldo", "net")} {emp.saldo > 0 ? "+" : ""}{n(emp.saldo)}).
            </p>
          </section>
        )}

        {/* COMPRAS PÚBLICAS — o detalhe é pago (allancandido.com); aqui só a pergunta e o tamanho */}
        {r.compras_abertas > 0 && (
          <section className="mt-16" aria-labelledby="compras">
            <h2 id="compras" className="text-2xl sm:text-3xl font-black">
              {t(`Você sabia o que a prefeitura de ${cidade} está comprando agora?`, `¿Sabías qué está comprando ahora la municipalidad de ${cidade}?`, `Do you know what ${cidade}'s town hall is buying right now?`)}
            </h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              {t("Há", "Hay", "There are")} <strong className="text-white">{n(r.compras_abertas)} {t("compras públicas abertas", "compras públicas abiertas", "open public purchases")}</strong> {t("na cidade", "en la ciudad", "in town")}
              {r.compras_pequenas.length > 0 ? <>, {t("incluindo compras de até R$ 300 mil — tamanho que um pequeno negócio consegue atender", "incluidas compras de hasta R$ 300 mil, tamaño que un negocio chico puede atender", "including purchases of up to R$ 300k — a size a small business can handle")}</> : null}.{" "}
              {t("Quem sabe primeiro, vende primeiro.", "Quien se entera primero, vende primero.", "Whoever knows first, sells first.")}
            </p>
            <div className="mt-6 relative glass-panel rounded-3xl p-5 overflow-hidden" aria-hidden>
              {[0, 1, 2].map((k) => (
                <div key={k} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 blur-[3px] select-none">
                  <div className="space-y-2 w-2/3">
                    <div className="h-3 rounded bg-white/20 w-full" />
                    <div className="h-2.5 rounded bg-white/10 w-1/2" />
                  </div>
                  <div className="h-5 w-24 rounded bg-amber-400/40" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`https://allancandido.com/compras-publicas?cidade=${ibge}&utm_source=jobpago&utm_medium=cidade&utm_campaign=compras`}
                className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black"
              >
                {t("Ver o relatório de compras", "Ver el informe de compras", "See the purchases report")}
              </a>
              <a
                href={`https://allancandido.com/insights/${ibge}?utm_source=jobpago&utm_medium=cidade&utm_campaign=raiox`}
                className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold"
              >
                {t("Raio-X da cidade", "Radiografía de la ciudad", "Town X-ray")}
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {t("Objeto, órgão, valor, prazo e edital de cada compra, com aviso por e-mail: R$ 79,90 por ano no Allan Candido — inteligência de dados públicos.",
                "Objeto, organismo, valor, plazo y pliego de cada compra, con aviso por e-mail: R$ 79,90 por año en Allan Candido (sitio en portugués).",
                "What, who, value, deadline and tender document of each purchase, with e-mail alerts: R$ 79.90 a year at Allan Candido (site in Portuguese).")}
            </p>
          </section>
        )}

        {/* DOIS CAMINHOS */}
        <section className="mt-16 grid gap-4 sm:grid-cols-2" aria-label={t("Próximo passo", "Próximo paso", "Next step")}>
          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{t("Tenho um negócio", "Tengo un negocio", "I have a business")}</p>
            <h2 className="mt-2 text-2xl font-black">{t("Mais clientes em", "Más clientes en", "More customers in")} {cidade}</h2>
            <p className="mt-2 text-slate-300">{t("Cadastre o negócio, ganhe o selo de estabelecimento verificado e encontre quem faça as tarefas digitais.", "Registrá tu negocio, ganá el sello de establecimiento verificado y encontrá quién haga las tareas digitales.", "Register your business, earn the verified seal and find people to do the digital tasks.")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/cadastrar-servico?tipo=contratante" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{t("Cadastrar meu negócio", "Registrar mi negocio", "Register my business")}</Link>
              <a href={zap(`Tenho um negócio em ${cidade} (${m.uf}) e quero mais clientes.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-7">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{t("Quero renda", "Quiero ingresos", "I want income")}</p>
            <h2 className="mt-2 text-2xl font-black">{t("Trabalho de verdade, pago por Pix", "Trabajo de verdad, pagado por Pix", "Real work, paid by Pix")}</h2>
            <p className="mt-2 text-slate-300">{t("Os negócios que abriram aqui precisam de gente. Diga o que você sabe fazer e de onde você trabalha.", "Los negocios que abrieron acá necesitan gente. Contá qué sabés hacer y desde dónde trabajás.", "The businesses opening here need people. Tell us what you can do and where you work from.")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/disponibilidade" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{t("Cadastrar minha disponibilidade", "Registrar mi disponibilidad", "Register my availability")}</Link>
              <a href={zap(`Quero renda. Estou em ${cidade} (${m.uf}) ou atendo a cidade.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <Compartilhar card={`/card/cidade/${ibge}`} titulo={`${cidade}: ${t("quem está abrindo negócio", "quién abre negocios", "who is opening businesses")}`} link={`https://jobpago.com.br/cidade/${ibge}`} />

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-slate-400 space-y-1">
          <p>
            {t("Fontes: Receita Federal (cadastro de CNPJ", "Fuentes: Receita Federal (registro de empresas", "Sources: Receita Federal (company register")}{tot?.atualizado_em ? `, ${t("atualizado em", "actualizado el", "updated")} ${dataBR(tot.atualizado_em)}` : ""}),{" "}
            {t("Novo CAGED / Ministério do Trabalho", "Novo CAGED / Ministerio de Trabajo", "Novo CAGED / Ministry of Labour")}{emp ? ` (${comp(emp.de)} ${t("a", "a", "to")} ${comp(emp.ate)})` : ""} {t("e", "y", "and")}{" "}
            {t("Portal Nacional de Contratações Públicas. Dados públicos, sem informação pessoal.", "Portal Nacional de Contrataciones Públicas. Datos públicos, sin información personal.", "National Public Procurement Portal. Public data, no personal information.")}
          </p>
          <p><Link href="/cidade" className="underline hover:text-amber-400">{t("Ver outra cidade", "Ver otra ciudad", "See another town")}</Link></p>
        </footer>
      </main>
    </div>
  );
}
