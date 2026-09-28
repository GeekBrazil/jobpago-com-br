"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIAS } from "@/data/categorias";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const QUANDO = [["agora", "Posso começar já"], ["meio-periodo", "Meio período"], ["fins-de-semana", "Fins de semana"], ["integral", "Tempo integral"]];
const MODOS = [["remoto", "Remoto"], ["presencial", "Presencial"], ["ambos", "Os dois"]];
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormDisponibilidade() {
  const [f, setF] = useState({ nome: "", whatsapp: "", email: "", cidade: "", uf: "", naEstrada: false, categorias: [] as string[], faz: "", modo: "ambos", quando: "agora", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const alterna = (id: string) => setF((x) => ({ ...x, categorias: x.categorias.includes(id) ? x.categorias.filter((c) => c !== id) : [...x.categorias, id] }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/disponibilidade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setErro(d.erro || "Não foi possível salvar. Tente de novo."); setEstado(""); return; }
      // central de prospecção (r.js): lead do lado "quero renda"
      (window as unknown as { acLead?: (d: object) => void }).acLead?.({ nome: f.nome, contato: f.whatsapp, seg: "renda" });
      setEstado("ok");
    } catch {
      setErro("Sem conexão. Tente de novo.");
      setEstado("");
    }
  }

  if (estado === "ok") {
    return (
      <div className="mt-10 glass-panel rounded-3xl p-7">
        <h2 className="text-2xl font-black text-white">Pronto, {f.nome.split(" ")[0]}.</h2>
        <p className="mt-2 text-slate-300">Sua disponibilidade está registrada. Quando aparecer uma tarefa que combina com você, a gente chama no WhatsApp.</p>
        <p className="mt-4 text-sm text-slate-400">Enquanto isso, veja <Link href="/#renda-na-cidade" className="underline hover:text-amber-400">quanto se paga na sua área</Link> para cobrar o preço certo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">Nome</span>
          <input required maxLength={80} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campo + " mt-2"} autoComplete="name" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">WhatsApp com DDD</span>
          <input required inputMode="tel" maxLength={20} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="(24) 99999-9999" className={campo + " mt-2"} autoComplete="tel" /></label>
      </div>
      <label className="block"><span className="text-sm font-bold text-slate-300">E-mail (opcional)</span>
        <input type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campo + " mt-2"} autoComplete="email" /></label>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">O que você faz</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button type="button" key={c.id} onClick={() => alterna(c.id)} aria-pressed={f.categorias.includes(c.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${f.categorias.includes(c.id) ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200 hover:border-amber-400"}`}>
              {c.nome}
            </button>
          ))}
        </div>
        <textarea maxLength={500} value={f.faz} onChange={(e) => setF({ ...f, faz: e.target.value })} rows={3}
          placeholder="Em uma frase: ex. edito vídeo curto para Instagram, tenho drone, faço frete de retorno SP–RJ…" className={campo + " mt-3"} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">De onde você trabalha</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
          <input maxLength={80} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder="Cidade" className={campo} disabled={f.naEstrada} aria-label="Cidade" />
          <select value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })} className={campo} disabled={f.naEstrada} aria-label="Estado">
            <option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={f.naEstrada} onChange={(e) => setF({ ...f, naEstrada: e.target.checked })} /> Estou na estrada (sem cidade fixa)
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">Como</span>
          <select value={f.modo} onChange={(e) => setF({ ...f, modo: e.target.value })} className={campo + " mt-2"}>
            {MODOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">Quando</span>
          <select value={f.quando} onChange={(e) => setF({ ...f, quando: e.target.value })} className={campo + " mt-2"}>
            {QUANDO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></label>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" required checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} className="mt-1" />
        <span>Autorizo a JobPago a guardar estes dados e me chamar no WhatsApp quando houver tarefa compatível. Posso pedir para sair a qualquer momento. <Link href="/privacidade" className="underline hover:text-amber-400">Privacidade</Link></span>
      </label>

      {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando"} className="btn-primary-amalfi w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-black disabled:opacity-60">
        {estado === "enviando" ? "Salvando…" : "Cadastrar minha disponibilidade"}
      </button>
    </form>
  );
}
