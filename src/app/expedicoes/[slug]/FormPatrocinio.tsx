"use client";

import { useState } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";

const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormPatrocinio({ slug }: { slug: string }) {
  const [i] = useIdioma();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const [f, setF] = useState({ patrocinador: "", contato: "", email: "", valor: "", proposta: "", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setEstado("enviando");
    const r = await fetch("/api/patrocinio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...f, idioma: i }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { setErro(j.erro || t("Não foi possível enviar.", "No se pudo enviar.", "Couldn't send.")); setEstado(""); return; }
    (window as unknown as { acLead?: (d: object) => void }).acLead?.({ nome: f.patrocinador, contato: f.contato, seg: "b2b" });
    setEstado("ok");
  }
  if (estado === "ok") return <p className="mt-5 text-emerald-300">{t("Recebido. A JobPago entra em contato para combinar a proposta.", "Recibido. JobPago te contacta para acordar la propuesta.", "Received. JobPago will get in touch to agree the proposal.")}</p>;
  return (
    <form onSubmit={enviar} className="mt-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input required maxLength={160} value={f.patrocinador} onChange={(e) => setF({ ...f, patrocinador: e.target.value })} placeholder={t("Empresa", "Empresa", "Company")} className={campo} />
        <input required maxLength={160} value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} placeholder={t("Seu nome e WhatsApp", "Tu nombre y WhatsApp", "Your name and WhatsApp")} className={campo} />
        <input type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t("E-mail (opcional)", "E-mail (opcional)", "E-mail (optional)")} className={campo} />
        <input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder={t("Valor pensado, R$ (opcional)", "Monto pensado, R$ (opcional)", "Amount in mind, R$ (optional)")} className={campo} />
      </div>
      <textarea maxLength={1500} rows={3} value={f.proposta} onChange={(e) => setF({ ...f, proposta: e.target.value })} placeholder={t("O que você gostaria em troca (menção, vídeo, visita…)", "Qué te gustaría a cambio (mención, video, visita…)", "What you'd like in return (mention, video, visit…)")} className={campo} />
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" required checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} className="mt-1" />
        <span>{t("Autorizo a JobPago a guardar estes dados e me contatar sobre o patrocínio.", "Autorizo a JobPago a guardar estos datos y contactarme sobre el patrocinio.", "I authorise JobPago to store this data and contact me about the sponsorship.")} <Link href="/privacidade" className="underline">{t("Privacidade", "Privacidad", "Privacy")}</Link></span>
      </label>
      {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando"} className="btn-primary-amalfi rounded-2xl px-7 py-3.5 text-sm font-black disabled:opacity-60">{estado === "enviando" ? t("Enviando…", "Enviando…", "Sending…") : t("Quero patrocinar", "Quiero patrocinar", "I want to sponsor")}</button>
    </form>
  );
}
