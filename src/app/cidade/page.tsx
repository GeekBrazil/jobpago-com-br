import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "./CidadeTopo";
import BuscaCidade from "./BuscaCidade";
import { CIDADES_DESTAQUE } from "@/lib/relatorioCidade";

export const metadata: Metadata = {
  title: "Relatório da sua cidade: quem está abrindo negócio e quanto se paga · JobPago",
  description:
    "Grátis, com dado oficial: empresas abertas por setor nos últimos 90 dias (Receita Federal), salário de quem começa em cada setor (Novo CAGED) e compras da prefeitura abertas para pequeno negócio.",
  alternates: { canonical: "https://jobpago.com.br/cidade" },
};

export default function CidadesPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Relatório da cidade · grátis</p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl">
          Quem está abrindo negócio na sua cidade — e quanto se paga para começar.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          Números oficiais, não promessa: Receita Federal, Novo CAGED do Ministério do Trabalho e o Portal Nacional de
          Contratações Públicas. Atualizados todo mês.
        </p>
        <div className="mt-10">
          <BuscaCidade />
        </div>
        <section className="mt-14" aria-labelledby="destaques">
          <h2 id="destaques" className="text-sm font-bold uppercase tracking-wider text-slate-400">Ou comece por uma destas</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {CIDADES_DESTAQUE.map((c) => (
              <Link
                key={c.ibge}
                href={`/cidade/${c.ibge}`}
                className="btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold"
              >
                {c.nome} <span className="text-slate-400 font-normal">· {c.uf}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
