"use client";

import { useState } from "react";
import Link from "next/link";
import { NIVEIS_HONRA, OFERECE, TIPOS_REFUGIO } from "@/data/honra";
import { lerIndicacao } from "@/lib/indicacaoCliente";

const UFS = "RJ ES BA SE AL PE PB RN CE AC AP AM DF GO MA MT MS MG PA PR PI RS RO RR SC SP TO".split(" ");
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormRefugio() {
  const [f, setF] = useState({ nome: "", tipo: "", cidade: "", uf: "", responsavel: "", whatsapp: "", email: "", site: "", oferece: [] as string[], precoNoite: "", honra: "", mensagem: "", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const alterna = (v: string) => setF((x) => ({ ...x, oferece: x.oferece.includes(v) ? x.oferece.filter((o) => o !== v) : [...x.oferece, v] }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/refugios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, indicador: lerIndicacao() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setErro(d.erro || "Não foi possível enviar. Tente de novo."); setEstado(""); return; }
      // central de prospecção (r.js): lead do lado negócio
      (window as unknown as { acLead?: (d: object) => void }).acLead?.({ nome: `${f.nome} (${f.cidade}/${f.uf})`, contato: f.whatsapp, seg: "refugio" });
      setEstado("ok");
    } catch {
      setErro("Sem conexão. Tente de novo.");
      setEstado("");
    }
  }

  if (estado === "ok") {
    return (
      <div className="mt-8 glass-panel rounded-3xl p-7">
        <h3 className="text-2xl font-black text-white">Recebido.</h3>
        <p className="mt-2 text-slate-300">Se {f.nome} estiver no caminho da Expedição nº 01 (saída de Paraty em 15 de outubro), a gente chama no WhatsApp para combinar a visita.</p>
        <p className="mt-4 text-sm text-slate-400">Enquanto isso, veja o <Link href="/expedicao" className="underline hover:text-amber-400">roteiro completo</Link>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">Nome do lugar</span>
          <input required maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campo + " mt-2"} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">Tipo</span>
          <select required value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className={campo + " mt-2"}>
            <option value="">Escolha</option>{TIPOS_REFUGIO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
        <label className="block"><span className="text-sm font-bold text-slate-300">Cidade</span>
          <input required maxLength={80} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} className={campo + " mt-2"} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">UF</span>
          <select required value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })} className={campo + " mt-2"}>
            <option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}
          </select></label>
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">O que o lugar oferece</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {OFERECE.map(([v, l]) => (
            <button type="button" key={v} onClick={() => alterna(v)} aria-pressed={f.oferece.includes(v)}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${f.oferece.includes(v) ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200 hover:border-amber-400"}`}>{l}</button>
          ))}
        </div>
        <input maxLength={40} value={f.precoNoite} onChange={(e) => setF({ ...f, precoNoite: e.target.value })} placeholder="Preço da noite (ex.: R$ 80 a 150)" className={campo + " mt-3 sm:max-w-sm"} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">Como você quer apoiar a expedição (Alta Honra)</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {NIVEIS_HONRA.map((n) => (
            <label key={n.id} className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer ${f.honra === n.id ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
              <input type="radio" name="honra" value={n.id} checked={f.honra === n.id} onChange={() => setF({ ...f, honra: n.id })} className="mt-1" />
              <span><span className="font-bold text-white">{n.nome}</span> <span className="text-slate-400 text-sm">· {n.como}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">Seu nome</span>
          <input maxLength={80} value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} className={campo + " mt-2"} autoComplete="name" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">WhatsApp com DDD</span>
          <input required inputMode="tel" maxLength={20} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="(24) 99999-9999" className={campo + " mt-2"} autoComplete="tel" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">E-mail (opcional)</span>
          <input type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campo + " mt-2"} autoComplete="email" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">Site ou Instagram (opcional)</span>
          <input maxLength={200} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} className={campo + " mt-2"} /></label>
      </div>
      <textarea maxLength={600} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} rows={3} placeholder="Algo mais? (ex.: temos área para 3 motorhomes, café da manhã incluso)" className={campo} />

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" required checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} className="mt-1" />
        <span>Autorizo a JobPago a guardar estes dados e me chamar no WhatsApp para combinar a visita. <Link href="/privacidade" className="underline hover:text-amber-400">Privacidade</Link></span>
      </label>
      {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando"} className="btn-primary-amalfi w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-black disabled:opacity-60">
        {estado === "enviando" ? "Enviando…" : "Pedir a visita"}
      </button>
    </form>
  );
}
