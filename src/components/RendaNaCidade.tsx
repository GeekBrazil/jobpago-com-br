"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";
import { tSecao, competenciaEm } from "@/lib/traducoesCadastro";

/* "Valores de referência por setor na sua cidade" (salário de admissão) — número oficial
   (salário médio de admissão do Novo CAGED, 12 meses) com detecção por geolocalização. */

interface Setor { secao: string; setor: string; salario: number; admissoes: number }
interface Dados { ibge: string; cidade: string; uf: string; de: number; ate: number; media: number | null; setores: Setor[] }
interface Opcao { ibge: string; nome: string; uf: string }

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

const CHAVE_STORAGE = "jobpago_ibge_geoloc";

export default function RendaNaCidade({ ibgeInicial = "3303807" }: { ibgeInicial?: string }) {
  const [idioma] = useIdioma();
  const comp = (c: number) => competenciaEm(idioma, c);
  const nomeSetor = (x: { secao: string; setor: string }) => tSecao(idioma, x.secao, x.setor).toLowerCase();
  const [ibge, setIbge] = useState(ibgeInicial);
  const [dados, setDados] = useState<Dados | null>(null);
  const [secao, setSecao] = useState("");
  const [busca, setBusca] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [erro, setErro] = useState(false);
  const [modoGeo, setModoGeo] = useState<"gps" | "ip" | null>(null);
  const [carregandoGeo, setCarregandoGeo] = useState(false);

  // Função para resolver coordenadas em município
  const resolverCoordenadas = useCallback(async (lat: number, lng: number) => {
    try {
      setCarregandoGeo(true);
      const res = await fetch(`/api/cidades/geolocalizar?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok && json.ibge) {
        setIbge(json.ibge);
        setModoGeo(json.metodo || "gps");
        try { sessionStorage.setItem(CHAVE_STORAGE, json.ibge); } catch {}
      }
    } catch {
      // Falha silenciosa
    } finally {
      setCarregandoGeo(false);
    }
  }, []);

  // Solicitar permissão e posição via GPS do navegador
  const pedirGps = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setCarregandoGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolverCoordenadas(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setCarregandoGeo(false);
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, [resolverCoordenadas]);

  // Geolocalização inicial no mount: verifica cache, tenta IP ou GPS automático se consentido
  useEffect(() => {
    let salvo: string | null = null;
    try { salvo = sessionStorage.getItem(CHAVE_STORAGE); } catch {}
    if (salvo && /^\d{7}$/.test(salvo)) {
      setIbge(salvo);
      setModoGeo("gps");
      return;
    }

    // Tenta primeiro detectar via header de IP (ultra rápido, sem popup)
    fetch("/api/cidades/geolocalizar")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.ok && d.ibge) {
          setIbge(d.ibge);
          setModoGeo("ip");
        }
      })
      .catch(() => {});

    // Se o navegador já concedeu permissão antes, atualiza com precisão GPS
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((p) => {
          if (p.state === "granted") {
            pedirGps();
          } else if (p.state === "prompt") {
            // Dispara tentativa com timeout suave para usuários em mobile/desktop
            pedirGps();
          }
        })
        .catch(() => {
          pedirGps();
        });
    } else {
      pedirGps();
    }
  }, [pedirGps]);

  // Carrega os dados econômicos da cidade
  useEffect(() => {
    let vivo = true;
    setErro(false);
    fetch(`/api/renda?ibge=${ibge}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Dados) => {
        if (!vivo) return;
        setDados(d);
        setSecao((atual) => (d.setores.some((s) => s.secao === atual) ? atual : d.setores[0]?.secao ?? ""));
      })
      .catch(() => vivo && setErro(true));
    return () => { vivo = false; };
  }, [ibge]);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) { setOpcoes([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/cidades?q=${encodeURIComponent(termo)}`).then((r) => (r.ok ? r.json() : [])).then(setOpcoes).catch(() => setOpcoes([]));
    }, 250);
    return () => clearTimeout(t);
  }, [busca]);

  const setor = dados?.setores.find((s) => s.secao === secao);

  return (
    <section id="renda-na-cidade" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="renda-titulo">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
            {L(idioma, "Valores de referência por setor na sua cidade", "Valores de referencia por sector en tu ciudad", "Reference rates by sector in your town")}
          </p>

          <div className="flex items-center gap-2">
            {modoGeo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {modoGeo === "gps"
                  ? L(idioma, "GPS ativo", "GPS activo", "GPS active")
                  : L(idioma, "Detectado por IP", "Detectado por IP", "Detected via IP")}
              </span>
            )}
            <button
              type="button"
              onClick={pedirGps}
              disabled={carregandoGeo}
              title={L(idioma, "Usar minha geolocalização atual", "Usar mi geolocalización actual", "Use my current geolocation")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <span>📍</span>
              <span>{carregandoGeo ? L(idioma, "Localizando…", "Localizando…", "Locating…") : L(idioma, "Minha localização", "Mi ubicación", "My location")}</span>
            </button>
          </div>
        </div>

        <h2 id="renda-titulo" className="mt-3 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          {L(idioma, "Salário de admissão em", "Salario de ingreso en", "Starting pay in")}{" "}
          <label className="sr-only" htmlFor="renda-setor">{L(idioma, "Setor", "Sector", "Sector")}</label>
          <select
            id="renda-setor"
            value={secao}
            onChange={(e) => setSecao(e.target.value)}
            className="block sm:inline w-full sm:w-auto my-1 bg-transparent border-b-2 border-amber-400 text-amber-300 font-black focus:outline-none text-lg sm:text-5xl pr-6"
          >
            {(dados?.setores ?? []).map((s) => (
              <option key={s.secao} value={s.secao} className="bg-slate-900 text-base">{nomeSetor(s)}</option>
            ))}
          </select>{" "}
          {L(idioma, "em", "en", "in")} {dados ? `${dados.cidade} - ${dados.uf}` : "…"}
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] items-start">
          <div aria-live="polite">
            {erro && <p className="text-slate-300">{L(idioma, "Ainda não temos esse número para essa cidade. Tente uma cidade vizinha.", "Todavía no tenemos ese dato para esta ciudad. Probá una ciudad vecina.", "We don't have this figure for that town yet. Try a nearby town.")}</p>}
            {setor && dados && (
              <>
                <p className="text-6xl sm:text-7xl font-black text-white tabular-nums">{brl.format(setor.salario)}</p>
                <p className="mt-3 text-slate-300">
                  {L(idioma, "salário médio de entrada em", "sueldo medio de entrada en", "average starting salary in")} <strong className="text-white">{nomeSetor(setor)}</strong> {L(idioma, "em", "en", "in")} {dados.cidade},{" "}
                  {L(idioma, "com base em", "según", "based on")} {nf.format(setor.admissoes)} {L(idioma, "contratações de", "contrataciones de", "hires from")} {comp(dados.de)} {L(idioma, "a", "a", "to")} {comp(dados.ate)}.
                  {dados.media ? <> {L(idioma, "Média da cidade, todos os setores:", "Promedio de la ciudad, todos los sectores:", "Town average, all sectors:")} {brl.format(dados.media)}.</> : null}
                </p>
                <p className="mt-3 text-xs text-slate-400">{L(idioma, "Fonte: Novo CAGED, Ministério do Trabalho (carteira assinada). Quem cobra por tarefa usa esse número como piso para não trabalhar de graça.", "Fuente: Novo CAGED, Ministerio de Trabajo de Brasil (empleo formal). Quien cobra por tarea usa este número como piso para no trabajar gratis.", "Source: Novo CAGED, Brazil's Ministry of Labour (formal jobs). If you charge per task, use this as a floor so you don't work for free.")}</p>
              </>
            )}
          </div>
          <div>
            <label htmlFor="renda-cidade" className="block text-sm font-bold text-slate-300 mb-2">{L(idioma, "Trocar de cidade", "Cambiar de ciudad", "Change town")}</label>
            <input
              id="renda-cidade"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={L(idioma, "Digite sua cidade", "Escribí tu ciudad", "Type your town")}
              autoComplete="off"
              className="w-full rounded-2xl bg-slate-900/80 border border-white/15 px-5 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            {opcoes.length > 0 && (
              <ul className="mt-2 rounded-2xl bg-slate-900/95 border border-white/10 overflow-hidden">
                {opcoes.map((o) => (
                  <li key={o.ibge}>
                    <button
                      type="button"
                      onClick={() => {
                        setIbge(o.ibge);
                        setBusca("");
                        setOpcoes([]);
                        setModoGeo(null);
                        try { sessionStorage.setItem(CHAVE_STORAGE, o.ibge); } catch {}
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-slate-100 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      {o.nome} <span className="text-slate-400">· {o.uf}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {dados && (
              <Link href={`/cidade/${dados.ibge}`} className="mt-5 inline-flex btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">
                {L(idioma, "Relatório completo de", "Informe completo de", "Full report for")} {dados.cidade}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
