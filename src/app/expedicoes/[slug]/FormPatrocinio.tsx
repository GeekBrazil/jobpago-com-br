"use client";

import { useState } from "react";
import Link from "next/link";

const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormPatrocinio({ slug }: { slug: string }) {
  const [f, setF] = useState({ patrocinador: "", contato: "", email: "", valor: "", proposta: "", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEstado("enviando");
    const r = await fetch("/api/patrocinio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...f }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { setErro(j.erro || "Não foi possível enviar."); setEstado(""); return; }
    (window as unknown as { acLead?: (d: object) => void }).acLead?.({ nome: f.patrocinador, contato: f.contato, seg: "b2b" });
    setEstado("ok");
  }
  if (estado === "ok") return <p className="mt-5 text-emerald-300">Recebido. A JobPago entra em contato para combinar a proposta.</p>;
  return (
    <form onSubmit={enviar} className="mt-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input required maxLength={160} value={f.patrocinador} onChange={(e) => setF({ ...f, patrocinador: e.target.value })} placeholder="Empresa" className={campo} />
        <input required maxLength={160} value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} placeholder="Seu nome e WhatsApp" className={campo} />
        <input type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="E-mail (opcional)" className={campo} />
        <input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder="Valor pensado, R$ (opcional)" className={campo} />
      </div>
      <textarea maxLength={1500} rows={3} value={f.proposta} onChange={(e) => setF({ ...f, proposta: e.target.value })} placeholder="O que você gostaria em troca (menção, vídeo, visita…)" className={campo} />
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" required checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} className="mt-1" />
        <span>Autorizo a JobPago a guardar estes dados e me contatar sobre o patrocínio. <Link href="/privacidade" className="underline">Privacidade</Link></span>
      </label>
      {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando"} className="btn-primary-amalfi rounded-2xl px-7 py-3.5 text-sm font-black disabled:opacity-60">{estado === "enviando" ? "Enviando…" : "Quero patrocinar"}</button>
    </form>
  );
}
