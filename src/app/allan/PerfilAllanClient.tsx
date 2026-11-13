"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";

const WHATSAPP_ALLAN = "5524993326966";

function abrirWhats(msg: string) {
  const url = `https://wa.me/${WHATSAPP_ALLAN}?text=${encodeURIComponent(msg)}`;
  const passo = (window as unknown as { acWhats?: (u: string) => void }).acWhats;
  if (passo) passo(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}

const CENAS_KEYNOTE = [
  {
    tempo: 0,
    tag: "01 · RÉPLICA 3D + PIX DIRETO",
    titulo: "Cassa Rosa 3D",
    sub: "Seu cliente gira o chalé em 3D, ouve o mar e reserva no seu Pix sem comissão",
    href: "/cassarosa",
  },
  {
    tempo: 3.5,
    tag: "02 · GLOBO 3D INTERATIVO",
    titulo: "CarbonTrace 3D",
    sub: "Planeta 3D em tempo real no navegador com milhares de pontos clicáveis",
    href: "https://allancandido.com/portfolio/carbontrace/",
  },
  {
    tempo: 7.0,
    tag: "03 · O CAMPUS & MOTORES 3D",
    titulo: "O Campus & Masterclass 3D",
    sub: "Ambiente de ensino interativo e 6 arquiteturas 3D rodando a 120 FPS",
    href: "https://allancandido.com/portfolio/masterclass-3d/",
  },
  {
    tempo: 10.5,
    tag: "04 · DASHBOARDS AUTOMÁTICOS",
    titulo: "Painéis & Mapas de Calor",
    sub: "Gráficos, preços e alertas que se atualizam sozinhos todos os dias",
    href: "https://allancandido.com/ferramentas",
  },
  {
    tempo: 14.0,
    tag: "05 · PLATAFORMAS COM MAPA GPS",
    titulo: "JobPago & VisitePrado",
    sub: "Portais completos com login, mapa ao vivo, QR Code e print automático de sites",
    href: "/",
  },
];

export default function PerfilAllanClient() {
  const [idioma] = useIdioma();
  const [xrayActive, setXrayActive] = useState(false);
  const [fps, setFps] = useState(120);
  const [abaAtiva, setAbaAtiva] = useState<"todos" | "software" | "ia" | "drone" | "foto360">("todos");
  const [cenaAtiva, setCenaAtiva] = useState(0);
  const [comSomKeynote, setComSomKeynote] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measureFps = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(120, Math.max(60, Math.round((frameCount * 1000) / (now - lastTime)))));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measureFps);
    };

    animId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  const t = (pt: string, es: string, en: string) => L(idioma, pt, es, en);

  function irParaCena(idx: number) {
    setCenaAtiva(idx);
    if (videoRef.current) {
      videoRef.current.currentTime = CENAS_KEYNOTE[idx].tempo;
      videoRef.current.play().catch(() => {});
    }
  }

  function alternarSomKeynote() {
    if (!videoRef.current) return;
    const novoSom = !comSomKeynote;
    videoRef.current.muted = !novoSom;
    if (novoSom) {
      videoRef.current.play().catch(() => {});
    }
    setComSomKeynote(novoSom);
  }

  return (
    <div className="relative">
      {/* OVERLAY MODO RAIO-X (SÓ APARECE QUANDO QUEM É TÉCNICO CLICA NO BOTÃO) */}
      {xrayActive && (
        <div
          className="fixed inset-0 pointer-events-none z-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(245, 158, 11, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.07) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      )}

      {/* BARRA DE TELEMETRIA FLUTUANTE NO MODO RAIO-X */}
      {xrayActive && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-cyan-400/50 rounded-2xl px-4 py-2.5 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-cyan-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            TAXA DE QUADROS: <strong>{fps} FPS</strong>
          </span>
          <span>BASTIDORES TÉCNICOS: <strong>Next.js + Three.js WebGL + Blender</strong></span>
          <span>SERVIDOR PRÓPRIO: <strong>Docker + VPS Dedicada</strong></span>
          <span>RECEBIMENTO: <strong>PIX Direto (0% comissão)</strong></span>
        </div>
      )}

      {/* ====================================================================
          CABEÇALHO DO PERFIL PROFISSIONAL NO JOBPAGO
          ==================================================================== */}
      <section className="glass-panel rounded-3xl p-6 sm:p-10 border border-amber-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t(
                  "Perfil Oficial no JobPago · Ativo na Rota & Remoto",
                  "Perfil Oficial en JobPago · Activo en la Ruta y Remoto",
                  "Official JobPago Profile · Active on the Route & Remote"
                )}
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase">
                ⚡ Nível Lenda da Rota
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-slate-300 text-xs font-mono">
                CNPJ 62.685.514/0001-85
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.06]">
              Allan Cândido
            </h1>
            <p className="mt-2 text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300">
              {t(
                "Sites 3D & Sistemas Prontos para Vender · Atendimento Autônomo 24h com IA · Drone 4K · Tour Virtual 360°",
                "Sitios 3D y Sistemas Listos para Vender · Atención Autónoma 24h con IA · Dron 4K · Tour Virtual 360°",
                "3D Websites & Ready-to-Sell Systems · 24/7 Autonomous AI · 4K Drone · 360° Virtual Tours"
              )}
            </p>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              {t(
                "Você não precisa entender de programação para ter um sistema de alto nível trabalhando pela sua empresa. Eu entrego tudo pronto, testado e rodando no seu próprio endereço: desde sites onde seu cliente gira sua pousada ou produto em 3D e paga direto no seu Pix (sem pagar comissão para plataformas), até assistentes que respondem áudios no WhatsApp e atendem ligações 24h por dia, somados a filmagens aéreas com Drone 4K e Tours Virtuais 360°.",
                "No necesitás saber de programación para tener un sistema de primer nivel trabajando para tu empresa. Entrego todo listo y funcionando: desde sitios donde tu cliente gira tu posada o producto en 3D y paga directo por Pix, hasta asistentes que responden audios por WhatsApp las 24h, filmación con Dron 4K y Tours Virtuales 360°.",
                "You don't need to know tech jargon to have a world-class system working for your business. I deliver everything ready and running on your own domain: from 3D interactive websites with direct Pix booking (zero platform commissions) to 24/7 WhatsApp & phone AI receptionists, plus 4K Drone filming and 360° Virtual Tours."
              )}
            </p>

            {/* TAGS DAS TRIBOS / CATEGORIAS NO JOBPAGO */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["💻 Sites 3D & Sistemas Entregues Prontos", "bg-cyan-500/15 border-cyan-500/35 text-cyan-300"],
                ["🤖 Atendimento Autônomo 24h (WhatsApp & Voz)", "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"],
                ["🚁 Filmagem Aérea com Drone 4K", "bg-amber-500/15 border-amber-500/35 text-amber-300"],
                ["🌐 Fotografia 360° & Tour Virtual", "bg-purple-500/15 border-purple-500/35 text-purple-300"],
                ["📊 Painéis que Buscam Dados Sozinhos", "bg-pink-500/15 border-pink-500/35 text-pink-300"],
              ].map(([rotulo, cor]) => (
                <span key={rotulo} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${cor}`}>
                  {rotulo}
                </span>
              ))}
            </div>
          </div>

          {/* CARD LATERAL DE CONTRATAÇÃO DIRETA & MODO RAIO-X */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl bg-slate-950/80 border border-white/15 p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  {t("Atendimento Direto", "Atención Directa", "Direct Contact")}
                </span>
                <button
                  type="button"
                  onClick={() => setXrayActive(!xrayActive)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                    xrayActive
                      ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                      : "bg-white/[0.06] text-cyan-300 border-cyan-500/30 hover:border-cyan-400"
                  }`}
                >
                  🩻 {xrayActive ? "Bastidores ON" : "Ver Bastidores"}
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Modalidade:</span>
                  <strong className="text-white">100% Online ou Na Rota</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Pagamento:</span>
                  <strong className="text-amber-300">Pix Direto · 0% Comissão</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Rota Presencial:</span>
                  <strong className="text-emerald-300">Fortaleza → Paraty</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Permuta de Estadia:</span>
                  <strong className="text-white">Aceita na Expedição</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  abrirWhats(
                    "Olá Allan! Vi seu perfil no JobPago e quero conversar sobre um projeto para o meu negócio."
                  )
                }
                className="w-full btn-primary-amalfi py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <span>💬 Falar com Allan no WhatsApp</span>
              </button>
              <Link
                href="/refugio"
                className="w-full btn-secondary-glass py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 border-amber-500/30 hover:border-amber-400 flex items-center justify-center gap-1.5"
              >
                <span>🏨 Cadastrar Meu Negócio (Físico ou Online)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTRO RÁPIDO DAS 4 FRENTES DE ATUAÇÃO */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
          {[
            { id: "todos", label: "⚡ Visão Completa (Tudo o que Entrego Pronto)" },
            { id: "software", label: "💻 1. Sites 3D, Portais & Painéis Prontos" },
            { id: "ia", label: "🤖 2. Atendimento 24h no WhatsApp & Telefone" },
            { id: "drone", label: "🚁 3. Filmagens com Drone 4K" },
            { id: "foto360", label: "🌐 4. Fotografia 360° & Tour Virtual" },
          ].map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaAtiva(aba.id as typeof abaAtiva)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                abaAtiva === aba.id
                  ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg"
                  : "bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/30"
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>
      </section>

      {/* ====================================================================
          KEYNOTE SHOWCASE VIDEO (ESTILO APPLE / TESLA LAUNCH)
          Projetos 3D, Dashboards, O Campus e Portais rolando e sendo clicados
          ==================================================================== */}
      <section id="keynote-video" className="mt-10 glass-panel rounded-3xl p-5 sm:p-8 border border-cyan-500/35 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-mono font-bold uppercase tracking-wider">
              🎬 APRESENTAÇÃO KEYNOTE · PROJETOS EM AÇÃO NO NAVEGADOR
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white mt-2">
              Veja os Sites 3D, os Dashboards e O Campus Funcionando na Prática
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Assista aos projetos rolando e sendo clicados em tempo real (com trilha sonora estilo Keynote) ou clique em qualquer cena abaixo para pular direto.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={alternarSomKeynote}
              className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
                comSomKeynote
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-lg"
                  : "bg-white/[0.06] text-amber-300 border-amber-500/40 hover:border-amber-400"
              }`}
            >
              <span>{comSomKeynote ? "🔊 Música Keynote Ativa" : "🔈 Ativar Música de Keynote"}</span>
            </button>
            <a
              href="/vitrine/keynote-allan-3d.mp4"
              download="Keynote-Projetos-Allan-Candido.mp4"
              className="btn-secondary-glass px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 border-white/15 hover:border-white/40"
            >
              ⬇ Baixar Vídeo (.MP4)
            </a>
          </div>
        </div>

        {/* PLAYER DE VÍDEO KEYNOTE */}
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl relative">
          <video
            ref={videoRef}
            src="/vitrine/keynote-allan-3d.mp4"
            autoPlay
            loop
            muted={!comSomKeynote}
            playsInline
            controls
            onTimeUpdate={(e) => {
              const tAtual = e.currentTarget.currentTime;
              const idx = Math.min(CENAS_KEYNOTE.length - 1, Math.floor(tAtual / 3.5));
              if (idx !== cenaAtiva) setCenaAtiva(idx);
            }}
            className="w-full h-auto max-h-[540px] object-contain mx-auto"
          />
        </div>

        {/* SELETOR DE CENAS DO KEYNOTE (CLIQUE PARA PULAR OU ABRIR O PROJETO) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CENAS_KEYNOTE.map((c, idx) => {
            const ativo = cenaAtiva === idx;
            return (
              <div
                key={c.titulo}
                onClick={() => irParaCena(idx)}
                className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                  ativo
                    ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    : "bg-white/[0.03] border-white/10 hover:border-white/30"
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase block">{c.tag}</span>
                  <p className="text-sm font-black text-white mt-1">{c.titulo}</p>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">{c.sub}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-300">{ativo ? "▶ Passando agora" : "⏭ Ver no vídeo"}</span>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    className="text-cyan-300 hover:underline font-bold"
                  >
                    Abrir site ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          FRENTE 1: O QUE EU DEIXO PRONTO E FUNCIONANDO PARA O SEU NEGÓCIO
          (Linguagem clara para empresários e leigos, focada nos resultados reais)
          ==================================================================== */}
      {(abaAtiva === "todos" || abaAtiva === "software") && (
        <section id="software-personalizado" className="mt-14 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                01 · SITES 3D, SISTEMAS DE RESERVA, DASHBOARDS & PLATAFORMAS PRONTAS
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                O Que Eu Entrego Pronto e Funcionando para a Sua Empresa
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl">
                Em vez de falar difícil com siglas de informática, veja na prática o que eu construo e entrego pronto no endereço da sua empresa (`.com.br`), igual ao que já roda nos meus próprios negócios:
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                abrirWhats(
                  "Olá Allan! Vi seu perfil no JobPago e quero conversar sobre criar um site 3D / sistema sob medida para o meu negócio."
                )
              }
              className="btn-secondary-glass px-5 py-2.5 rounded-xl text-xs font-bold text-cyan-300 border-cyan-500/30 hover:border-cyan-400 shrink-0 cursor-pointer"
            >
              Pedir Orçamento para o Meu Negócio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ENTREGA PRONTA 1: MAQUETE 3D + RESERVA PIX DIRETO */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-pink-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-mono font-bold uppercase">
                    🏡 PARA POUSADAS, CHALÉS, HOTÉIS, BARCOS & PRODUTOS
                  </span>
                  <span className="text-xs font-mono text-emerald-300 font-bold">Zero comissão de terceiros</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  1. Site com Réplica 3D do Seu Espaço + Reserva Direta no Seu Pix
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong>O que você recebe pronto:</strong> Eu recrio o seu chalé, pousada, barco ou produto em <strong>3D idêntico às suas fotos reais</strong>. Quando o cliente abre o seu site no celular, a câmera passeia pelo seu espaço conforme ele rola a tela, ele escuta o som ambiente (como o barulho do mar), assiste aos vídeos reais lado a lado e já clica para <strong>reservar e pagar direto no seu Pix</strong> — sem você perder 15% a 20% de comissão para sites de reserva.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-200">
                  <li>✓ Réplica 3D fiel da sua arquitetura que abre leve em qualquer celular</li>
                  <li>✓ Vídeos verticais lado a lado, galeria de fotos reais e som ambiente</li>
                  <li>✓ Botões estilo jogo / aplicativo que levam o cliente direto para o seu WhatsApp e Pix</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-400">
                  Prova real pronta: <strong className="text-white">Cassa Rosa</strong>
                </span>
                <Link
                  href="/cassarosa"
                  className="btn-secondary-glass px-4 py-2 rounded-xl text-xs font-bold text-pink-300 border-pink-500/35 hover:border-pink-400"
                >
                  Testar Réplica 3D Cassa Rosa ao Vivo →
                </Link>
              </div>
            </div>

            {/* ENTREGA PRONTA 2: PLATAFORMAS COMPLETAS, MAPA GPS E VITRINE COM PRINT AUTOMÁTICO */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase">
                    🗺️ PARA REDES DE NEGÓCIOS, TURISMO & MARKETPLACES
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">Com login, mapa e QR Code</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  2. Portais Completos com Mapa GPS, Cadastro de Clientes e Vitrine Automática
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong>O que você recebe pronto:</strong> Uma plataforma completa com a sua marca onde seus clientes ou parceiros entram com login do Google, cadastram serviços ou estabelecimentos (físicos ou 100% online), colam os links dos sites deles (e o sistema <strong>tira o print da tela sozinho e monta os cards</strong>), aparecem no mapa interativo por cidade e recebem cartões digitais com QR Code.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-200">
                  <li>✓ Mapa ao vivo com rotas, cálculo de combustível/pedágio e guia de cidades</li>
                  <li>✓ Sistema de pontuação, níveis, selos de verificação e indicação premiada</li>
                  <li>✓ Funciona em português, espanhol e inglês com um clique</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-400">
                  Provas reais: <strong className="text-white">JobPago & VisitePrado</strong>
                </span>
                <a
                  href="https://www.visiteprado.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary-glass px-4 py-2 rounded-xl text-xs font-bold text-amber-300 border-amber-500/35 hover:border-amber-400"
                >
                  Ver Portal VisitePrado.com.br ↗
                </a>
              </div>
            </div>

            {/* ENTREGA PRONTA 3: PAINÉIS DE CONTROLE (DASHBOARDS) QUE BUSCAM DADOS SOZINHOS */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase">
                    📊 PARA QUEM QUER SAIR DAS PLANILHAS MANUAIS
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">Atualiza sozinho todo dia</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  3. Painéis de Controle (Dashboards) e Mapas Inteligentes em Tempo Real
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong>O que você recebe pronto:</strong> Em vez de perder horas copiando informações de vários sites para uma planilha, eu deixo pronto um painel visual no seu celular e computador que <strong>busca os dados sozinho todos os dias</strong>, organiza tudo em gráficos fáceis de ler, pinta mapas de calor por cidade ou região e avisa você no WhatsApp quando aparece uma oportunidade nova.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-200">
                  <li>✓ Filtros rápidos por cidade, estado, faixa de preço e categoria</li>
                  <li>✓ Comparador lado a lado com geração de imagem pronta para compartilhar</li>
                  <li>✓ Globo 3D e mapas interativos que mostram milhares de registros sem travar</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-400">
                  Prova real: <strong className="text-white">CarbonTrace 3D & Painéis ao Vivo</strong>
                </span>
                <a
                  href="https://allancandido.com/portfolio/carbontrace/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary-glass px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 border-cyan-500/35 hover:border-cyan-400"
                >
                  Abrir Globo 3D CarbonTrace ↗
                </a>
              </div>
            </div>

            {/* ENTREGA PRONTA 4: O CAMPUS, ÁREA DE MEMBROS & CATÁLOGOS DE MILHARES DE ITENS */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase">
                    🎓 PARA ESCOLAS, MENTORIAS, INFOPRODUTOS & LOJAS ONLINE
                  </span>
                  <span className="text-xs font-mono text-emerald-300 font-bold">Sem mensalidade de plataforma</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  4. O Campus (Área de Alunos Interativa), Livros Digitais & Catálogos de Lojas
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong>O que você recebe pronto:</strong> Uma plataforma de ensino e demonstração estilo <strong>O Campus</strong> ou uma vitrine comercial para milhares de produtos. Seus alunos ou clientes acessam aulas, apostilas interativas, calculadoras práticas e demonstrações ao vivo direto no navegador, ou compram produtos do seu catálogo com rapidez — tudo seu, sem ficar refém de mensalidades caras.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-200">
                  <li>✓ Leitor de livros e materiais didáticos online com sumário inteligente</li>
                  <li>✓ Laboratório interativo onde o aluno testa ferramentas em tempo real</li>
                  <li>✓ Vitrine comercial organizada para +5.000 itens com busca instantânea</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-400">
                  Prova real: <strong className="text-white">Masterclass 3D & O Campus</strong>
                </span>
                <a
                  href="https://allancandido.com/portfolio/masterclass-3d/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary-glass px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 border-emerald-500/35 hover:border-emerald-400"
                >
                  Explorar Masterclass 3D Ao Vivo ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          FRENTE 2: SISTEMAS AUTÔNOMOS DE ATENDIMENTO, VENDAS & OPERAÇÃO (IA)
          ==================================================================== */}
      {(abaAtiva === "todos" || abaAtiva === "ia") && (
        <section id="ia" className="mt-14 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                02 · SISTEMAS AUTÔNOMOS DE ATENDIMENTO, TRIAGEM & OPERAÇÃO COM IA
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                Atendimento 24h no WhatsApp, Recepção no 1º Toque & Automação Operacional
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl">
                Esqueça aqueles robôs irritantes de "digite 1, digite 2". Eu deixo pronto um assistente inteligente treinado com os preços e regras da sua empresa que escuta áudios longos, responde clientes de madrugada, agenda horários e prepara o fechamento no seu Pix.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                abrirWhats(
                  "Olá Allan! Vi seu perfil no JobPago e quero implantar um Sistema Autônomo de Atendimento 24h na minha empresa."
                )
              }
              className="btn-secondary-glass px-5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 border-emerald-500/30 hover:border-emerald-400 shrink-0 cursor-pointer"
            >
              Ver Demonstração no WhatsApp →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card IA 1: WhatsApp 24h */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase">
                    WHATSAPP & ÁUDIO 24H
                  </span>
                  <span className="text-xs font-mono text-slate-400">Zero fila de espera</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Central Autônoma de Atendimento & Reservas no WhatsApp
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Treinado com as tarifas, fotos, regras e catálogo real do seu negócio. Escuta áudios de clientes em segundos, responde em português, espanhol ou inglês, calcula o valor exato da estadia ou serviço e encaminha o resumo pronto para você receber no Pix.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li>✓ Ouve e entende mensagens de voz dos clientes</li>
                  <li>✓ Envia fotos, vídeos e localização automaticamente</li>
                  <li>✓ Tira todas as dúvidas antes de passar o pedido pronto para você</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  abrirWhats(
                    "Olá Allan! Quero implantar a Central Autônoma de Atendimento 24h no WhatsApp do meu negócio."
                  )
                }
                className="mt-6 w-full btn-primary-amalfi py-3 rounded-xl text-xs font-black cursor-pointer"
              >
                Implantar no Meu WhatsApp →
              </button>
            </div>

            {/* Card IA 2: Recepção Telefônica 24h */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase">
                    RECEPÇÃO TELEFÔNICA 24H
                  </span>
                  <span className="text-xs font-mono text-slate-400">Atende no 1º toque</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Atendimento que Não Perde Ligação + Agenda Integrada
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Todo telefone que toca sem resposta durante uma reunião, na estrada ou fora do horário comercial é um cliente indo para o concorrente. O sistema atende no seu próprio número, conversa naturalmente com o cliente, anota o pedido e já marca na sua agenda.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li>✓ Você continua usando o seu número de telefone atual</li>
                  <li>✓ Marca compromissos direto na sua agenda do celular</li>
                  <li>✓ Manda o resumo de quem ligou no seu WhatsApp na mesma hora</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  abrirWhats(
                    "Olá Allan! Quero conhecer o sistema de Recepção Telefônica 24h que atende no primeiro toque e agenda no calendário."
                  )
                }
                className="mt-6 w-full btn-secondary-glass py-3 rounded-xl text-xs font-bold text-amber-300 border-amber-500/30 hover:border-amber-400 cursor-pointer"
              >
                Testar Demonstração de Voz →
              </button>
            </div>

            {/* Card IA 3: Esteiras B2B & Backoffice */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-purple-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold uppercase">
                    PROSPECÇÃO & ROTINAS AUTOMÁTICAS
                  </span>
                  <span className="text-xs font-mono text-slate-400">Zero trabalho repetitivo</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Busca Automática de Novos Clientes & Organização Interna
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Deixo pronto um sistema que encontra novas empresas abrindo na sua cidade ou setor, organiza a lista de contatos comerciais, dispara lembretes, orçamentos e avisos automaticamente e mostra num painel simples quem respondeu e quem fechou.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li>✓ Encontra empresas do setor que você atende por cidade</li>
                  <li>✓ Envia relatórios, cobranças e avisos sem você precisar lembrar</li>
                  <li>✓ Painel simples para acompanhar cada venda do início ao Pix</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  abrirWhats(
                    "Olá Allan! Gostaria de conversar sobre automação de tarefas e busca de clientes para minha empresa."
                  )
                }
                className="mt-6 w-full btn-secondary-glass py-3 rounded-xl text-xs font-bold text-purple-300 border-purple-500/30 hover:border-purple-400 cursor-pointer"
              >
                Automatizar Minha Operação →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          FRENTE 3 & 4: FILMAGENS COM DRONE 4K & FOTOGRAFIA 360° INTERATIVA
          ==================================================================== */}
      {(abaAtiva === "todos" || abaAtiva === "drone" || abaAtiva === "foto360") && (
        <section id="drone-e-360" className="mt-14 scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FRENTE 3: DRONE 4K */}
          {(abaAtiva === "todos" || abaAtiva === "drone") && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/35 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-mono font-bold uppercase">
                    03 · CAPTAÇÃO AÉREA 4K HDR
                  </span>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                    Voo Homologado ANAC / DECEA
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  🚁 Filmagens Aéreas Cinematográficas com Drone
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Imagens aéreas mudam completamente a percepção de valor de uma pousada, hotel, chalé, marina ou empreendimento costeiro. Mostre a distância real da praia, o entorno preservado e a arquitetura vista do alto com qualidade de cinema em 4K.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-amber-300 uppercase">Reels, Shorts & Anúncios</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Vídeos verticais prontos para Instagram/TikTok e vídeos horizontais de cinema para a capa do seu site oficial.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-amber-300 uppercase">Obras, Fazendas & Inspeção</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Acompanhamento de evolução de obras, demarcação visual de áreas rurais/costeiras e inspeção de telhados/estruturas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-amber-300">
                  💰 Pix direto ou permuta de estadias na rota
                </span>
                <button
                  type="button"
                  onClick={() =>
                    abrirWhats(
                      "Olá Allan! Vi seu perfil no JobPago e tenho interesse em Filmagem Aérea com Drone 4K para meu estabelecimento/área."
                    )
                  }
                  className="btn-primary-amalfi px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer"
                >
                  Agendar Voo de Drone →
                </button>
              </div>
            </div>
          )}

          {/* FRENTE 4: FOTOGRAFIA 360° & TOUR VIRTUAL */}
          {(abaAtiva === "todos" || abaAtiva === "foto360") && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/35 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/35 text-purple-300 text-xs font-mono font-bold uppercase">
                    04 · IMERSÃO INTERATIVA 360°
                  </span>
                  <span className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 rounded-full">
                    CELULAR · COMPUTADOR · VR
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  🌐 Fotografia 360° & Tours Virtuais Interativos
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Permita que o seu cliente entre dentro da sua pousada, chalé, restaurante, barco ou espaço de eventos direto pela tela do celular antes de reservar. O Tour Virtual 360° elimina a dúvida de quem compra à distância e multiplica as reservas diretas.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-purple-300 uppercase">Passeio Cômodo a Cômodo</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Setas interativas ligando a recepção, piscina, varanda, quartos e praia, com giro livre em 360 graus no dedo ou no mouse.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-purple-300 uppercase">No Seu Site & no Google Maps</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Publicação das fotos 360° no Google Meu Negócio / Street View e tela interativa embutida no seu site com botão de reserva.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-purple-300">
                  ✨ Pacote completo: Drone 4K + Tour 360° + Site
                </span>
                <button
                  type="button"
                  onClick={() =>
                    abrirWhats(
                      "Olá Allan! Vi seu perfil no JobPago e tenho interesse em Fotografia 360° e Tour Virtual Interativo para o meu espaço."
                    )
                  }
                  className="btn-secondary-glass px-5 py-2.5 rounded-xl text-xs font-black text-purple-200 border-purple-500/40 hover:border-purple-400 cursor-pointer"
                >
                  Solicitar Tour Virtual 360° →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          VITRINE DE PROJETOS, SISTEMAS E EXPERIÊNCIAS 3D EM PRODUÇÃO
          (Mesmo formato de Cards com Print Automático disponível para todos os
          viajantes e donos de negócios no JobPago!)
          ==================================================================== */}
      <section id="vitrine-projetos" className="mt-16 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              VITRINE DE SITES COM PRINT AUTOMÁTICO · PROVAS REAIS NO AR
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
              Projetos 3D, Portais, Dashboards & O Campus Construídos por Mim
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl">
              Clique em qualquer card abaixo para abrir o projeto funcionando ao vivo. <strong>Nota:</strong> qualquer viajante ou dono de negócio (físico ou 100% online) também pode adicionar os links dos seus próprios sites no cadastro do JobPago e ter cards com print automático exatamente como estes!
            </p>
          </div>
          <Link
            href="/disponibilidade"
            className="btn-secondary-glass px-4 py-2.5 rounded-xl text-xs font-bold text-amber-300 border-amber-500/35 hover:border-amber-400 shrink-0"
          >
            + Adicionar Meus Sites no Meu Perfil →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              tag: "RÉPLICA 3D + RESERVA DIRETA PIX",
              titulo: "Cassa Rosa · Refúgio Pé na Areia 3D",
              url: "jobpago.com.br/cassarosa",
              href: "/cassarosa",
              imagem: "/vitrine/cassarosa-hero.webp",
              cor: "border-pink-500/40",
              desc: "O visitante gira o chalé em 3D pelo celular, escuta o som das ondas do mar, assiste aos vídeos verticais lado a lado e faz a reserva direto no Pix da pousada, sem pagar comissão.",
              cta: "Abrir Cassa Rosa 3D →",
              externo: false,
            },
            {
              tag: "GLOBO 3D EM TEMPO REAL NO NAVEGADOR",
              titulo: "CarbonTrace · Planeta 3D Interativo",
              url: "allancandido.com/portfolio/carbontrace",
              href: "https://allancandido.com/portfolio/carbontrace/",
              imagem: "/vitrine/carbontrace-earthrise.webp",
              cor: "border-cyan-500/40",
              desc: "Globo terrestre 3D interativo que mostra milhares de pontos no mapa mundial em tempo real. Você gira o planeta, clica em qualquer ponto e vê o painel completo na hora.",
              cta: "Abrir Globo 3D ao Vivo ↗",
              externo: true,
            },
            {
              tag: "QG VIRTUAL 3D DAS AGENTES DE IA",
              titulo: "O Campus 3D das Agentes & Robôs",
              url: "jobpago.com.br/campus",
              href: "/campus/",
              imagem: "/vitrine/campus-cards.webp",
              cor: "border-emerald-500/40",
              desc: "Escritório virtual 3D interativo estilo Apple Park com a rotina das agentes de IA (Sofia, Jarvis) trabalhando em tempo real, telemetria de tarefas e Quadro do Dinheiro.",
              cta: "Entrar no Campus 3D →",
              externo: false,
            },
            {
              tag: "DASHBOARDS QUE ATUALIZAM SOZINHOS",
              titulo: "Painéis de Controle & Mapas de Calor",
              url: "allancandido.com/ferramentas",
              href: "https://allancandido.com/ferramentas",
              imagem: "/vitrine/ferramentas-720.webp",
              cor: "border-amber-500/40",
              desc: "Painéis visuais que buscam informações oficiais todos os dias sozinhos, pintam mapas de calor das 5.570 cidades brasileiras e comparam municípios lado a lado.",
              cta: "Ver Dashboards ao Vivo ↗",
              externo: true,
            },
            {
              tag: "PLATAFORMA COM MAPA GPS & QR CODE",
              titulo: "JobPago.com.br · Rede de Negócios & Renda",
              url: "jobpago.com.br",
              href: "/",
              imagem: "/vitrine/jobpago-720.webp",
              cor: "border-amber-500/40",
              desc: "Conecta viajantes, profissionais remotos e negócios físicos ou 100% online. Inclui mapa GPS da rota Fortaleza → Paraty, vitrine automática de sites e contratação por Pix.",
              cta: "Explorar Plataforma →",
              externo: false,
            },
            {
              tag: "PORTAL DE TURISMO & MAPA DE PRAIAS",
              titulo: "VisitePrado.com.br · Costa das Baleias",
              url: "visiteprado.com.br",
              href: "https://www.visiteprado.com.br",
              imagem: "/vitrine/visiteprado-720.webp",
              cor: "border-cyan-500/40",
              desc: "Portal turístico completo com mapa interativo de praias, falésias, pousadas e passeios de barco em Prado, Cumuruxatiba e Corumbau (BA).",
              cta: "Visitar Portal ao Vivo ↗",
              externo: true,
            },
          ].map((proj) => (
            <div
              key={proj.titulo}
              className={`glass-panel rounded-3xl overflow-hidden border ${proj.cor} flex flex-col justify-between group hover:scale-[1.01] transition-all`}
            >
              <div>
                <div className="px-4 py-2.5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="truncate max-w-[200px]">{proj.url}</span>
                  <span className="text-amber-300">{proj.externo ? "↗" : "→"}</span>
                </div>

                <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
                  <img
                    src={proj.imagem}
                    alt={proj.titulo}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-white/15 text-[10px] font-mono font-bold text-amber-300 uppercase">
                    {proj.tag}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-black text-white">{proj.titulo}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">{proj.desc}</p>
                </div>
              </div>

              <div className="px-5 pb-5">
                {proj.externo ? (
                  <a
                    href={proj.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-secondary-glass py-2.5 px-4 rounded-xl text-xs font-bold text-white hover:border-amber-400 flex items-center justify-center gap-1.5"
                  >
                    <span>{proj.cta}</span>
                  </a>
                ) : (
                  <Link
                    href={proj.href}
                    className="w-full btn-secondary-glass py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 border-amber-500/30 hover:border-amber-400 flex items-center justify-center gap-1.5"
                  >
                    <span>{proj.cta}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          CTA FINAL DE CONTRATAÇÃO DIRETA NO PIX
          ==================================================================== */}
      <section className="mt-16 glass-panel rounded-3xl p-6 sm:p-10 border border-amber-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="max-w-2xl">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
            CONTRATAÇÃO DIRETA · SEM INTERMEDIÁRIOS · PIX OU PERMUTA NA ROTA
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Quer um site 3D, um painel automático, atendimento 24h no WhatsApp ou captação em Drone 4K e 360°?
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Fale diretamente comigo no WhatsApp. Explico tudo de forma simples, mostro exemplos funcionando na hora e entrego o sistema pronto para você usar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() =>
              abrirWhats(
                "Olá Allan! Vi seu perfil e o vídeo Keynote no JobPago e quero conversar sobre um projeto para o meu negócio."
              )
            }
            className="btn-primary-amalfi px-7 py-4 rounded-2xl text-sm font-black cursor-pointer text-center"
          >
            💬 Chamar Allan no WhatsApp →
          </button>
          <Link
            href="/viajante"
            className="btn-secondary-glass px-6 py-4 rounded-2xl text-xs font-bold text-slate-200 text-center"
          >
            Voltar ao Painel do Viajante
          </Link>
        </div>
      </section>
    </div>
  );
}
