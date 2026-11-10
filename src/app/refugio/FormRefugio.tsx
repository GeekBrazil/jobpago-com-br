"use client";

import { useState } from "react";
import CampoTelefone from "@/components/CampoTelefone";
import Link from "next/link";
import { NIVEIS_HONRA, OFERECE, TIPOS_REFUGIO, TIPOS_NEGOCIO_ONLINE } from "@/data/honra";
import { lerIndicacao } from "@/lib/indicacaoCliente";
import { tTipo, tOferece, tHonra } from "@/lib/traducoesCadastro";
import type { Idioma } from "@/lib/textosEstrada";
import { validarSintaxeEmail } from "@/lib/validacaoEmail";
import { CampoSitesPortfolio } from "@/components/VitrineSitesCards";

const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);

const UFS = "BR RJ ES BA SE AL PE PB RN CE AC AP AM DF GO MA MT MS MG PA PR PI RS RO RR SC SP TO".split(" ");
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormRefugio({ idioma }: { idioma: Idioma }) {
  const [f, setF] = useState({ nome: "", tipo: "", cidade: "", uf: "", exclusivamenteOnline: false, responsavel: "", whatsapp: "", email: "", site: "", sitesLinks: [] as string[], oferece: [] as string[], precoNoite: "", honra: "", mensagem: "", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const alterna = (v: string) => setF((x) => ({ ...x, oferece: x.oferece.includes(v) ? x.oferece.filter((o) => o !== v) : [...x.oferece, v] }));

  const checagemEmail = f.email.trim() ? validarSintaxeEmail(f.email, idioma) : null;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!f.email.trim()) {
      setErro(L(idioma, "Por favor, informe seu e-mail.", "Por favor, ingresá tu e-mail.", "Please enter your e-mail."));
      return;
    }
    const v = validarSintaxeEmail(f.email.trim(), idioma);
    if (!v.valido) {
      setErro(v.erro || L(idioma, "E-mail inválido.", "E-mail inválido.", "Invalid e-mail."));
      return;
    }

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
        <p className="mt-2 text-slate-300">{L(idioma, `Se ${f.nome} estiver no caminho da Expedição nº 01 (Fortaleza → Paraty), a gente chama no WhatsApp para combinar a visita.`, `Si ${f.nome} está en el camino de la Expedición nº 01 (Fortaleza → Paraty), te escribimos por WhatsApp para acordar la visita.`, `If ${f.nome} is on the route of Expedition no. 01 (Fortaleza → Paraty), we'll message you on WhatsApp to arrange the visit.`)}</p>
        <p className="mt-4 text-sm text-slate-400">{L(idioma, "Enquanto isso, veja o", "Mientras tanto, mirá la", "Meanwhile, see the")} <Link href="/expedicao" className="underline hover:text-amber-400">{L(idioma, "roteiro completo", "ruta completa", "full route")}</Link>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-6">
      {/* SELETOR RÁPIDO: NEGÓCIO FÍSICO NA ROTA VS EXCLUSIVAMENTE ONLINE */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-black text-cyan-300">
            🌐 {L(idioma, "Seu negócio é exclusivamente online (sem endereço físico)?", "¿Tu negocio es exclusivamente online (sin dirección física)?", "Is your business exclusively online (no physical address)?")}
          </p>
          <p className="text-xs text-slate-300 mt-0.5">
            {L(
              idioma,
              "Ative se você tem E-commerce, SaaS, Agência Digital, Consultoria ou Plataforma Online que atende todo o Brasil.",
              "Activalo si tenés E-commerce, SaaS, Agencia Digital o Consultoría Online para todo el país.",
              "Enable if you run an E-commerce, SaaS, Digital Agency or Online Service nationwide."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const novoOnline = !f.exclusivamenteOnline;
            setF((prev) => ({
              ...prev,
              exclusivamenteOnline: novoOnline,
              tipo: novoOnline && !TIPOS_NEGOCIO_ONLINE.has(prev.tipo) ? "saas_digital" : prev.tipo,
              cidade: novoOnline ? "100% Online" : prev.cidade === "100% Online" ? "" : prev.cidade,
              uf: novoOnline ? "BR" : prev.uf === "BR" ? "" : prev.uf,
            }));
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            f.exclusivamenteOnline
              ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-lg"
              : "bg-white/[0.06] text-slate-200 border-white/15 hover:border-cyan-400"
          }`}
        >
          {f.exclusivamenteOnline
            ? L(idioma, "✓ Modo Negócio 100% Online Ativo", "✓ Negocio 100% Online Activo", "✓ 100% Online Business Active")
            : L(idioma, "Marcar como Negócio 100% Online", "Marcar como Negocio 100% Online", "Mark as 100% Online Business")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Nome do estabelecimento ou negócio online", "Nombre del lugar o negocio online", "Name of the place or online business")}</span>
          <input required maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campo + " mt-2"} /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Categoria / Tipo de Negócio", "Categoría / Tipo de Negocio", "Category / Business Type")}</span>
          <select
            required
            value={f.tipo}
            onChange={(e) => {
              const val = e.target.value;
              const ehOnline = TIPOS_NEGOCIO_ONLINE.has(val);
              setF((prev) => ({
                ...prev,
                tipo: val,
                exclusivamenteOnline: ehOnline,
                cidade: ehOnline ? "100% Online" : prev.cidade === "100% Online" ? "" : prev.cidade,
                uf: ehOnline ? "BR" : prev.uf === "BR" ? "" : prev.uf,
              }));
            }}
            className={campo + " mt-2"}
          >
            <option value="">{L(idioma, "Escolha", "Elegí", "Choose")}</option>{TIPOS_REFUGIO.map(([v, l]) => <option key={v} value={v}>{tTipo(idioma, v, l)}</option>)}
          </select></label>
      </div>
      {!f.exclusivamenteOnline && (
        <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Cidade", "Ciudad", "Town")}</span>
            <input required maxLength={80} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} className={campo + " mt-2"} /></label>
          <label className="block"><span className="text-sm font-bold text-slate-300">UF</span>
            <select required value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })} className={campo + " mt-2"}>
              <option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}
            </select></label>
        </div>
      )}

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
        <div>
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "E-mail *", "E-mail *", "E-mail *")}</span>
            <input required type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campo + " mt-2"} autoComplete="email" /></label>
          {checagemEmail?.sugestao && (
            <button
              type="button"
              onClick={() => setF((prev) => ({ ...prev, email: checagemEmail.sugestao! }))}
              className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 underline block text-left"
            >
              {L(idioma, `Você quis dizer ${checagemEmail.sugestao}? Clique para corrigir.`, `¿Quisiste decir ${checagemEmail.sugestao}? Clic para corregir.`, `Did you mean ${checagemEmail.sugestao}? Click to fix.`)}
            </button>
          )}
        </div>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Site ou Instagram principal (opcional)", "Sitio o Instagram principal (opcional)", "Main Website or Instagram (optional)")}</span>
          <input maxLength={200} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} className={campo + " mt-2"} /></label>
      </div>

      <CampoSitesPortfolio
        sites={f.sitesLinks}
        onChange={(novos) => setF((prev) => ({ ...prev, sitesLinks: novos }))}
        rotulo={L(
          idioma,
          "Sites, Loja Online ou Portfólio do Seu Negócio (Print Automático em Cards)",
          "Sitios, Tienda Online o Portafolio de tu Negocio (Captura Automática en Tarjetas)",
          "Websites, Online Store or Business Portfolio (Automatic Screenshot Cards)"
        )}
        subtitulo={L(
          idioma,
          "Adicione os links do seu site oficial, motor de reservas ou loja online. O JobPago tira o print da tela automaticamente e monta os cards na vitrine do seu estabelecimento.",
          "Agregá los links de tu sitio oficial, motor de reservas o tienda online. JobPago toma la captura automáticamente y arma tarjetas en tu vidriera.",
          "Add links to your official website, booking engine or online store. JobPago automatically takes a screenshot and builds cards on your showcase."
        )}
      />
      <textarea maxLength={600} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} rows={3} placeholder={L(idioma, "Algo mais? (ex.: temos área para 3 motorhomes, ou atendemos todo o Brasil online com desconto na rede)", "¿Algo más? (ej.: tenemos lugar para 3 motorhomes, o atendemos todo el país online)", "Anything else? (e.g. room for 3 motorhomes, or nationwide online service)")} className={campo} />

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
