"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Opcao { ibge: string; nome: string; uf: string }

export default function BuscaCidade() {
  const [q, setQ] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const termo = q.trim();
    if (termo.length < 2) { setOpcoes([]); return; }
    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const r = await fetch(`/api/cidades?q=${encodeURIComponent(termo)}`);
        setOpcoes(r.ok ? await r.json() : []);
      } catch { setOpcoes([]); }
      setCarregando(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="w-full max-w-xl">
      <label htmlFor="busca-cidade" className="block text-sm font-bold text-slate-300 mb-2">Qual é a sua cidade?</label>
      <input
        id="busca-cidade"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Digite o nome da cidade"
        autoComplete="off"
        className="w-full rounded-2xl bg-slate-900/80 border border-white/15 px-5 py-4 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
      />
      {(opcoes.length > 0 || carregando) && (
        <ul className="mt-2 rounded-2xl bg-slate-900/95 border border-white/10 overflow-hidden" aria-live="polite">
          {carregando && opcoes.length === 0 && <li className="px-5 py-3 text-sm text-slate-400">Buscando…</li>}
          {opcoes.map((o) => (
            <li key={o.ibge}>
              <Link href={`/cidade/${o.ibge}`} className="block px-5 py-3 text-sm text-slate-100 hover:bg-amber-500/10 hover:text-amber-300">
                {o.nome} <span className="text-slate-400">· {o.uf}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
