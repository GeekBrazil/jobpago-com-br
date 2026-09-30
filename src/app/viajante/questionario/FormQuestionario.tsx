"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import { QUESTIONARIO, TXT, type Idioma } from "@/lib/textosEstrada";
import { PONTOS } from "@/lib/reputacao";

const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";
const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);

export default function FormQuestionario() {
  const [idioma, setIdioma] = useIdioma();
  const T = TXT[idioma];
  const [logado, setLogado] = useState<boolean | null>(null);
  const [feito, setFeito] = useState(false);
  const [r, setR] = useState<Record<string, string | string[]>>({});
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/viajante").then(async (x) => {
      if (x.status === 401) { setLogado(false); return; }
      setLogado(true);
      const j = await x.json();
      setFeito(!!j.questionario);
    }).catch(() => setLogado(false));
  }, []);

  const alterna = (id: string, v: string) => setR((x) => { const a = (x[id] as string[]) || []; return { ...x, [id]: a.includes(v) ? a.filter((y) => y !== v) : [...a, v] }; });
  const respondidas = Object.values(r).filter((v) => (Array.isArray(v) ? v.length : String(v).trim())).length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (respondidas < 5) { setErro(L(idioma, "Responda pelo menos 5 perguntas.", "Respondé al menos 5 preguntas.", "Please answer at least 5 questions.")); return; }
    setEstado("enviando");
    const x = await fetch("/api/contribuicoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "questionario", dados: r, idioma }) });
    const j = await x.json().catch(() => ({}));
    if (!x.ok || !j.ok) { setErro(j.erro || "Erro"); setEstado(""); return; }
    setEstado("ok");
  }

  const topo = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <Link href="/viajante" className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">← {T.painel}</Link>
      <SeletorIdioma idioma={idioma} onChange={setIdioma} />
    </div>
  );

  if (logado === false) {
    return (<div>{topo}<h1 className="mt-6 text-3xl font-black">{T.questionario}</h1>
      <p className="mt-3 text-slate-300">{L(idioma, "Entre na sua conta para responder e ganhar os pontos.", "Entrá a tu cuenta para responder y sumar los puntos.", "Sign in to answer and earn the points.")}</p>
      <Link href="/entrar?callbackUrl=/viajante/questionario" className="mt-5 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{T.entrar}</Link></div>);
  }
  if (feito || estado === "ok") {
    return (<div>{topo}<div className="mt-8 glass-panel rounded-3xl p-7"><h1 className="text-2xl font-black">{T.obrigado}</h1><p className="mt-2 text-slate-300">{T.questionarioFeito}</p>
      <Link href="/viajante" className="mt-5 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{T.painel}</Link></div></div>);
  }

  return (
    <form onSubmit={enviar}>
      {topo}
      <h1 className="mt-4 text-3xl sm:text-4xl font-black">{T.questionario} <span className="text-base font-mono text-amber-300">+{PONTOS.questionario}</span></h1>
      <p className="mt-2 text-slate-300">{L(idioma, "Suas respostas ajudam a construir o que falta na rota. Nada aqui é público.", "Tus respuestas ayudan a construir lo que falta en la ruta. Nada de esto es público.", "Your answers help build what's missing along the route. Nothing here is public.")}</p>
      <ol className="mt-8 space-y-7">
        {QUESTIONARIO.map((q, n) => (
          <li key={q.id}>
            <p className="font-bold text-white"><span className="text-amber-400 font-mono mr-2">{n + 1}.</span>{q.titulo[idioma]}</p>
            {q.tipo === "texto" && (
              <textarea rows={q.id === "pais" || q.id === "redes" ? 1 : 3} maxLength={800} value={String(r[q.id] || "")} onChange={(e) => setR({ ...r, [q.id]: e.target.value })} className={campo + " mt-3"} />
            )}
            {q.tipo === "escala" && (
              <div className="mt-3 flex gap-2">{["1", "2", "3", "4", "5"].map((v) => (
                <button type="button" key={v} onClick={() => setR({ ...r, [q.id]: v })} aria-pressed={r[q.id] === v}
                  className={`w-12 h-12 rounded-xl font-black border ${r[q.id] === v ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200"}`}>{v}</button>))}</div>
            )}
            {(q.tipo === "uma" || q.tipo === "varias") && (
              <div className="mt-3 flex flex-wrap gap-2">{q.opcoes!.map(([v, rot]) => {
                const on = q.tipo === "uma" ? r[q.id] === v : ((r[q.id] as string[]) || []).includes(v);
                return (<button type="button" key={v} aria-pressed={on} onClick={() => (q.tipo === "uma" ? setR({ ...r, [q.id]: v }) : alterna(q.id, v))}
                  className={`rounded-xl px-3 py-2 text-sm font-bold border ${on ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200"}`}>{rot[idioma]}</button>);
              })}</div>
            )}
          </li>
        ))}
      </ol>
      {erro && <p className="mt-6 text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando" || logado === null} className="mt-8 btn-primary-amalfi w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-black disabled:opacity-60">{estado === "enviando" ? "…" : T.enviar}</button>
    </form>
  );
}
