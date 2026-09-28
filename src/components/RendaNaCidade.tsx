"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* "Quanto se ganha de verdade fazendo X na sua cidade?" — número oficial
   (salário médio de admissão do Novo CAGED, 12 meses) no lugar de promessa. */

interface Setor { secao: string; setor: string; salario: number; admissoes: number }
interface Dados { ibge: string; cidade: string; uf: string; de: number; ate: number; media: number | null; setores: Setor[] }
interface Opcao { ibge: string; nome: string; uf: string }

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const comp = (c: number) => `${MESES[(c % 100) - 1]}/${Math.floor(c / 100)}`;

export default function RendaNaCidade({ ibgeInicial = "3303807" }: { ibgeInicial?: string }) {
  const [ibge, setIbge] = useState(ibgeInicial);
  const [dados, setDados] = useState<Dados | null>(null);
  const [secao, setSecao] = useState("");
  const [busca, setBusca] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    setErro(false);
    fetch(`/api/renda?ibge=${ibge}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Dados) => {
        if (!vivo) return;
        setDados(d);
        setSecao((atual) => (d.setores.some((s) => s.secao === atual) ? atual : d.setores[0]?.secao ?? ""));
      })
      .catch(() => vivo && setErro(true));
    return () => { vivo = false; };
  }, [ibge]);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) { setOpcoes([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/cidades?q=${encodeURIComponent(termo)}`).then((r) => (r.ok ? r.json() : [])).then(setOpcoes).catch(() => setOpcoes([]));
    }, 250);
    return () => clearTimeout(t);
  }, [busca]);

  const setor = dados?.setores.find((s) => s.secao === secao);

  return (
    <section id="renda-na-cidade" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="renda-titulo">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-10">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Número oficial, não promessa</p>
        <h2 id="renda-titulo" className="mt-3 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Quanto se ganha de verdade fazendo{" "}
          <label className="sr-only" htmlFor="renda-setor">Setor</label>
          <select
            id="renda-setor"
            value={secao}
            onChange={(e) => setSecao(e.target.value)}
            className="block sm:inline w-full sm:w-auto my-1 bg-transparent border-b-2 border-amber-400 text-amber-300 font-black focus:outline-none text-lg sm:text-5xl pr-6"
          >
            {(dados?.setores ?? []).map((s) => (
              <option key={s.secao} value={s.secao} className="bg-slate-900 text-base">{s.setor.toLowerCase()}</option>
            ))}
          </select>{" "}
          em {dados ? dados.cidade : "…"}?
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] items-start">
          <div aria-live="polite">
            {erro && <p className="text-slate-300">Ainda não temos esse número para essa cidade. Tente uma cidade vizinha.</p>}
            {setor && dados && (
              <>
                <p className="text-6xl sm:text-7xl font-black text-white tabular-nums">{brl.format(setor.salario)}</p>
                <p className="mt-3 text-slate-300">
                  salário médio de entrada em <strong className="text-white">{setor.setor.toLowerCase()}</strong> em {dados.cidade},
                  com base em {nf.format(setor.admissoes)} contratações de {comp(dados.de)} a {comp(dados.ate)}.
                  {dados.media ? <> Média da cidade, todos os setores: {brl.format(dados.media)}.</> : null}
                </p>
                <p className="mt-3 text-xs text-slate-400">Fonte: Novo CAGED, Ministério do Trabalho (carteira assinada). Quem cobra por tarefa usa esse número como piso para não trabalhar de graça.</p>
              </>
            )}
          </div>
          <div>
            <label htmlFor="renda-cidade" className="block text-sm font-bold text-slate-300 mb-2">Trocar de cidade</label>
            <input
              id="renda-cidade"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite sua cidade"
              autoComplete="off"
              className="w-full rounded-2xl bg-slate-900/80 border border-white/15 px-5 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            {opcoes.length > 0 && (
              <ul className="mt-2 rounded-2xl bg-slate-900/95 border border-white/10 overflow-hidden">
                {opcoes.map((o) => (
                  <li key={o.ibge}>
                    <button
                      type="button"
                      onClick={() => { setIbge(o.ibge); setBusca(""); setOpcoes([]); }}
                      className="w-full text-left px-5 py-3 text-sm text-slate-100 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      {o.nome} <span className="text-slate-400">· {o.uf}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {dados && (
              <Link href={`/cidade/${dados.ibge}`} className="mt-5 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">
                Relatório completo de {dados.cidade}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
