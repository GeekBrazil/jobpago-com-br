"use client";

import { useEffect, useState } from "react";
import DeclaracaoMaioridade from "@/components/DeclaracaoMaioridade";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import { TXT, CONTRIBUICOES } from "@/lib/textosEstrada";
import { RECOMPENSAS, PONTOS, pontosParaNivel } from "@/lib/reputacao";
import { CATEGORIAS } from "@/data/categorias";
import { TIPOS_REFUGIO, TIPOS_NEGOCIO_ONLINE, OFERECE } from "@/data/honra";
import { VitrineSitesCards, CampoSitesPortfolio } from "@/components/VitrineSitesCards";

interface ServicoViajante {
  id: number;
  faz: string;
  categorias: string[];
  modo: string | null;
  quando: string | null;
  sites_links?: string[];
  status: string;
  quando_cadastrado: string;
}

interface EstabelecimentoViajante {
  id: number;
  nome: string;
  tipo: string;
  cidade: string;
  uf: string;
  responsavel: string | null;
  whatsapp: string;
  site: string | null;
  sites_links?: string[];
  oferece: string[];
  preco_noite: string | null;
  mensagem: string | null;
  status: string;
  quando_cadastrado: string;
}

interface Perfil {
  logado: boolean;
  nome?: string;
  maior18?: boolean;
  pontos: number;
  nivel: number;
  titulo: string;
  base: number;
  proximo: number;
  progresso: number;
  confirmadas: number;
  pendentes: number;
  questionario: boolean;
  servicos?: ServicoViajante[];
  estabelecimentos?: EstabelecimentoViajante[];
  recentes: {
    id: number;
    tipo: string;
    status: "pendente" | "confirmada" | "recusada";
    pontos: number;
    nome: string | null;
    cidade: string | null;
    uf: string | null;
    quando: string;
  }[];
}

const nf = new Intl.NumberFormat("pt-BR");

const UFS = "BR AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const MODOS_OPCOES = [
  { id: "ambos", rotulo: "Remoto ou Presencial" },
  { id: "remoto", rotulo: "Apenas Remoto" },
  { id: "presencial", rotulo: "Apenas Presencial" },
];
const QUANDO_OPCOES = [
  { id: "agora", rotulo: "Posso começar já" },
  { id: "meio-periodo", rotulo: "Meio período" },
  { id: "fins-de-semana", rotulo: "Fins de semana" },
  { id: "integral", rotulo: "Tempo integral" },
];

export default function PainelViajante() {
  const [idioma, setIdioma] = useIdioma();
  const [p, setP] = useState<Perfil | null>(null);
  const [erro, setErro] = useState(false);
  const T = TXT[idioma];

  // Notificações Toast
  const [toast, setToast] = useState<string | null>(null);
  const avisar = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  // Estados de Edição de Serviço
  const [editServico, setEditServico] = useState<{
    id: number;
    faz: string;
    categorias: string[];
    modo: string;
    quando: string;
    sites_links: string[];
  } | null>(null);
  const [salvandoServico, setSalvandoServico] = useState(false);
  const [erroServico, setErroServico] = useState("");

  // Estados de Edição de Estabelecimento
  const [editEst, setEditEst] = useState<{
    id: number;
    nome: string;
    tipo: string;
    cidade: string;
    uf: string;
    responsavel: string;
    whatsapp: string;
    site: string;
    sites_links: string[];
    oferece: string[];
    preco_noite: string;
    mensagem: string;
  } | null>(null);
  const [salvandoEst, setSalvandoEst] = useState(false);
  const [erroEst, setErroEst] = useState("");

  useEffect(() => {
    fetch("/api/viajante")
      .then(async (r) => {
        if (r.status === 401) {
          setP({ logado: false } as Perfil);
          return;
        }
        setP(await r.json());
      })
      .catch(() => setErro(true));
  }, []);

  const nomeTipo = (id: string) =>
    CONTRIBUICOES.find((c) => c.id === id)?.nome[idioma] ??
    ({
      questionario: T.questionario,
      indicacao_verificado:
        idioma === "es" ? "Recomendado visitado" : idioma === "en" ? "Referral visited" : "Indicado visitado",
      indicacao_pagante:
        idioma === "es" ? "Recomendado contrató un plan" : idioma === "en" ? "Referral bought a plan" : "Indicado fechou plano",
    } as Record<string, string>)[id] ??
    id;

  // Conta antiga ou do Google: declara 18+ uma vez antes de usar o painel.
  const [marcou18, setMarcou18] = useState(false);
  async function declarar18() {
    const r = await fetch("/api/auth/maioridade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maior18: true }),
    });
    if (r.ok) setP((atual) => (atual ? { ...atual, maior18: true } : atual));
  }

  const [comboio, setComboio] = useState<{ status: string } | null | undefined>(undefined);
  const [trecho, setTrecho] = useState("");
  useEffect(() => {
    fetch("/api/comboio")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setComboio(j?.inscrito ?? null))
      .catch(() => setComboio(null));
  }, []);

  async function entrarComboio() {
    const r = await fetch("/api/comboio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trecho }),
    });
    if (r.ok) setComboio({ status: "inscrito" });
  }

  // --- Handlers de Abertura de Edição ---
  function abrirEdicaoServico(s: ServicoViajante) {
    setErroServico("");
    setEditServico({
      id: s.id,
      faz: s.faz || "",
      categorias: s.categorias || [],
      modo: s.modo || "ambos",
      quando: s.quando || "agora",
      sites_links: s.sites_links || [],
    });
  }

  function toggleCategoriaServico(catId: string) {
    if (!editServico) return;
    const cats = editServico.categorias.includes(catId)
      ? editServico.categorias.filter((c) => c !== catId)
      : [...editServico.categorias, catId];
    setEditServico({ ...editServico, categorias: cats });
  }

  async function salvarEdicaoServico(e: React.FormEvent) {
    e.preventDefault();
    if (!editServico) return;
    setErroServico("");
    setSalvandoServico(true);
    try {
      const res = await fetch("/api/viajante/servico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editServico),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErroServico(data.erro || "Não foi possível salvar o serviço.");
        setSalvandoServico(false);
        return;
      }
      setP((atual) => {
        if (!atual || !atual.servicos) return atual;
        return {
          ...atual,
          servicos: atual.servicos.map((s) => (s.id === editServico.id ? { ...s, ...data.servico } : s)),
        };
      });
      setEditServico(null);
      avisar("✓ Serviço atualizado com sucesso!");
    } catch {
      setErroServico("Erro de conexão ao salvar.");
    } finally {
      setSalvandoServico(false);
    }
  }

  function abrirEdicaoEstabelecimento(est: EstabelecimentoViajante) {
    setErroEst("");
    setEditEst({
      id: est.id,
      nome: est.nome || "",
      tipo: est.tipo || "pousada",
      cidade: est.cidade || "",
      uf: est.uf || "CE",
      responsavel: est.responsavel || "",
      whatsapp: est.whatsapp || "",
      site: est.site || "",
      sites_links: est.sites_links || (est.site && est.site.includes(".") ? [est.site] : []),
      oferece: est.oferece || [],
      preco_noite: est.preco_noite || "",
      mensagem: est.mensagem || "",
    });
  }

  function toggleOfereceEst(item: string) {
    if (!editEst) return;
    const items = editEst.oferece.includes(item)
      ? editEst.oferece.filter((o) => o !== item)
      : [...editEst.oferece, item];
    setEditEst({ ...editEst, oferece: items });
  }

  async function salvarEdicaoEstabelecimento(e: React.FormEvent) {
    e.preventDefault();
    if (!editEst) return;
    setErroEst("");
    setSalvandoEst(true);
    try {
      const res = await fetch("/api/viajante/estabelecimento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEst),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErroEst(data.erro || "Não foi possível salvar o estabelecimento.");
        setSalvandoEst(false);
        return;
      }
      setP((atual) => {
        if (!atual || !atual.estabelecimentos) return atual;
        return {
          ...atual,
          estabelecimentos: atual.estabelecimentos.map((eItem) =>
            eItem.id === editEst.id ? { ...eItem, ...data.estabelecimento } : eItem
          ),
        };
      });
      setEditEst(null);
      avisar("✓ Estabelecimento atualizado com sucesso!");
    } catch {
      setErroEst("Erro de conexão ao salvar.");
    } finally {
      setSalvandoEst(false);
    }
  }

  return (
    <div>
      {/* Toast flutuante de feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm animate-bounce">
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{T.painel}</p>
        <SeletorIdioma idioma={idioma} onChange={setIdioma} />
      </div>

      {erro && <p className="mt-6 text-rose-300">Erro ao carregar. Tente de novo.</p>}
      {!p && !erro && <p className="mt-6 text-slate-400">Carregando painel…</p>}

      {p && !p.logado && (
        <div className="mt-8 glass-panel rounded-3xl p-7">
          <h1 className="text-3xl sm:text-4xl font-black">
            {idioma === "es" ? "Alimentá la ruta y subí de nivel" : idioma === "en" ? "Feed the route and level up" : "Alimente a rota e suba de nível"}
          </h1>
          <p className="mt-3 text-slate-300">
            {idioma === "es"
              ? "Cada foto, lugar para dormir o precio que confirmás ayuda a otro viajero — y suma puntos: del Andarilho a la Leyenda de la Ruta."
              : idioma === "en"
              ? "Every photo, place to sleep or price you confirm helps another traveller — and earns points: from Wanderer to Legend of the Route."
              : "Cada foto, lugar para dormir ou preço que você confirma ajuda outro viajante — e vale pontos: do Andarilho à Lenda da Rota."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/entrar?callbackUrl=/viajante" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">
              {T.entrar}
            </Link>
            <Link href="/cadastrar" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">
              {idioma === "es" ? "Crear cuenta" : idioma === "en" ? "Create account" : "Criar conta"}
            </Link>
            <Link href="/allan" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold text-amber-300 border-amber-500/35 hover:border-amber-400">
              ⚡ {idioma === "es" ? "Ver Perfil Allan Cândido (Software, IA, Dron y 360°)" : idioma === "en" ? "View Allan Cândido Profile (Software, AI, Drone & 360°)" : "Ver Perfil Allan Cândido (Software, IA, Drone & 360°)"} →
            </Link>
          </div>
        </div>
      )}

      {p && p.logado && !p.maior18 && (
        <div className="mt-8 glass-panel rounded-3xl p-7 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-black">
            {idioma === "es" ? "Antes de seguir" : idioma === "en" ? "Before you continue" : "Antes de continuar"}
          </h1>
          <p className="mt-3 text-slate-300">
            {idioma === "es"
              ? "Los Términos de Uso cambiaron: JobPago es solo para mayores de 18 años."
              : idioma === "en"
              ? "The Terms of Use changed: JobPago is for people aged 18 or over."
              : "Os Termos de Uso mudaram: a JobPago é só para maiores de 18 anos."}
          </p>
          <div className="mt-5">
            <DeclaracaoMaioridade idioma={idioma} marcado={marcou18} onChange={setMarcou18} />
          </div>
          <button
            type="button"
            disabled={!marcou18}
            onClick={declarar18}
            className="mt-5 btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black disabled:opacity-40"
          >
            {idioma === "es" ? "Confirmar" : idioma === "en" ? "Confirm" : "Confirmar"}
          </button>
        </div>
      )}

      {p && p.logado && p.maior18 && (
        <>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight">{p.nome}</h1>
          <div className="mt-6 glass-panel rounded-3xl p-6">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <p className="text-4xl font-black text-amber-400 tabular-nums">
                {T.nivel} {p.nivel}
              </p>
              <p className="text-lg font-bold text-white">{p.titulo}</p>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-white/10" aria-hidden>
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${Math.max(2, Math.round(p.progresso * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {nf.format(p.pontos)} {T.pontos} · {nf.format(Math.max(0, p.proximo - p.pontos))} {T.proximo}
              {p.pendentes ? ` · ${p.pendentes} ${T.pendente}` : ""}
            </p>
          </div>

          {!p.questionario && (
            <Link
              href="/viajante/questionario"
              className="mt-5 block glass-panel rounded-3xl p-6 border border-amber-400/40 hover:border-amber-400 transition-colors"
            >
              <p className="font-black text-white">
                {T.questionario} · +{PONTOS.questionario} {T.pontos}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                {idioma === "es"
                  ? "Contanos cómo viajás y qué te cuesta más. 5 minutos."
                  : idioma === "en"
                  ? "Tell us how you travel and what's hardest. 5 minutes."
                  : "Conte como você viaja e o que é mais difícil. 5 minutos."}
              </p>
            </Link>
          )}

          {/* ====================================================================
              SERVIÇO CADASTRADO DO VIAJANTE (DISPONIBILIDADE) COM EDIÇÃO TOTAL
              ==================================================================== */}
          <div className="mt-8 glass-panel rounded-3xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  {idioma === "es" ? "Tu perfil profissional" : idioma === "en" ? "Your professional profile" : "Seu Perfil Profissional"}
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {idioma === "es" ? "Servicio que ofrecés en la ruta" : idioma === "en" ? "Service you offer on the route" : "Meu Serviço / O que Sei Fazer"}
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href="/allan"
                  className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl text-cyan-300 border-cyan-500/30 hover:border-cyan-400 active:scale-95 transition-transform"
                >
                  ⚡ Ver Perfil Completo Allan (Software, IA, Drone & 360°) ↗
                </Link>
                <Link
                  href="/disponibilidade"
                  className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  + Cadastrar outro serviço
                </Link>
              </div>
            </div>

            {p.servicos && p.servicos.length > 0 ? (
              <div className="mt-5 space-y-4">
                {p.servicos.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.categorias &&
                          s.categorias.map((cat) => (
                            <span
                              key={cat}
                              className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase"
                            >
                              {cat}
                            </span>
                          ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                          ● Ativo no radar
                        </span>
                        <button
                          type="button"
                          onClick={() => abrirEdicaoServico(s)}
                          className="px-3 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-black transition-colors"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal whitespace-pre-line">
                      "{s.faz}"
                    </p>
                    <VitrineSitesCards
                      sites={s.sites_links}
                      tituloSecao="Sites & Projetos Desenvolvidos (Print Automático)"
                    />
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-slate-400 flex-wrap">
                      <span>
                        {s.modo ? `Modo: ${s.modo}` : ""} {s.quando ? `· ${s.quando}` : ""}
                      </span>
                      <span>Cadastrado em {s.quando_cadastrado}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 text-center">
                <p className="text-sm text-slate-300">
                  {idioma === "es"
                    ? "Todavía no registraste qué sabés hacer. Contanos tus habilidades para recibir avisos de negocios y contrataciones directas por Pix."
                    : idioma === "en"
                    ? "You haven't listed what you do yet. Tell us your skills to receive direct contract opportunities via Pix."
                    : "Você ainda não cadastrou o que sabe fazer. Avise suas habilidades (vídeos, fotos, design, TI, frete) para receber propostas com Pix direto!"}
                </p>
                <Link
                  href="/disponibilidade"
                  className="mt-4 inline-flex btn-primary-amalfi text-xs font-black px-5 py-2.5 rounded-xl"
                >
                  Cadastrar meu serviço agora
                </Link>
              </div>
            )}
          </div>

          {/* ====================================================================
              ESTABELECIMENTO CADASTRADO DO VIAJANTE (REFÚGIO) COM EDIÇÃO TOTAL
              ==================================================================== */}
          <div className="mt-8 glass-panel rounded-3xl p-6 border border-emerald-500/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                  {idioma === "es" ? "Hospedaje & Punto de Apoyo" : idioma === "en" ? "Lodging & Support Point" : "Hospedagem & Ponto de Apoio"}
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {idioma === "es" ? "Mi Establecimiento en la Ruta" : idioma === "en" ? "My Business on the Route" : "Meu Estabelecimento na Rota"}
                </h2>
              </div>
              <Link
                href="/refugio"
                className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl text-emerald-300 border-emerald-500/30 hover:border-emerald-400 active:scale-95 transition-transform"
              >
                + Cadastrar outro local
              </Link>
            </div>

            {p.estabelecimentos && p.estabelecimentos.length > 0 ? (
              <div className="mt-5 space-y-4">
                {p.estabelecimentos.map((est) => (
                  <div key={est.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <div>
                        <span className="text-lg font-black text-white">{est.nome}</span>
                        <span className="ml-2 text-xs font-mono text-slate-400 uppercase">
                          ({est.tipo} · {est.cidade}/{est.uf})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold border ${
                            est.status === "verificado"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                              : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                          }`}
                        >
                          ● {est.status === "verificado" ? "Selo Verificado" : "Candidato a Selo Refúgio"}
                        </span>
                        <button
                          type="button"
                          onClick={() => abrirEdicaoEstabelecimento(est)}
                          className="px-3 py-1 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/40 text-emerald-300 text-xs font-black transition-colors"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>

                    {est.oferece && est.oferece.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {est.oferece.map((o) => (
                          <span
                            key={o}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/[0.06] text-slate-300 border border-white/10 uppercase"
                          >
                            ✓ {o}
                          </span>
                        ))}
                      </div>
                    )}

                    {est.mensagem && (
                      <p className="text-sm text-slate-200 leading-relaxed font-normal italic mb-3">
                        "{est.mensagem}"
                      </p>
                    )}

                    <VitrineSitesCards
                      sites={est.sites_links && est.sites_links.length > 0 ? est.sites_links : est.site ? [est.site] : []}
                      tituloSecao="Vitrine Online do Negócio (Print Automático)"
                    />

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-slate-400 flex-wrap">
                      <div className="flex items-center gap-3">
                        {est.preco_noite && <span className="font-bold text-amber-300">R$ {est.preco_noite} / noite</span>}
                        {est.responsavel && <span>Resp.: {est.responsavel}</span>}
                        {est.whatsapp && <span>WhatsApp: {est.whatsapp}</span>}
                        {est.site && <span className="text-slate-300">{est.site}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/card/refugio/${est.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold text-xs bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20"
                        >
                          <span>🪪</span> Ver Cartão do Refúgio ↗
                        </Link>
                        <span>· Cadastrado em {est.quando_cadastrado}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 text-center">
                <p className="text-sm text-slate-300">
                  {idioma === "es"
                    ? "Tenés posada, camping, hostel o punto de apoyo en la costa? Recibí la visita de la expedición con QR Code oficial."
                    : idioma === "en"
                    ? "Own a guesthouse, camping or support point on the coast? Get an official expedition visit."
                    : "Você tem pousada, camping, hostel ou ponto de apoio na rota? Receba a visita da nossa expedição e ganhe destaque no mapa!"}
                </p>
                <Link
                  href="/refugio"
                  className="mt-4 inline-flex btn-secondary-glass text-xs font-bold text-emerald-300 border-emerald-500/30 px-5 py-2.5 rounded-xl"
                >
                  Cadastrar meu estabelecimento
                </Link>
              </div>
            )}
          </div>

          <h2 className="mt-10 text-xl font-black">{T.contribuir}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONTRIBUICOES.map((c) => (
              <Link
                key={c.id}
                href={`/viajante/contribuir?tipo=${c.id}`}
                className="glass-panel rounded-2xl p-5 hover:border-amber-400/60 border border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{c.nome[idioma]}</p>
                  <span className="text-xs font-mono text-amber-300">+{PONTOS[c.id]}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{c.desc[idioma]}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/viajante/indicar"
              className="glass-panel rounded-2xl p-5 border border-amber-400/40 hover:border-amber-400 transition-colors"
            >
              <p className="font-bold text-white">
                {idioma === "es" ? "Recomendar y ganar" : idioma === "en" ? "Refer and earn" : "Indicar e ganhar"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {idioma === "es"
                  ? "50% de la primera cuota o 15% del plan anual de los negocios que recomiendes."
                  : idioma === "en"
                  ? "50% of the first month or 15% of the yearly plan of businesses you refer."
                  : "50% da 1ª mensalidade ou 15% do plano anual dos negócios que você indicar."}
              </p>
            </Link>
            <Link
              href="/viajante/expedicao"
              className="glass-panel rounded-2xl p-5 border border-amber-400/40 hover:border-amber-400 sm:col-span-2 transition-colors"
            >
              <p className="font-bold text-white">
                {idioma === "es" ? "Creá tu expedición" : idioma === "en" ? "Create your expedition" : "Crie sua expedição"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {idioma === "es"
                  ? "Tu viaje con página propia y patrocinio: el 85% es para vos. Nunca mostramos dónde estás agora."
                  : idioma === "en"
                  ? "Your trip with its own page and sponsorship: 85% goes to you. We never show where you are now."
                  : "Sua viagem com página própria e patrocínio: 85% vão para você. Nunca mostramos onde você está agora."}
              </p>
            </Link>
            <div className="glass-panel rounded-2xl p-5 border border-white/10">
              <p className="font-bold text-white">
                {idioma === "es" ? "Lugar en el convoy — gratis" : idioma === "en" ? "Seat in the convoy — free" : "Vaga no comboio — gratuita"}
              </p>
              {p.nivel >= 100 ? (
                comboio ? (
                  <p className="text-xs text-emerald-300 mt-1">
                    ✓ {idioma === "es" ? "Inscripto" : idioma === "en" ? "Signed up" : "Inscrito"}
                  </p>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={trecho}
                      onChange={(e) => setTrecho(e.target.value)}
                      placeholder={idioma === "es" ? "Tramo (ej.: Salvador → Recife)" : idioma === "en" ? "Stretch (e.g. Salvador → Recife)" : "Trecho (ex.: Salvador → Recife)"}
                      className="flex-1 min-w-0 rounded-xl bg-slate-900/80 border border-white/15 px-3 py-2 text-sm text-white"
                    />
                    <button onClick={entrarComboio} className="btn-primary-amalfi rounded-xl px-4 py-2 text-xs font-black">
                      {idioma === "es" ? "Quiero" : idioma === "en" ? "Join" : "Quero"}
                    </button>
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  {idioma === "es" ? "Se libera en el nivel 100" : idioma === "en" ? "Unlocks at level 100" : "Libera no nível 100"} · {nf.format(Math.max(0, pontosParaNivel(100) - p.pontos))} {T.pontos}
                </p>
              )}
            </div>
          </div>

          <h2 className="mt-10 text-xl font-black">
            {idioma === "es" ? "Lo que desbloqueás" : idioma === "en" ? "What you unlock" : "O que você desbloqueia"}
          </h2>
          <ul className="mt-4 space-y-2">
            {RECOMPENSAS.map((r) => (
              <li
                key={r.nivel}
                className={`flex gap-3 items-start rounded-2xl p-3 border ${
                  p.nivel >= r.nivel ? "border-amber-400/50 bg-amber-400/10" : "border-white/10"
                }`}
              >
                <span className="font-mono text-xs font-bold text-amber-300 w-16 shrink-0">
                  {T.nivel} {r.nivel}
                </span>
                <span className="text-sm text-slate-200">
                  {r.titulo}
                  {r.parceiro ? <span className="text-slate-400"> · com os lugares parceiros</span> : null}
                </span>
              </li>
            ))}
          </ul>

          {p.recentes.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-black">
                {idioma === "es" ? "Tus contribuciones" : idioma === "en" ? "Your contributions" : "Suas contribuições"}
              </h2>
              <ul className="mt-4 divide-y divide-white/5">
                {p.recentes.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-200">
                      {nomeTipo(c.tipo)}
                      {c.nome ? ` · ${c.nome}` : ""}
                      {c.cidade ? ` · ${c.cidade}/${c.uf}` : ""}
                    </span>
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        c.status === "confirmada"
                          ? "text-emerald-300"
                          : c.status === "recusada"
                          ? "text-rose-300"
                          : "text-slate-400"
                      }`}
                    >
                      {c.status === "confirmada" ? `+${c.pontos} · ${T.confirmada}` : T[c.status]} · {c.quando}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* ====================================================================
          MODAL DE EDIÇÃO: MEU SERVIÇO / O QUE SEI FAZER
          ==================================================================== */}
      {editServico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-xl font-black text-white">✏️ Editar Meu Serviço</h3>
              <button
                type="button"
                onClick={() => setEditServico(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {erroServico && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                {erroServico}
              </div>
            )}

            <form onSubmit={salvarEdicaoServico} className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Áreas / Habilidades (escolha até 7)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.map((cat) => {
                    const ativo = editServico.categorias.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoriaServico(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          ativo
                            ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105"
                            : "bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  O que você faz / Como você trabalha
                </label>
                <textarea
                  rows={5}
                  maxLength={1200}
                  required
                  value={editServico.faz}
                  onChange={(e) => setEditServico({ ...editServico, faz: e.target.value })}
                  placeholder="Ex: Faço edição de vídeo, fotos com drone e gestão de Instagram para pousadas e restaurantes..."
                  className="w-full rounded-2xl bg-slate-950/80 border border-white/15 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
                <span className="text-[11px] text-slate-500 block text-right mt-1">
                  {editServico.faz.length}/1200 caracteres
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Modo de Atuação
                  </label>
                  <select
                    value={editServico.modo}
                    onChange={(e) => setEditServico({ ...editServico, modo: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {MODOS_OPCOES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.rotulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Disponibilidade
                  </label>
                  <select
                    value={editServico.quando}
                    onChange={(e) => setEditServico({ ...editServico, quando: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {QUANDO_OPCOES.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <CampoSitesPortfolio
                sites={editServico.sites_links}
                onChange={(novos) => setEditServico({ ...editServico, sites_links: novos })}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditServico(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoServico}
                  className="btn-primary-amalfi px-6 py-2.5 rounded-xl text-xs font-black disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {salvandoServico ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE EDIÇÃO: MEU ESTABELECIMENTO / REFÚGIO NA ROTA
          ==================================================================== */}
      {editEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-xl font-black text-white">✏️ Editar Estabelecimento</h3>
              <button
                type="button"
                onClick={() => setEditEst(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {erroEst && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                {erroEst}
              </div>
            )}

            <form onSubmit={salvarEdicaoEstabelecimento} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Nome do Estabelecimento *
                  </label>
                  <input
                    required
                    maxLength={120}
                    value={editEst.nome}
                    onChange={(e) => setEditEst({ ...editEst, nome: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={editEst.tipo}
                    onChange={(e) => {
                      const novoTipo = e.target.value;
                      const ehOnline = TIPOS_NEGOCIO_ONLINE.has(novoTipo);
                      setEditEst({
                        ...editEst,
                        tipo: novoTipo,
                        cidade: ehOnline ? "100% Online" : editEst.cidade,
                        uf: ehOnline ? "BR" : editEst.uf,
                      });
                    }}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {TIPOS_REFUGIO.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Cidade *
                  </label>
                  <input
                    required
                    maxLength={80}
                    value={editEst.cidade}
                    onChange={(e) => setEditEst({ ...editEst, cidade: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    UF *
                  </label>
                  <select
                    value={editEst.uf}
                    onChange={(e) => setEditEst({ ...editEst, uf: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Nome do Responsável
                  </label>
                  <input
                    maxLength={80}
                    value={editEst.responsavel}
                    onChange={(e) => setEditEst({ ...editEst, responsavel: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    WhatsApp com DDD *
                  </label>
                  <input
                    required
                    maxLength={24}
                    value={editEst.whatsapp}
                    onChange={(e) => setEditEst({ ...editEst, whatsapp: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Preço Médio por Noite (R$)
                  </label>
                  <input
                    placeholder="Ex: 150"
                    value={editEst.preco_noite}
                    onChange={(e) => setEditEst({ ...editEst, preco_noite: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Site ou Instagram
                  </label>
                  <input
                    placeholder="@pousadaexemplo ou site.com.br"
                    value={editEst.site}
                    onChange={(e) => setEditEst({ ...editEst, site: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Estrutura e Comodidades Oferecidas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OFERECE.map(([id, label]) => {
                    const tem = editEst.oferece.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleOfereceEst(id)}
                        className={`p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center gap-2 ${
                          tem
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                            : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <span>{tem ? "✓" : "○"}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Mensagem / Detalhes para a Expedição e Viajantes
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={editEst.mensagem}
                  onChange={(e) => setEditEst({ ...editEst, mensagem: e.target.value })}
                  placeholder="Conte mais sobre o local ou negócio online..."
                  className="w-full rounded-2xl bg-slate-950/80 border border-white/15 p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <CampoSitesPortfolio
                sites={editEst.sites_links}
                onChange={(novos) => setEditEst({ ...editEst, sites_links: novos })}
                rotulo="Sites, Loja Online ou Portfólio do Negócio (Print Automático)"
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditEst(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEst}
                  className="btn-primary-amalfi px-6 py-2.5 rounded-xl text-xs font-black disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {salvandoEst ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
