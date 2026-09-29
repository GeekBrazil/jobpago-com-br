"use client";

import { useState } from "react";
import CampoTelefone from "@/components/CampoTelefone";
import Link from "next/link";
import { NIVEIS_HONRA, OFERECE, TIPOS_REFUGIO } from "@/data/honra";
import { lerIndicacao } from "@/lib/indicacaoCliente";
import { tTipo, tOferece, tHonra } from "@/lib/traducoesCadastro";
import type { Idioma } from "@/lib/textosEstrada";

const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);

const UFS = "RJ ES BA SE AL PE PB RN CE AC AP AM DF GO MA MT MS MG PA PR PI RS RO RR SC SP TO".split(" ");
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormRefugio({ idioma }: { idioma: Idioma }) {
  const [f, setF] = useState({ nome: "", tipo: "", cidade: "", uf: "", responsavel: "", whatsapp: "", email: "", site: "", oferece: [] as string[], precoNoite: "", honra: "", mensagem: "", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const alterna = (v: string) => setF((x) => ({ ...x, oferece: x.oferece.includes(v) ? x.oferece.filter((o) => o !== v) : [...x.oferece, v] }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/refugios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, indicador: lerIndicacao(), idioma }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setErro(d.erro || L(idioma, "Não foi possível enviar. Tente de novo.", "No se pudo enviar. Probá de nuevo.", "Couldn't send. Please try again.")); setEstado(""); return; }
      // central de prospecção (r.js): lead do lado negócio
      (window as unknown as { acLead?: (d: object) => void }).acLead?.({ nome: `${f.nome} (${f.cidade}/${f.uf})`, contato: f.whatsapp, seg: "refugio" });
      setEstado("ok");
    } catch {
      setErro(L(idioma, "Sem conexão. Tente de novo.", "Sin conexión. Probá de nuevo.", "No connection. Please try again."));
      setEstado("");
    }
  }

  if (estado === "ok") {
    return (
      <div className="mt-8 glass-panel rounded-3xl p-7">
        <h3 className="text-2xl font-black text-white">{L(idioma, "Recebido.", "Recibido.", "Received.")}</h3>
        <p className="mt-2 text-slate-300">{L(idioma, `Se ${f.nome} estiver no caminho da Expedição nº 01 (saída de Paraty em 15 de outubro), a gente chama no WhatsApp para combinar a visita.`, `Si ${f.nome} está en el camino de la Expedición nº 01 (salida de Paraty el 15 de octubre), te escribimos por WhatsApp para acordar la visita.`, `If ${f.nome} is on the route of Expedition no. 01 (leaving Paraty on 15 October), we'll message you on WhatsApp to arrange the visit.`)}</p>
        <p className="mt-4 text-sm text-slate-400">{L(idioma, "Enquanto isso, veja o", "Mientras tanto, mirá la", "Meanwhile, see the")} <Link href="/expedicao" className="underline hover:text-amber-400">{L(idioma, "roteiro completo", "ruta completa", "full route")}</Link>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Nome do lugar", "Nombre del lugar", "Name of the place")}</span>
          <input required maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campo + " mt-2"} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Tipo", "Tipo", "Type")}</span>
          <select required value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className={campo + " mt-2"}>
            <option value="">{L(idioma, "Escolha", "Elegí", "Choose")}</option>{TIPOS_REFUGIO.map(([v, l]) => <option key={v} value={v}>{tTipo(idioma, v, l)}</option>)}
          </select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Cidade", "Ciudad", "Town")}</span>
          <input required maxLength={80} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} className={campo + " mt-2"} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">UF</span>
          <select required value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })} className={campo + " mt-2"}>
            <option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}
          </select></label>
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">{L(idioma, "O que o lugar oferece", "Qué ofrece el lugar", "What the place offers")}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {OFERECE.map(([v, l]) => (
            <button type="button" key={v} onClick={() => alterna(v)} aria-pressed={f.oferece.includes(v)}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${f.oferece.includes(v) ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200 hover:border-amber-400"}`}>{tOferece(idioma, v, l)}</button>
          ))}
        </div>
        <input maxLength={40} value={f.precoNoite} onChange={(e) => setF({ ...f, precoNoite: e.target.value })} placeholder={L(idioma, "Preço da noite (ex.: R$ 80 a 150)", "Precio de la noche (ej.: R$ 80 a 150)", "Price per night (e.g. R$ 80–150)")} className={campo + " mt-3 sm:max-w-sm"} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">{L(idioma, "Como você quer apoiar a expedição (Alta Honra)", "Cómo querés apoyar la expedición (Alto Honor)", "How you want to support the expedition (High Honour)")}</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {NIVEIS_HONRA.map((n) => (
            <label key={n.id} className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer ${f.honra === n.id ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
              <input type="radio" name="honra" value={n.id} checked={f.honra === n.id} onChange={() => setF({ ...f, honra: n.id })} className="mt-1" />
              <span><span className="font-bold text-white">{tHonra(idioma, n.id, "nome", n.nome)}</span> <span className="text-slate-400 text-sm">· {tHonra(idioma, n.id, "como", n.como)}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Seu nome", "Tu nombre", "Your name")}</span>
          <input maxLength={80} value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} className={campo + " mt-2"} autoComplete="name" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "WhatsApp com DDD", "WhatsApp (país y número)", "WhatsApp (country and number)")}</span>
          <CampoTelefone className="mt-2" onChange={(v) => setF((x) => ({ ...x, whatsapp: v }))} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "E-mail (opcional)", "E-mail (opcional)", "E-mail (optional)")}</span>
          <input type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campo + " mt-2"} autoComplete="email" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Site ou Instagram (opcional)", "Sitio o Instagram (opcional)", "Website or Instagram (optional)")}</span>
          <input maxLength={200} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} className={campo + " mt-2"} /></label>
      </div>
      <textarea maxLength={600} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} rows={3} placeholder={L(idioma, "Algo mais? (ex.: temos área para 3 motorhomes, café da manhã incluso)", "¿Algo más? (ej.: tenemos lugar para 3 motorhomes, desayuno incluido)", "Anything else? (e.g. room for 3 motorhomes, breakfast included)")} className={campo} />

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" required checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} className="mt-1" />
        <span>{L(idioma, "Autorizo a JobPago a guardar estes dados e me chamar no WhatsApp para combinar a visita.", "Autorizo a JobPago a guardar estos datos y escribirme por WhatsApp para acordar la visita.", "I allow JobPago to store this data and message me on WhatsApp to arrange the visit.")} <Link href="/privacidade" className="underline hover:text-amber-400">{L(idioma, "Privacidade", "Privacidad", "Privacy")}</Link></span>
      </label>
      {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando"} className="btn-primary-amalfi w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-black disabled:opacity-60">
        {estado === "enviando" ? "…" : L(idioma, "Pedir a visita", "Pedir la visita", "Ask for a visit")}
      </button>
    </form>
  );
}
