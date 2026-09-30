import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "./CidadeTopo";
import BuscaCidade from "./BuscaCidade";
import { CIDADES_DESTAQUE } from "@/lib/relatorioCidade";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Relatório da sua cidade: negócios abrindo e valores de referência · JobPago · renda na viagem", "Informe de tu ciudad: negocios que abren y valores de referencia · JobPago · ingresos en el viaje", "Your town report: new businesses and reference rates · JobPago · income on the go"),
    description: L(i,
      "Grátis, com dado oficial: empresas abertas por setor nos últimos 90 dias (Receita Federal), salário de quem começa em cada setor (Novo CAGED) e compras da prefeitura abertas para pequeno negócio.",
      "Gratis y con datos oficiales: empresas abiertas por sector en los últimos 90 días, sueldo de ingreso por sector y compras públicas abiertas.",
      "Free, with official data: businesses opened by sector in the last 90 days, starting salaries by sector and open public purchases."),
    alternates: { canonical: "https://jobpago.com.br/cidade" },
  };
}

export default async function CidadesPage() {
  const i = await idiomaServidor();
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{L(i, "Relatório da cidade · grátis", "Informe de la ciudad · gratis", "Town report · free")}</p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl">
          {L(i, "Quem está abrindo negócio na sua cidade — e os valores de referência de cada setor.", "Quién abre negocios en tu ciudad y los valores de referencia de cada sector.", "Who is opening businesses in your town — and reference rates for each sector.")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          {L(i,
            "Números oficiais, não promessa: Receita Federal, Novo CAGED do Ministério do Trabalho e o Portal Nacional de Contratações Públicas. Atualizados todo mês.",
            "Datos oficiales, no promesas: Receita Federal, Novo CAGED del Ministerio de Trabajo y el Portal Nacional de Contrataciones Públicas de Brasil. Actualizados cada mes.",
            "Official figures, not promises: Brazil's Receita Federal, the Labour Ministry's Novo CAGED and the National Public Procurement Portal. Updated every month.")}
        </p>
        <div className="mt-10">
          <BuscaCidade />
        </div>
        <section className="mt-14" aria-labelledby="destaques">
          <h2 id="destaques" className="text-sm font-bold uppercase tracking-wider text-slate-400">{L(i, "Ou comece por uma destas", "O empezá por una de estas", "Or start with one of these")}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {CIDADES_DESTAQUE.map((c) => (
              <Link key={c.ibge} href={`/cidade/${c.ibge}`} className="btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold">
                {c.nome} <span className="text-slate-400 font-normal">· {c.uf}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
