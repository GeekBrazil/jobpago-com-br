"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import { MODOS, REDES, type Idioma } from "@/lib/expedicoesListas";

const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";
const brl = (v: unknown) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));
type Rede = { rede: string; url: string; seguidores: string };

export default function FormExpedicao() {
  const [idioma, setIdioma] = useIdioma();
  const [logado, setLogado] = useState<boolean | null>(null);
  const [info, setInfo] = useState<{ status?: string; slug?: string; motivo?: string | null } | null>(null);
  const [diario, setDiario] = useState<{ id: number; cidade: string | null; texto: string; quando: string; publico: boolean }[]>([]);
  const [patro, setPatro] = useState<{ patrocinador: string; status: string; valor: string | null; repasse: string | null; repassado_em: string | null }[]>([]);
  const [f, setF] = useState({ nome: "", tema: "", origem: "", destino: "", paradas: "", mesInicio: "", modo: "", veiculo: "", sozinho: false, mostrarRoteiro: true, pagamentoTipo: "pix", pagamentoChave: "" });
  const [redes, setRedes] = useState<Rede[]>([{ rede: "instagram", url: "", seguidores: "" }]);
  const [post, setPost] = useState({ cidade: "", texto: "", link: "" });
  const [msg, setMsg] = useState("");

  const carrega = () => fetch("/api/expedicao").then(async (r) => {
    if (r.status === 401) { setLogado(false); return; }
    setLogado(true);
    const j = await r.json();
    const e = j.expedicao;
    if (e) {
      setInfo({ status: e.status, slug: e.slug, motivo: e.motivo });
      setF({ nome: e.nome, tema: e.tema || "", origem: e.origem, destino: e.destino, paradas: (e.paradas || []).join("\n"), mesInicio: e.mes_inicio || "", modo: e.modo,
        veiculo: e.veiculo || "", sozinho: e.sozinho, mostrarRoteiro: e.mostrar_roteiro, pagamentoTipo: e.pagamento_tipo || "pix", pagamentoChave: e.pagamento_chave || "" });
      if (e.redes?.length) setRedes(e.redes.map((r: { rede: string; url: string; seguidores: number }) => ({ ...r, seguidores: String(r.seguidores || "") })));
      setDiario(j.diario || []);
      setPatro(j.patrocinios || []);
    }
  }).catch(() => setLogado(false));
  useEffect(() => { carrega(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/expedicao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...f, paradas: f.paradas.split("\n").map((s) => s.trim()).filter(Boolean), redes: redes.filter((x) => x.url), idioma }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.erro || "Erro"); return; }
    setMsg(L(idioma, "Salvo. A expedição vai para análise e aparece no site depois de aprovada.", "Guardado. La expedición pasa a revisión y aparece en el sitio después de aprobada.", "Saved. Your expedition goes to review and appears on the site once approved."));
    carrega();
  }
  async function postar(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/expedicao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "diario", ...post }) });
    if (r.ok) { setPost({ cidade: "", texto: "", link: "" }); carrega(); } else setMsg((await r.json().catch(() => ({}))).erro || "Erro");
  }

  const topo = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <Link href="/viajante" className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">← {L(idioma, "Seu painel", "Tu panel", "Your dashboard")}</Link>
      <SeletorIdioma idioma={idioma} onChange={setIdioma} />
    </div>
  );
  if (logado === false) {
    return (<div>{topo}<h1 className="mt-6 text-3xl font-black">{L(idioma, "Crie sua expedição", "Creá tu expedición", "Create your expedition")}</h1>
      <Link href="/entrar?callbackUrl=/viajante/expedicao" className="mt-6 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{L(idioma, "Entrar", "Entrar", "Sign in")}</Link></div>);
  }
  const STATUS: Record<string, string> = {
    em_analise: L(idioma, "em análise", "en revisión", "under review"), publicada: L(idioma, "publicada", "publicada", "published"),
    recusada: L(idioma, "precisa de ajuste", "necesita ajustes", "needs changes"), encerrada: L(idioma, "encerrada", "terminada", "finished"),
  };

  return (
    <div>
      {topo}
      <h1 className="mt-4 text-3xl sm:text-4xl font-black">{L(idioma, "Sua expedição", "Tu expedición", "Your expedition")}</h1>
      <p className="mt-2 text-slate-300">{L(idioma,
        "Conte sua viagem. Depois de aprovada, ela ganha uma página e a JobPago procura patrocinadores: o patrocínio passa pela JobPago e 85% vão para você.",
        "Contá tu viaje. Una vez aprobada, tiene su página y JobPago busca patrocinadores: el patrocinio pasa por JobPago y el 85% es para vos.",
        "Tell us about your trip. Once approved it gets its own page and JobPago looks for sponsors: sponsorship goes through JobPago and 85% goes to you.")}</p>
      {info?.status && (
        <p className="mt-4 text-sm">
          <span className="font-bold text-amber-300">{STATUS[info.status] ?? info.status}</span>
          {info.status === "publicada" && info.slug && <> · <Link href={`/expedicoes/${info.slug}`} className="underline">jobpago.com.br/expedicoes/{info.slug}</Link></>}
          {info.motivo && <span className="block text-slate-400">{info.motivo}</span>}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-slate-200">
        {L(idioma,
          "Sua segurança vem primeiro: a página nunca mostra onde você está agora. Não há datas exatas, o diário só aparece 24 horas depois de escrito e, se você viaja sozinho(a), pode esconder o roteiro planejado.",
          "Tu seguridad primero: la página nunca muestra dónde estás ahora. No hay fechas exactas, el diario aparece 24 horas después de escrito y, si viajás solo/a, podés ocultar la ruta planificada.",
          "Your safety comes first: the page never shows where you are now. No exact dates, diary entries appear 24 hours after you write them and, if you travel alone, you can hide the planned route.")}
      </div>

      <form onSubmit={salvar} className="mt-8 space-y-5">
        <input required maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder={L(idioma, "Nome da expedição", "Nombre de la expedición", "Expedition name")} className={campo} />
        <textarea maxLength={1500} rows={3} value={f.tema} onChange={(e) => setF({ ...f, tema: e.target.value })} placeholder={L(idioma, "Tema e diferencial (fotografia, gastronomia, trabalho remoto, causa…)", "Tema y diferencial (fotografía, gastronomía, trabajo remoto, causa…)", "Theme and what makes it different (photography, food, remote work, a cause…)")} className={campo} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input required maxLength={80} value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value })} placeholder={L(idioma, "Origem", "Origen", "Start")} className={campo} />
          <input required maxLength={80} value={f.destino} onChange={(e) => setF({ ...f, destino: e.target.value })} placeholder={L(idioma, "Destino", "Destino", "Destination")} className={campo} />
        </div>
        <textarea rows={3} value={f.paradas} onChange={(e) => setF({ ...f, paradas: e.target.value })} placeholder={L(idioma, "Paradas planejadas (uma por linha)", "Paradas planificadas (una por línea)", "Planned stops (one per line)")} className={campo} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Como você vai", "Cómo vas", "How you travel")}</span>
            <select required value={f.modo} onChange={(e) => setF({ ...f, modo: e.target.value })} className={campo + " mt-2"}>
              <option value="">—</option>{MODOS.map(([v, n]) => <option key={v} value={v}>{n[idioma]}</option>)}</select></label>
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Mês de saída", "Mes de salida", "Starting month")}</span>
            <input type="month" value={f.mesInicio} onChange={(e) => setF({ ...f, mesInicio: e.target.value })} className={campo + " mt-2"} /></label>
        </div>
        <input maxLength={120} value={f.veiculo} onChange={(e) => setF({ ...f, veiculo: e.target.value })} placeholder={L(idioma, "Veículo (modelo, se houver)", "Vehículo (modelo, si hay)", "Vehicle (model, if any)")} className={campo} />
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={f.sozinho} onChange={(e) => setF({ ...f, sozinho: e.target.checked, mostrarRoteiro: e.target.checked ? false : f.mostrarRoteiro })} />
          {L(idioma, "Viajo sozinho(a)", "Viajo solo/a", "I travel alone")}</label>
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={f.mostrarRoteiro} onChange={(e) => setF({ ...f, mostrarRoteiro: e.target.checked })} />
          {L(idioma, "Mostrar o roteiro planejado na página", "Mostrar la ruta planificada en la página", "Show the planned route on the page")}</label>

        <fieldset>
          <legend className="text-sm font-bold text-slate-300">{L(idioma, "Redes sociais (seguidores informados por você)", "Redes sociales (seguidores que informás)", "Social media (followers as you report them)")}</legend>
          {redes.map((r, i) => (
            <div key={i} className="mt-2 grid gap-2 grid-cols-[110px_1fr_110px]">
              <select value={r.rede} onChange={(e) => setRedes(redes.map((x, j) => (j === i ? { ...x, rede: e.target.value } : x)))} className={campo}>{REDES.map((n) => <option key={n}>{n}</option>)}</select>
              <input value={r.url} onChange={(e) => setRedes(redes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://" className={campo} />
              <input inputMode="numeric" value={r.seguidores} onChange={(e) => setRedes(redes.map((x, j) => (j === i ? { ...x, seguidores: e.target.value } : x)))} placeholder={L(idioma, "seguidores", "seguidores", "followers")} className={campo} />
            </div>
          ))}
          {redes.length < 5 && <button type="button" onClick={() => setRedes([...redes, { rede: "tiktok", url: "", seguidores: "" }])} className="mt-2 text-sm text-amber-300 underline">+ {L(idioma, "outra rede", "otra red", "another network")}</button>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-slate-300">{L(idioma, "Como receber o repasse do patrocínio (85%)", "Cómo cobrar el patrocinio (85%)", "How to receive the sponsorship payout (85%)")}</legend>
          <div className="mt-2 flex gap-2">{[["pix", "Pix"], ["wise", "Wise"], ["paypal", "PayPal"]].map(([v, l]) => (
            <button type="button" key={v} onClick={() => setF({ ...f, pagamentoTipo: v })} aria-pressed={f.pagamentoTipo === v}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${f.pagamentoTipo === v ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200"}`}>{l}</button>))}</div>
          <input maxLength={200} value={f.pagamentoChave} onChange={(e) => setF({ ...f, pagamentoChave: e.target.value })} placeholder={f.pagamentoTipo === "pix" ? L(idioma, "Chave Pix", "Clave Pix", "Pix key") : L(idioma, "E-mail da conta", "E-mail de la cuenta", "Account e-mail")} className={campo + " mt-2"} />
        </fieldset>
        <button className="btn-primary-amalfi rounded-2xl px-8 py-4 text-base font-black">{L(idioma, "Salvar e enviar para análise", "Guardar y enviar a revisión", "Save and send for review")}</button>
        {msg && <p className="text-sm text-slate-300">{msg}</p>}
      </form>

      {info?.status && (<>
        <h2 className="mt-12 text-xl font-black">{L(idioma, "Diário", "Diario", "Diary")}</h2>
        <p className="text-sm text-slate-400 mt-1">{L(idioma, "Cada entrada aparece na página 24 horas depois de escrita.", "Cada entrada aparece en la página 24 horas después de escrita.", "Each entry appears on the page 24 hours after you write it.")}</p>
        <form onSubmit={postar} className="mt-4 space-y-3">
          <input maxLength={80} value={post.cidade} onChange={(e) => setPost({ ...post, cidade: e.target.value })} placeholder={L(idioma, "Cidade", "Ciudad", "Town")} className={campo} />
          <textarea required maxLength={2000} rows={3} value={post.texto} onChange={(e) => setPost({ ...post, texto: e.target.value })} placeholder={L(idioma, "Como foi o dia?", "¿Cómo fue el día?", "How was the day?")} className={campo} />
          <input maxLength={300} value={post.link} onChange={(e) => setPost({ ...post, link: e.target.value })} placeholder={L(idioma, "Link do post (opcional)", "Link del post (opcional)", "Post link (optional)")} className={campo} />
          <button className="btn-secondary-glass rounded-2xl px-5 py-2.5 text-sm font-bold">{L(idioma, "Publicar no diário", "Publicar en el diario", "Add to diary")}</button>
        </form>
        <ul className="mt-4 divide-y divide-white/5 text-sm">{diario.map((d) => (
          <li key={d.id} className="py-2"><span className="text-slate-400">{d.quando}{d.cidade ? ` · ${d.cidade}` : ""} · {d.publico ? L(idioma, "visível", "visible", "visible") : L(idioma, "aparece em 24 h", "aparece en 24 h", "shows in 24 h")}</span><br />{d.texto}</li>))}</ul>

        {patro.length > 0 && (<>
          <h2 className="mt-10 text-xl font-black">{L(idioma, "Patrocínios", "Patrocinios", "Sponsorships")}</h2>
          <ul className="mt-3 divide-y divide-white/5 text-sm">{patro.map((p, i) => (
            <li key={i} className="py-2 flex justify-between gap-3"><span>{p.patrocinador} · {p.status}</span><span className="text-slate-300">{p.repasse ? `${L(idioma, "seu repasse", "tu parte", "your share")} ${brl(p.repasse)}${p.repassado_em ? ` · ${p.repassado_em}` : ""}` : ""}</span></li>))}</ul>
        </>)}
      </>)}
    </div>
  );
}
