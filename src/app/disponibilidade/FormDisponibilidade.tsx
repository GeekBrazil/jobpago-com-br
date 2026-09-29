"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIAS } from "@/data/categorias";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import { tCategoria } from "@/lib/traducoesCadastro";
import type { Idioma } from "@/lib/textosEstrada";

const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const QUANDO: [string, string, string, string][] = [["agora", "Posso começar já", "Puedo empezar ya", "I can start now"], ["meio-periodo", "Meio período", "Medio tiempo", "Part-time"], ["fins-de-semana", "Fins de semana", "Fines de semana", "Weekends"], ["integral", "Tempo integral", "Tiempo completo", "Full-time"]];
const MODOS: [string, string, string, string][] = [["remoto", "Remoto", "Remoto", "Remote"], ["presencial", "Presencial", "Presencial", "In person"], ["ambos", "Os dois", "Los dos", "Both"]];
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

export default function FormDisponibilidade() {
  const [idioma, setIdioma] = useIdioma();
  const [f, setF] = useState({ nome: "", whatsapp: "", email: "", cidade: "", uf: "", naEstrada: false, categorias: [] as string[], faz: "", modo: "ambos", quando: "agora", lgpd: false });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const alterna = (id: string) => setF((x) => ({ ...x, categorias: x.categorias.includes(id) ? x.categorias.filter((c) => c !== id) : [...x.categorias, id] }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/disponibilidade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, idioma }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setErro(d.erro || L(idioma, "Não foi possível salvar. Tente de novo.", "No se pudo guardar. Probá de nuevo.", "Couldn't save. Please try again.")); setEstado(""); return; }
      // central de prospecção (r.js): lead do lado "quero renda"
      (window as unknown as { acLead?: (d: object) => void }).acLead?.({ nome: f.nome, contato: f.whatsapp, seg: "renda" });
      setEstado("ok");
    } catch {
      setErro(L(idioma, "Sem conexão. Tente de novo.", "Sin conexión. Probá de nuevo.", "No connection. Please try again."));
      setEstado("");
    }
  }

  const cabecalho = (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{L(idioma, "Quero renda", "Quiero ingresos", "I want income")}</p>
        <SeletorIdioma idioma={idioma} onChange={setIdioma} />
      </div>
      <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{L(idioma, "Cadastre sua disponibilidade", "Registrá tu disponibilidad", "Register your availability")}</h1>
      <p className="mt-4 text-lg text-slate-300">
        {L(idioma,
          "Sem vitrine: seu contato não fica exposto. Você diz o que sabe fazer e de onde trabalha; quando um negócio publicar uma tarefa que combina, a gente te chama no WhatsApp. O pagamento é combinado direto entre vocês, por Pix, sem comissão.",
          "Sin vidriera: tu contacto no queda expuesto. Decís qué sabés hacer y desde dónde trabajás; cuando un negocio publique una tarea que encaje, te escribimos por WhatsApp. El pago se acuerda directo entre ustedes, por Pix, sin comisión.",
          "No public listing: your contact isn't exposed. You say what you can do and where you work from; when a business posts a matching task, we message you on WhatsApp. Payment is agreed directly between you, via Pix, with no commission.")}
      </p>
    </>
  );

  if (estado === "ok") {
    return (
      <>{cabecalho}
      <div className="mt-10 glass-panel rounded-3xl p-7">
        <h2 className="text-2xl font-black text-white">{L(idioma, "Pronto", "Listo", "Done")}, {f.nome.split(" ")[0]}.</h2>
        <p className="mt-2 text-slate-300">{L(idioma, "Sua disponibilidade está registrada. Quando aparecer uma tarefa que combina com você, a gente chama no WhatsApp.", "Tu disponibilidad quedó registrada. Cuando aparezca una tarea que te encaje, te escribimos por WhatsApp.", "Your availability is registered. When a matching task comes up, we'll message you on WhatsApp.")}</p>
        <p className="mt-4 text-sm text-slate-400">{L(idioma, "Enquanto isso, veja", "Mientras tanto, mirá", "Meanwhile, see")} <Link href="/#renda-na-cidade" className="underline hover:text-amber-400">{L(idioma, "quanto se paga na sua área", "cuánto se paga en tu área", "what your field pays")}</Link> {L(idioma, "para cobrar o preço certo.", "para cobrar el precio justo.", "so you charge the right price.")}</p>
      </div>
      </>
    );
  }

  return (
    <>
    {cabecalho}
    <form onSubmit={enviar} className="mt-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Nome", "Nombre", "Name")}</span>
          <input required maxLength={80} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={campo + " mt-2"} autoComplete="name" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "WhatsApp com DDD", "WhatsApp con código de área", "WhatsApp with area code")}</span>
          <input required inputMode="tel" maxLength={20} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="(24) 99999-9999" className={campo + " mt-2"} autoComplete="tel" /></label>
      </div>
      <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "E-mail (opcional)", "E-mail (opcional)", "E-mail (optional)")}</span>
        <input type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campo + " mt-2"} autoComplete="email" /></label>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">{L(idioma, "O que você faz", "Qué hacés", "What you do")}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button type="button" key={c.id} onClick={() => alterna(c.id)} aria-pressed={f.categorias.includes(c.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${f.categorias.includes(c.id) ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200 hover:border-amber-400"}`}>
              {tCategoria(idioma, c.id, c.nome)}
            </button>
          ))}
        </div>
        <textarea maxLength={500} value={f.faz} onChange={(e) => setF({ ...f, faz: e.target.value })} rows={3}
          placeholder={L(idioma, "Em uma frase: ex. edito vídeo curto para Instagram, tenho drone, faço frete de retorno SP–RJ…", "En una frase: ej. edito videos cortos para Instagram, tengo dron, hago fletes de vuelta SP–RJ…", "In one line: e.g. I edit short videos for Instagram, I have a drone, I do return freight SP–RJ…")} className={campo + " mt-3"} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-slate-300">{L(idioma, "De onde você trabalha", "Desde dónde trabajás", "Where you work from")}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
          <input maxLength={80} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder={L(idioma, "Cidade", "Ciudad", "Town")} className={campo} disabled={f.naEstrada} aria-label="Cidade" />
          <select value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })} className={campo} disabled={f.naEstrada} aria-label="Estado">
            <option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={f.naEstrada} onChange={(e) => setF({ ...f, naEstrada: e.target.checked })} /> {L(idioma, "Estou na estrada (sem cidade fixa)", "Estoy en la ruta (sin ciudad fija)", "I'm on the road (no fixed town)")}
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Como", "Cómo", "How")}</span>
          <select value={f.modo} onChange={(e) => setF({ ...f, modo: e.target.value })} className={campo + " mt-2"}>
            {MODOS.map(([v, pt, es, en]) => <option key={v} value={v}>{L(idioma, pt, es, en)}</option>)}
          </select></label>
        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Quando", "Cuándo", "When")}</span>
          <select value={f.quando} onChange={(e) => setF({ ...f, quando: e.target.value })} className={campo + " mt-2"}>
            {QUANDO.map(([v, pt, es, en]) => <option key={v} value={v}>{L(idioma, pt, es, en)}</option>)}
          </select></label>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" required checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} className="mt-1" />
        <span>{L(idioma, "Autorizo a JobPago a guardar estes dados e me chamar no WhatsApp quando houver tarefa compatível. Posso pedir para sair a qualquer momento.", "Autorizo a JobPago a guardar estos datos y escribirme por WhatsApp cuando haya una tarea compatible. Puedo pedir salir en cualquier momento.", "I allow JobPago to store this data and message me on WhatsApp when there's a matching task. I can opt out at any time.")} <Link href="/privacidade" className="underline hover:text-amber-400">{L(idioma, "Privacidade", "Privacidad", "Privacy")}</Link></span>
      </label>

      {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
      <button disabled={estado === "enviando"} className="btn-primary-amalfi w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-black disabled:opacity-60">
        {estado === "enviando" ? "…" : L(idioma, "Cadastrar minha disponibilidade", "Registrar mi disponibilidad", "Register my availability")}
      </button>
    </form>
    </>
  );
}
