"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import { TXT, CONTRIBUICOES, type Idioma } from "@/lib/textosEstrada";
import { OFERECE, TIPOS_REFUGIO } from "@/data/honra";
import { PONTOS } from "@/lib/reputacao";

const FOTOS_API = "https://allancandido.com/api/pontos-fotograficos";
const UFS = "RJ ES BA SE AL PE PB RN CE AC AP AM DF GO MA MT MS MG PA PR PI RS RO RR SC SP TO".split(" ");
const campo = "w-full rounded-2xl bg-slate-900/80 border border-white/15 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400";
const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);

const LUGARES: [string, string, string, string][] = [
  ...TIPOS_REFUGIO.map(([v, l]) => [v, l, l, l] as [string, string, string, string]),
  ["posto", "Posto de combustível", "Estación de servicio", "Gas station"],
  ["restaurante", "Restaurante / lanchonete", "Restaurante / parador", "Restaurant / diner"],
  ["oficina", "Oficina / borracharia", "Taller / gomería", "Mechanic / tyre shop"],
  ["apoio", "Ponto de apoio (água, banho, banheiro)", "Punto de apoyo (agua, ducha, baño)", "Support point (water, shower, toilet)"],
  ["outro", "Outro", "Otro", "Other"],
];
const COMBUSTIVEIS = [["gasolina", "Gasolina"], ["etanol", "Etanol"], ["diesel_s10", "Diesel S10"], ["diesel_s500", "Diesel S500"], ["gnv", "GNV"]];
const ESTRADA: [string, string, string, string][] = [
  ["sem_acostamento", "Sem acostamento", "Sin banquina", "No shoulder"],
  ["acostamento_bom", "Acostamento bom", "Banquina buena", "Good shoulder"],
  ["obra", "Obra na pista", "Obra en la ruta", "Roadworks"],
  ["perigo", "Perigo (buraco, curva, assalto)", "Peligro (pozo, curva, robos)", "Danger (pothole, curve, robbery)"],
  ["pedagio", "Pedágio pago", "Peaje pagado", "Toll paid"],
  ["sem_sinal", "Sem sinal de celular", "Sin señal de celular", "No mobile signal"],
  ["sinal_bom", "Sinal de celular bom", "Buena señal de celular", "Good mobile signal"],
];

type Geo = { lat: number; lng: number; precisao: number };

export default function FormContribuicao() {
  const [idioma, setIdioma] = useIdioma();
  const T = TXT[idioma];
  const tipo = (useSearchParams().get("tipo") || "fachada") as (typeof CONTRIBUICOES)[number]["id"];
  const def = CONTRIBUICOES.find((c) => c.id === tipo) ?? CONTRIBUICOES[0];
  const precisaLocal = tipo !== "indicar_lugar";

  const [logado, setLogado] = useState<boolean | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoErro, setGeoErro] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [d, setD] = useState<Record<string, string | string[]>>({ lugar_tipo: "", oferece: [] });
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [vel, setVel] = useState<{ mbps: number; ping: number } | null>(null);
  const [medindo, setMedindo] = useState(false);
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/viajante").then((r) => setLogado(r.status !== 401)).catch(() => setLogado(false));
  }, []);

  const set = (k: string, v: string) => setD((x) => ({ ...x, [k]: v }));
  const alterna = (k: string, v: string) => setD((x) => { const a = (x[k] as string[]) || []; return { ...x, [k]: a.includes(v) ? a.filter((y) => y !== v) : [...a, v] }; });

  function pedirLocal() {
    setGeoErro("");
    if (!navigator.geolocation) { setGeoErro(T.semGps); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ lat: p.coords.latitude, lng: p.coords.longitude, precisao: p.coords.accuracy }),
      () => setGeoErro(T.semGps),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async function medir() {
    setMedindo(true);
    try {
      let ping = 0;
      for (let i = 0; i < 3; i++) { const t0 = performance.now(); await fetch(`/api/viajante?p=${Date.now()}`, { cache: "no-store" }); ping += performance.now() - t0; }
      const t0 = performance.now();
      const r = await fetch(`/speedtest/2mb.bin?v=${Date.now()}`, { cache: "no-store" });
      const bytes = (await r.arrayBuffer()).byteLength;
      const seg = (performance.now() - t0) / 1000;
      setVel({ mbps: Math.round(((bytes * 8) / seg / 1e6) * 10) / 10, ping: Math.round(ping / 3) });
    } catch { setErro("Falhou o teste. Tente de novo."); }
    setMedindo(false);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (precisaLocal && !geo) { setErro(T.semGps); return; }
    if (tipo === "fachada" && !foto) { setErro(L(idioma, "Tire a foto da fachada.", "Sacá la foto de la fachada.", "Take the storefront photo.")); return; }
    if (tipo === "internet" && !vel) { setErro(L(idioma, "Meça a velocidade antes de enviar.", "Medí la velocidad antes de enviar.", "Run the speed test first.")); return; }
    setEstado("enviando");
    try {
      let fotoUrl: string | undefined, fotoPontoId: number | undefined;
      if (foto && geo) {
        const form = new FormData();
        form.append("origem", "jobpago");
        form.append("tipoContribuidor", "viajante");
        form.append("titulo", String(d.nome || def.nome.pt).slice(0, 150));
        form.append("categoria", String(d.lugar_tipo || tipo));
        form.append("foto", foto);
        form.append("latManual", String(geo.lat));
        form.append("lngManual", String(geo.lng));
        const r = await fetch(FOTOS_API, { method: "POST", body: form });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ponto) throw new Error(j.error || "foto");
        fotoUrl = j.ponto.foto_url; fotoPontoId = j.ponto.id;
      }
      const dados: Record<string, unknown> = { ...d };
      if (vel) { dados.mbps = vel.mbps; dados.ping_ms = vel.ping; }
      const r = await fetch("/api/contribuicoes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, dados, lat: geo?.lat, lng: geo?.lng, precisao: geo?.precisao, fotoUrl, fotoPontoId, cidade, uf, idioma }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.erro || "erro");
      setEstado("ok");
    } catch (err) {
      setErro(err instanceof Error && err.message.length < 120 ? err.message : "Não foi possível enviar. Tente de novo.");
      setEstado("");
    }
  }

  const cabecalho = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <Link href="/viajante" className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">← {T.painel}</Link>
      <SeletorIdioma idioma={idioma} onChange={setIdioma} />
    </div>
  );

  if (logado === false) {
    return (<div>{cabecalho}<div className="mt-8 glass-panel rounded-3xl p-7"><p className="text-slate-200">{T.entrar}.</p>
      <Link href={`/entrar?callbackUrl=${encodeURIComponent(`/viajante/contribuir?tipo=${tipo}`)}`} className="mt-4 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{T.entrar}</Link></div></div>);
  }
  if (estado === "ok") {
    return (<div>{cabecalho}<div className="mt-8 glass-panel rounded-3xl p-7"><h1 className="text-2xl font-black">{T.obrigado}</h1><p className="mt-2 text-slate-300">{T.enviado}</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link href="/viajante" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{T.painel}</Link>
      <button onClick={() => { setEstado(""); setFoto(null); setVel(null); setD({ lugar_tipo: "", oferece: [] }); }} className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">{T.contribuir}</button></div></div></div>);
  }

  return (
    <form onSubmit={enviar}>
      {cabecalho}
      <h1 className="mt-4 text-3xl sm:text-4xl font-black">{def.nome[idioma]} <span className="text-base font-mono text-amber-300">+{PONTOS[tipo]}</span></h1>
      <p className="mt-2 text-slate-300">{def.desc[idioma]}</p>

      <div className="mt-8 space-y-5">
        {tipo !== "estrada" && tipo !== "internet" && (
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Nome do lugar", "Nombre del lugar", "Name of the place")}</span>
            <input required value={String(d.nome || "")} onChange={(e) => set("nome", e.target.value)} maxLength={120} className={campo + " mt-2"} /></label>
        )}
        {(tipo === "fachada" || tipo === "dormi_aqui" || tipo === "indicar_lugar") && (
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Tipo de lugar", "Tipo de lugar", "Type of place")}</span>
            <select required value={String(d.lugar_tipo)} onChange={(e) => set("lugar_tipo", e.target.value)} className={campo + " mt-2"}>
              <option value="">—</option>{LUGARES.map(([v, pt, es, en]) => <option key={v} value={v}>{L(idioma, pt, es, en)}</option>)}
            </select></label>
        )}

        {tipo === "dormi_aqui" && (
          <>
            <fieldset><legend className="text-sm font-bold text-slate-300">{L(idioma, "O que tinha de verdade", "Lo que había de verdad", "What was actually there")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">{OFERECE.map(([v, l]) => (
                <button type="button" key={v} onClick={() => alterna("oferece", v)} aria-pressed={(d.oferece as string[]).includes(v)}
                  className={`rounded-xl px-3 py-2 text-sm font-bold border ${(d.oferece as string[]).includes(v) ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200"}`}>{l}</button>))}</div></fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Quanto pagou pela noite (R$)", "Cuánto pagaste la noche (R$)", "What you paid for the night (R$)")}</span>
                <input inputMode="decimal" value={String(d.preco || "")} onChange={(e) => set("preco", e.target.value)} className={campo + " mt-2"} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Nota (1 a 5)", "Nota (1 a 5)", "Rating (1 to 5)")}</span>
                <select value={String(d.nota || "")} onChange={(e) => set("nota", e.target.value)} className={campo + " mt-2"}><option value="">—</option>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></label>
            </div>
          </>
        )}

        {tipo === "combustivel" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Combustível", "Combustible", "Fuel")}</span>
              <select required value={String(d.combustivel || "")} onChange={(e) => set("combustivel", e.target.value)} className={campo + " mt-2"}><option value="">—</option>{COMBUSTIVEIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Preço por litro (R$)", "Precio por litro (R$)", "Price per litre (R$)")}</span>
              <input required inputMode="decimal" value={String(d.preco || "")} onChange={(e) => set("preco", e.target.value)} placeholder="6,19" className={campo + " mt-2"} /></label>
          </div>
        )}

        {tipo === "estrada" && (
          <>
            <fieldset><legend className="text-sm font-bold text-slate-300">{L(idioma, "O que você viu", "Lo que viste", "What you saw")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">{ESTRADA.map(([v, pt, es, en]) => (
                <button type="button" key={v} onClick={() => set("situacao", v)} aria-pressed={d.situacao === v}
                  className={`rounded-xl px-3 py-2 text-sm font-bold border ${d.situacao === v ? "bg-amber-400 text-black border-amber-400" : "border-white/15 text-slate-200"}`}>{L(idioma, pt, es, en)}</button>))}</div></fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Rodovia (opcional)", "Ruta (opcional)", "Highway (optional)")}</span>
                <input value={String(d.rodovia || "")} onChange={(e) => set("rodovia", e.target.value)} placeholder="BR-101" className={campo + " mt-2"} /></label>
              {(d.situacao === "pedagio") && <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Valor pago (R$)", "Valor pagado (R$)", "Amount paid (R$)")}</span>
                <input inputMode="decimal" value={String(d.valor || "")} onChange={(e) => set("valor", e.target.value)} className={campo + " mt-2"} /></label>}
              {(d.situacao === "sem_sinal" || d.situacao === "sinal_bom") && <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Operadora", "Operadora", "Carrier")}</span>
                <input value={String(d.operadora || "")} onChange={(e) => set("operadora", e.target.value)} placeholder="Vivo, Claro, TIM…" className={campo + " mt-2"} /></label>}
            </div>
          </>
        )}

        {tipo === "internet" && (
          <div className="glass-panel rounded-2xl p-5">
            <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Onde você está (nome do lugar)", "Dónde estás (nombre del lugar)", "Where you are (name of the place)")}</span>
              <input required value={String(d.nome || "")} onChange={(e) => set("nome", e.target.value)} className={campo + " mt-2"} /></label>
            <label className="block mt-3"><span className="text-sm font-bold text-slate-300">{L(idioma, "Conexão", "Conexión", "Connection")}</span>
              <select value={String(d.conexao || "wifi")} onChange={(e) => set("conexao", e.target.value)} className={campo + " mt-2"}>
                <option value="wifi">Wi-Fi</option><option value="4g">4G / 5G</option></select></label>
            <button type="button" onClick={medir} disabled={medindo} className="mt-4 btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold">{medindo ? "…" : L(idioma, "Medir velocidade", "Medir velocidad", "Run speed test")}</button>
            {vel && <p className="mt-3 text-lg font-black text-amber-300">{vel.mbps} Mbps · {vel.ping} ms</p>}
          </div>
        )}

        {(tipo === "indicar_lugar") && (
          <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Contato do lugar (opcional)", "Contacto del lugar (opcional)", "Contact of the place (optional)")}</span>
            <input value={String(d.contato || "")} onChange={(e) => set("contato", e.target.value)} className={campo + " mt-2"} /></label>
        )}

        <label className="block"><span className="text-sm font-bold text-slate-300">{L(idioma, "Comentário (opcional)", "Comentario (opcional)", "Comment (optional)")}</span>
          <textarea value={String(d.comentario || "")} onChange={(e) => set("comentario", e.target.value)} maxLength={600} rows={3} className={campo + " mt-2"} /></label>

        <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder={L(idioma, "Cidade", "Ciudad", "Town")} className={campo} aria-label="Cidade" required={tipo === "indicar_lugar"} />
          <select value={uf} onChange={(e) => setUf(e.target.value)} className={campo} aria-label="UF" required={tipo === "indicar_lugar"}><option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
        </div>

        {tipo === "fachada" || tipo === "dormi_aqui" || tipo === "combustivel" ? (
          <label className="block"><span className="text-sm font-bold text-slate-300">{tipo === "fachada" ? L(idioma, "Foto da fachada", "Foto de la fachada", "Storefront photo") : L(idioma, "Foto (opcional)", "Foto (opcional)", "Photo (optional)")}</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} className="mt-2 block text-sm text-slate-300" required={tipo === "fachada"} /></label>
        ) : null}

        {precisaLocal && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
            <p className="text-sm text-slate-200">{T.avisoGps}</p>
            {geo ? <p className="mt-2 text-sm font-bold text-emerald-300">✓ {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} (± {Math.round(geo.precisao)} m)</p>
              : <button type="button" onClick={pedirLocal} className="mt-3 btn-secondary-glass rounded-2xl px-5 py-2.5 text-sm font-bold">{T.permitirGps}</button>}
            {geoErro && <p className="mt-2 text-sm text-rose-300">{geoErro}</p>}
          </div>
        )}

        {erro && <p className="text-sm text-rose-300" role="alert">{erro}</p>}
        <button disabled={estado === "enviando" || logado === null} className="btn-primary-amalfi w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-black disabled:opacity-60">{estado === "enviando" ? "…" : T.enviar}</button>
      </div>
    </form>
  );
}
