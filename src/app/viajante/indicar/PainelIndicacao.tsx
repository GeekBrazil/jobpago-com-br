"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import type { Idioma } from "@/lib/textosEstrada";

const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);
const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";

interface Dados {
  codigo: string | null; link?: string; pagamento_tipo?: string | null; pagamento_chave?: string | null; pais?: string | null; cliques?: number;
  indicados?: { nome: string; cidade: string; uf: string; status: string; quando: string }[];
  comissoes?: { comerciante: string; plano: string; modalidade: string; valor_comissao: string; status: string; libera_em: string; paga_em: string | null }[];
  totais?: { aguardando: number; liberada: number; paga: number };
}

export default function PainelIndicacao() {
  const [idioma, setIdioma] = useIdioma();
  const [d, setD] = useState<Dados | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [aceito, setAceito] = useState(false);
  const [pg, setPg] = useState({ tipo: "pix", chave: "", pais: "" });
  const [msg, setMsg] = useState("");

  const carrega = () => fetch("/api/indicacao").then(async (r) => {
    if (r.status === 401) { setLogado(false); return; }
    setLogado(true);
    const j: Dados = await r.json();
    setD(j);
    if (j.pagamento_tipo) setPg({ tipo: j.pagamento_tipo, chave: j.pagamento_chave || "", pais: j.pais || "" });
  }).catch(() => setLogado(false));
  useEffect(() => { carrega(); }, []);

  async function criar() {
    const r = await fetch("/api/indicacao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "criar", aceito }) });
    if (r.ok) carrega(); else setMsg((await r.json().catch(() => ({}))).erro || "Erro");
  }
  async function salvarPagamento(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/indicacao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "pagamento", ...pg }) });
    setMsg(r.ok ? L(idioma, "Salvo.", "Guardado.", "Saved.") : (await r.json().catch(() => ({}))).erro || "Erro");
  }
  async function compartilhar() {
    if (!d?.link) return;
    const texto = L(idioma, "Conhece a JobPago? Negócios da rota entram no mapa da expedição com o registro de visita.", "¿Conocés JobPago? Los negocios de la ruta entran al mapa de la expedición con el registro de visita.", "Know JobPago? Businesses along the route get on the expedition map with a visit record.");
    try { if (navigator.share) { await navigator.share({ text: texto, url: d.link }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(d.link); setMsg(L(idioma, "Link copiado.", "Link copiado.", "Link copied.")); } catch { /* sem clipboard */ }
  }

  const topo = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <Link href="/viajante" className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">← {L(idioma, "Seu painel", "Tu panel", "Your dashboard")}</Link>
      <SeletorIdioma idioma={idioma} onChange={setIdioma} />
    </div>
  );
  const regras = (
    <ul className="mt-4 space-y-2 text-sm text-slate-300 list-disc pl-5">
      <li>{L(idioma, "Vale para os planos de parceiro da JobPago (Local, Regional, Master e Honra).", "Vale para los planes de socio de JobPago (Local, Regional, Master y Honra).", "Applies to JobPago partner plans (Local, Regional, Master and Honour).")}</li>
      <li>{L(idioma, "Plano mensal: você recebe 50% da primeira mensalidade. Plano anual ou taxa única: 15%.", "Plan mensual: recibís el 50% de la primera cuota. Plan anual o pago único: 15%.", "Monthly plan: you get 50% of the first month. Yearly plan or one-off fee: 15%.")}</li>
      <li>{L(idioma, "A comissão libera 30 dias depois do pagamento do comerciante e é paga uma vez por mês, por Pix, Wise ou PayPal (a partir de R$ 50).", "La comisión se libera 30 días después del pago del comercio y se paga una vez por mes, por Pix, Wise o PayPal (desde R$ 50).", "Commission is released 30 days after the business pays and is paid monthly via Pix, Wise or PayPal (from R$ 50).")}</li>
      <li>{L(idioma, "Vale o primeiro link que o comerciante clicou, por 60 dias. Não vale indicar o próprio negócio.", "Vale el primer link que el comercio abrió, por 60 días. No vale recomendar tu propio negocio.", "The first link the business opened counts, for 60 days. You can't refer your own business.")}</li>
      <li>{L(idioma, "Avise quem você indica que você ganha comissão — a página que ele abre também avisa.", "Avisale a quien recomendás que ganás comisión — la página que abre también lo avisa.", "Tell the people you refer that you earn a commission — the page they open says so too.")}</li>
      <li>{L(idioma, "Pontos: +300 quando o indicado recebe a visita, +800 quando fecha um plano.", "Puntos: +300 cuando el recomendado recibe la visita, +800 cuando contrata un plan.", "Points: +300 when your referral gets visited, +800 when they buy a plan.")}</li>
    </ul>
  );

  if (logado === false) {
    return (<div>{topo}<h1 className="mt-6 text-3xl font-black">{L(idioma, "Indicar e ganhar", "Recomendar y ganar", "Refer and earn")}</h1>{regras}
      <Link href="/entrar?callbackUrl=/viajante/indicar" className="mt-6 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{L(idioma, "Entrar", "Entrar", "Sign in")}</Link></div>);
  }
  if (!d) return <div>{topo}<p className="mt-6 text-slate-400">…</p></div>;

  return (
    <div>
      {topo}
      <h1 className="mt-4 text-3xl sm:text-4xl font-black">{L(idioma, "Indicar e ganhar", "Recomendar y ganar", "Refer and earn")}</h1>
      <p className="mt-2 text-slate-300">{L(idioma, "Apresente a JobPago aos negócios que você encontra na estrada — pousadas, campings, postos, restaurantes.", "Presentale JobPago a los negocios que encontrás en la ruta — posadas, campings, estaciones, restaurantes.", "Introduce JobPago to the businesses you meet on the road — guesthouses, campsites, gas stations, restaurants.")}</p>

      {!d.codigo ? (
        <div className="mt-6 glass-panel rounded-3xl p-6">
          {regras}
          <label className="mt-5 flex items-start gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} className="mt-1" />
            <span>{L(idioma, "Li e aceito as regras.", "Leí y acepto las reglas.", "I have read and accept the rules.")}</span>
          </label>
          <button onClick={criar} disabled={!aceito} className="mt-4 btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black disabled:opacity-50">{L(idioma, "Gerar meu link", "Generar mi link", "Get my link")}</button>
        </div>
      ) : (
        <>
          <div className="mt-6 glass-panel rounded-3xl p-6">
            <p className="text-sm text-slate-400">{L(idioma, "Seu link", "Tu link", "Your link")}</p>
            <p className="mt-1 text-xl font-black text-amber-300 break-all">{d.link}</p>
            <button onClick={compartilhar} className="mt-4 btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{L(idioma, "Compartilhar", "Compartir", "Share")}</button>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[[String(d.cliques ?? 0), L(idioma, "cliques", "clics", "clicks")], [String(d.indicados?.length ?? 0), L(idioma, "indicados", "recomendados", "referrals")],
                [brl(d.totais?.aguardando ?? 0), L(idioma, "aguardando 30 dias", "esperando 30 días", "waiting 30 days")], [brl((d.totais?.liberada ?? 0)), L(idioma, "a receber", "a cobrar", "to be paid")]].map(([v, r]) => (
                <div key={r} className="rounded-2xl border border-white/10 p-3"><p className="text-lg font-black text-white">{v}</p><p className="text-[11px] text-slate-400">{r}</p></div>
              ))}
            </div>
          </div>

          <form onSubmit={salvarPagamento} className="mt-6 glass-panel rounded-3xl p-6 space-y-3">
            <p className="font-bold text-white">{L(idioma, "Como você quer receber", "Cómo querés cobrar", "How you want to be paid")}</p>
            <div className="flex flex-wrap gap-2">
              {[["pix", "Pix"], ["wise", "Wise"], ["paypal", "PayPal"]].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setPg({ ...pg, tipo: v })} aria-pressed={pg.tipo === v}
                  className={`rounded-xl px-4 py-2 text-sm font-bold border ${pg.tipo === v ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200"}`}>{l}</button>))}
            </div>
            <input required value={pg.chave} onChange={(e) => setPg({ ...pg, chave: e.target.value })} className={campo}
              placeholder={pg.tipo === "pix" ? L(idioma, "Chave Pix", "Clave Pix", "Pix key") : L(idioma, "E-mail da conta", "E-mail de la cuenta", "Account e-mail")} />
            <input value={pg.pais} onChange={(e) => setPg({ ...pg, pais: e.target.value })} className={campo} placeholder={L(idioma, "País", "País", "Country")} />
            <button className="btn-secondary-glass rounded-2xl px-5 py-2.5 text-sm font-bold">{L(idioma, "Salvar", "Guardar", "Save")}</button>
          </form>

          {(d.indicados?.length ?? 0) > 0 && (<>
            <h2 className="mt-8 text-lg font-black">{L(idioma, "Quem você indicou", "A quién recomendaste", "Who you referred")}</h2>
            <ul className="mt-3 divide-y divide-white/5 text-sm">{d.indicados!.map((x, i) => (
              <li key={i} className="py-2 flex justify-between gap-3"><span>{x.nome} · {x.cidade}/{x.uf}</span><span className="text-slate-400">{x.status} · {x.quando}</span></li>))}</ul>
          </>)}
          {(d.comissoes?.length ?? 0) > 0 && (<>
            <h2 className="mt-8 text-lg font-black">{L(idioma, "Comissões", "Comisiones", "Commissions")}</h2>
            <ul className="mt-3 divide-y divide-white/5 text-sm">{d.comissoes!.map((c, i) => (
              <li key={i} className="py-2 flex justify-between gap-3"><span>{c.comerciante} · {c.plano} ({c.modalidade})</span>
                <span className="text-slate-300">{brl(Number(c.valor_comissao))} · {c.status === "paga" ? `paga ${c.paga_em}` : c.status === "aguardando" ? `libera ${c.libera_em}` : c.status}</span></li>))}</ul>
          </>)}
          <details className="mt-8 text-sm"><summary className="cursor-pointer text-slate-400">{L(idioma, "Regras", "Reglas", "Rules")}</summary>{regras}</details>
        </>
      )}
      {msg && <p className="mt-4 text-sm text-slate-300">{msg}</p>}
    </div>
  );
}
