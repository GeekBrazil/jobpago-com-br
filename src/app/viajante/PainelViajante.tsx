"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import { TXT, CONTRIBUICOES } from "@/lib/textosEstrada";
import { RECOMPENSAS, PONTOS, pontosParaNivel } from "@/lib/reputacao";

interface Perfil {
  logado: boolean; nome?: string; pontos: number; nivel: number; titulo: string; base: number; proximo: number; progresso: number;
  confirmadas: number; pendentes: number; questionario: boolean;
  recentes: { id: number; tipo: string; status: "pendente" | "confirmada" | "recusada"; pontos: number; nome: string | null; cidade: string | null; uf: string | null; quando: string }[];
}
const nf = new Intl.NumberFormat("pt-BR");

export default function PainelViajante() {
  const [idioma, setIdioma] = useIdioma();
  const [p, setP] = useState<Perfil | null>(null);
  const [erro, setErro] = useState(false);
  const T = TXT[idioma];

  useEffect(() => {
    fetch("/api/viajante").then(async (r) => {
      if (r.status === 401) { setP({ logado: false } as Perfil); return; }
      setP(await r.json());
    }).catch(() => setErro(true));
  }, []);

  const nomeTipo = (id: string) =>
    CONTRIBUICOES.find((c) => c.id === id)?.nome[idioma] ??
    ({ questionario: T.questionario, indicacao_verificado: idioma === "es" ? "Recomendado verificado" : idioma === "en" ? "Referral verified" : "Indicado verificado",
       indicacao_pagante: idioma === "es" ? "Recomendado contrató un plan" : idioma === "en" ? "Referral bought a plan" : "Indicado fechou plano" } as Record<string, string>)[id] ?? id;

  const [comboio, setComboio] = useState<{ status: string } | null | undefined>(undefined);
  const [trecho, setTrecho] = useState("");
  useEffect(() => {
    fetch("/api/comboio").then((r) => (r.ok ? r.json() : null)).then((j) => setComboio(j?.inscrito ?? null)).catch(() => setComboio(null));
  }, []);
  async function entrarComboio() {
    const r = await fetch("/api/comboio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trecho }) });
    if (r.ok) setComboio({ status: "inscrito" });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{T.painel}</p>
        <SeletorIdioma idioma={idioma} onChange={setIdioma} />
      </div>

      {erro && <p className="mt-6 text-rose-300">Erro ao carregar. Tente de novo.</p>}
      {!p && !erro && <p className="mt-6 text-slate-400">…</p>}

      {p && !p.logado && (
        <div className="mt-8 glass-panel rounded-3xl p-7">
          <h1 className="text-3xl sm:text-4xl font-black">{idioma === "es" ? "Alimentá la ruta y subí de nivel" : idioma === "en" ? "Feed the road and level up" : "Alimente a estrada e suba de nível"}</h1>
          <p className="mt-3 text-slate-300">
            {idioma === "es" ? "Cada foto, lugar para dormir o precio que confirmás ayuda a otro viajero — y suma puntos: del Andarilho a la Leyenda de la Ruta."
              : idioma === "en" ? "Every photo, place to sleep or price you confirm helps another traveller — and earns points: from Wanderer to Legend of the Road."
              : "Cada foto, lugar para dormir ou preço que você confirma ajuda outro viajante — e vale pontos: do Andarilho à Lenda da Estrada."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/entrar?callbackUrl=/viajante" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{T.entrar}</Link>
            <Link href="/cadastrar" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">{idioma === "es" ? "Crear cuenta" : idioma === "en" ? "Create account" : "Criar conta"}</Link>
          </div>
        </div>
      )}

      {p && p.logado && (
        <>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight">{p.nome}</h1>
          <div className="mt-6 glass-panel rounded-3xl p-6">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <p className="text-4xl font-black text-amber-400 tabular-nums">{T.nivel} {p.nivel}</p>
              <p className="text-lg font-bold text-white">{p.titulo}</p>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-white/10" aria-hidden>
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(2, Math.round(p.progresso * 100))}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {nf.format(p.pontos)} {T.pontos} · {nf.format(Math.max(0, p.proximo - p.pontos))} {T.proximo}
              {p.pendentes ? ` · ${p.pendentes} ${T.pendente}` : ""}
            </p>
          </div>

          {!p.questionario && (
            <Link href="/viajante/questionario" className="mt-5 block glass-panel rounded-3xl p-6 border border-amber-400/40 hover:border-amber-400">
              <p className="font-black text-white">{T.questionario} · +{PONTOS.questionario} {T.pontos}</p>
              <p className="text-sm text-slate-300 mt-1">{idioma === "es" ? "Contanos cómo viajás y qué te cuesta más. 5 minutos." : idioma === "en" ? "Tell us how you travel and what's hardest. 5 minutes." : "Conte como você viaja e o que é mais difícil. 5 minutos."}</p>
            </Link>
          )}

          <h2 className="mt-10 text-xl font-black">{T.contribuir}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONTRIBUICOES.map((c) => (
              <Link key={c.id} href={`/viajante/contribuir?tipo=${c.id}`} className="glass-panel rounded-2xl p-5 hover:border-amber-400/60 border border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{c.nome[idioma]}</p>
                  <span className="text-xs font-mono text-amber-300">+{PONTOS[c.id]}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{c.desc[idioma]}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/viajante/indicar" className="glass-panel rounded-2xl p-5 border border-amber-400/40 hover:border-amber-400">
              <p className="font-bold text-white">{idioma === "es" ? "Recomendar y ganar" : idioma === "en" ? "Refer and earn" : "Indicar e ganhar"}</p>
              <p className="text-xs text-slate-400 mt-1">{idioma === "es" ? "50% de la primera cuota o 15% del plan anual de los negocios que recomiendes." : idioma === "en" ? "50% of the first month or 15% of the yearly plan of businesses you refer." : "50% da 1ª mensalidade ou 15% do plano anual dos negócios que você indicar."}</p>
            </Link>
            <div className="glass-panel rounded-2xl p-5 border border-white/10">
              <p className="font-bold text-white">{idioma === "es" ? "Lugar en el convoy — gratis" : idioma === "en" ? "Seat in the convoy — free" : "Vaga no comboio — gratuita"}</p>
              {p.nivel >= 100 ? (
                comboio ? <p className="text-xs text-emerald-300 mt-1">✓ {idioma === "es" ? "Inscripto" : idioma === "en" ? "Signed up" : "Inscrito"}</p> : (
                  <div className="mt-2 flex gap-2">
                    <input value={trecho} onChange={(e) => setTrecho(e.target.value)} placeholder={idioma === "es" ? "Tramo (ej.: Salvador → Recife)" : idioma === "en" ? "Stretch (e.g. Salvador → Recife)" : "Trecho (ex.: Salvador → Recife)"} className="flex-1 min-w-0 rounded-xl bg-slate-900/80 border border-white/15 px-3 py-2 text-sm text-white" />
                    <button onClick={entrarComboio} className="btn-primary-amalfi rounded-xl px-4 py-2 text-xs font-black">{idioma === "es" ? "Quiero" : idioma === "en" ? "Join" : "Quero"}</button>
                  </div>)
              ) : (
                <p className="text-xs text-slate-400 mt-1">{idioma === "es" ? "Se libera en el nivel 100" : idioma === "en" ? "Unlocks at level 100" : "Libera no nível 100"} · {nf.format(Math.max(0, pontosParaNivel(100) - p.pontos))} {T.pontos}</p>
              )}
            </div>
          </div>

          <h2 className="mt-10 text-xl font-black">{idioma === "es" ? "Lo que desbloqueás" : idioma === "en" ? "What you unlock" : "O que você desbloqueia"}</h2>
          <ul className="mt-4 space-y-2">
            {RECOMPENSAS.map((r) => (
              <li key={r.nivel} className={`flex gap-3 items-start rounded-2xl p-3 border ${p.nivel >= r.nivel ? "border-amber-400/50 bg-amber-400/10" : "border-white/10"}`}>
                <span className="font-mono text-xs font-bold text-amber-300 w-16 shrink-0">{T.nivel} {r.nivel}</span>
                <span className="text-sm text-slate-200">{r.titulo}{r.parceiro ? <span className="text-slate-400"> · com os Refúgios parceiros</span> : null}</span>
              </li>
            ))}
          </ul>

          {p.recentes.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-black">{idioma === "es" ? "Tus contribuciones" : idioma === "en" ? "Your contributions" : "Suas contribuições"}</h2>
              <ul className="mt-4 divide-y divide-white/5">
                {p.recentes.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-200">{nomeTipo(c.tipo)}{c.nome ? ` · ${c.nome}` : ""}{c.cidade ? ` · ${c.cidade}/${c.uf}` : ""}</span>
                    <span className={`text-xs font-bold shrink-0 ${c.status === "confirmada" ? "text-emerald-300" : c.status === "recusada" ? "text-rose-300" : "text-slate-400"}`}>
                      {c.status === "confirmada" ? `+${c.pontos} · ${T.confirmada}` : T[c.status]} · {c.quando}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
