"use client";

import { useState, useEffect } from "react";
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

export default function PerfilAllanClient() {
  const [idioma] = useIdioma();
  const [xrayActive, setXrayActive] = useState(false);
  const [fps, setFps] = useState(120);
  const [abaAtiva, setAbaAtiva] = useState<"todos" | "software" | "ia" | "drone" | "foto360">("todos");

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

  return (
    <div className="relative">
      {/* OVERLAY MODO RAIO-X DE ENGENHARIA */}
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
            RENDER: <strong>{fps} FPS</strong>
          </span>
          <span>STACK: <strong>Next.js + Three.js WebGL + Blender</strong></span>
          <span>INFRA: <strong>Hetzner VPS + Docker + Traefik v3</strong></span>
          <span>LIQUIDAÇÃO: <strong>PIX Direto (0% taxa)</strong></span>
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
                "Engenharia de Software Sob Medida · Sistemas Autônomos de IA · Filmagens com Drone 4K · Fotografia 360°",
                "Ingeniería de Software a Medida · Sistemas Autónomos de IA · Filmación con Dron 4K · Fotografía 360°",
                "Custom Software Engineering · Autonomous AI Systems · 4K Drone Filming · 360° Photography"
              )}
            </p>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              {t(
                "Desenvolvedor full-stack, arquiteto de sistemas autônomos e produtor audiovisual em expedição pelo litoral brasileiro (Fortaleza → Paraty). Construo desde plataformas completas, portais de reserva direta e sites 3D a 120 FPS até assistentes operacionais que atendem e vendem 24h no WhatsApp, aliados à captação presencial com Drone 4K e Tours Virtuais em 360° para pousadas, hotéis, marinas e empresas.",
                "Desarrollador full-stack, arquitecto de sistemas autónomos y productor audiovisual en expedición por la costa brasileña (Fortaleza → Paraty). Construyo desde plataformas completas, portales de reserva directa y sitios 3D a 120 FPS hasta asistentes operativos que atienden y venden 24h por WhatsApp, junto con filmación en Dron 4K y Tours Virtuales 360°.",
                "Full-stack software engineer, autonomous systems architect and audiovisual producer on an expedition along the Brazilian coast (Fortaleza → Paraty). I build everything from custom SaaS platforms, direct booking portals and 120 FPS 3D websites to 24/7 WhatsApp operational AI systems, combined with on-site 4K Drone filming and interactive 360° Virtual Tours."
              )}
            </p>

            {/* TAGS DAS TRIBOS / CATEGORIAS NO JOBPAGO */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["💻 Tecnologia & Software Sob Medida", "bg-cyan-500/15 border-cyan-500/35 text-cyan-300"],
                ["🤖 Sistemas Autônomos & IA Operacional", "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"],
                ["🚁 Filmagem Aérea com Drone 4K", "bg-amber-500/15 border-amber-500/35 text-amber-300"],
                ["🌐 Fotografia 360° & Tour Virtual", "bg-purple-500/15 border-purple-500/35 text-purple-300"],
                ["🎨 WebGL 3D & Design 120 FPS", "bg-pink-500/15 border-pink-500/35 text-pink-300"],
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
                  🩻 {xrayActive ? "Raio-X ON" : "Modo Raio-X"}
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Modalidade:</span>
                  <strong className="text-white">100% Remoto ou Na Rota</strong>
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
                  <span className="text-slate-400">Permuta de Hospedagem:</span>
                  <strong className="text-white">Aceita na Expedição</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  abrirWhats(
                    "Olá Allan! Vi seu perfil profissional no JobPago (Software, Sistemas Autônomos de IA, Drone e Foto 360°) e gostaria de conversar sobre um projeto."
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
                <span>🏨 Pedir Visita no Meu Estabelecimento</span>
              </Link>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTRO RÁPIDO DAS 4 FRENTES DE ATUAÇÃO */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
          {[
            { id: "todos", label: "⚡ Visão Completa (4 Frentes)" },
            { id: "software", label: "💻 1. Software Sob Medida & Web 120 FPS" },
            { id: "ia", label: "🤖 2. Sistemas Autônomos & Operação IA" },
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
          FRENTE 1: DESENVOLVIMENTO DE SOFTWARE PERSONALIZADO & WEB 3D 120 FPS
          ==================================================================== */}
      {(abaAtiva === "todos" || abaAtiva === "software") && (
        <section id="software-personalizado" className="mt-12 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                01 · ENGENHARIA DE SOFTWARE & SISTEMAS SOB MEDIDA
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                Desenvolvimento de Software Personalizado & Sites 3D a 120 FPS
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl">
                Aplicações web modernas, plataformas SaaS, motores de reserva direta sem comissão e experiências interativas 3D esculpidas no Blender — sem templates prontos e sem lentidão.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                abrirWhats(
                  "Olá Allan! Vi seu perfil no JobPago e quero conversar sobre desenvolvimento de software personalizado / site de alta conversão."
                )
              }
              className="btn-secondary-glass px-5 py-2.5 rounded-xl text-xs font-bold text-cyan-300 border-cyan-500/30 hover:border-cyan-400 shrink-0 cursor-pointer"
            >
              Solicitar Orçamento de Software →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel rounded-3xl p-6 border border-cyan-500/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">⚙️</span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    FULL-STACK & SAAS
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Sistemas Web Personalizados & Portais
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Desenvolvimento de plataformas do zero em Next.js, React, Node.js, Python e PostgreSQL: áreas de membros, painéis operacionais, gestão de pedidos, controle de frotas, assinaturas e integração direta com Pix (Mercado Pago, Asaas, bancos) e ERPs.
                </p>
              </div>
              <p className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-cyan-300">
                ✓ Código próprio · Zero mensalidade de plataforma alugada
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-cyan-500/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">🧊</span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                    BLENDER + WEBGL 120 FPS
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Réplicas 3D & Sites Cinematográficos
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Modelagem 3D fiel da arquitetura da sua pousada, produto ou empreendimento no Blender e renderização interativa no navegador com Three.js a 120 FPS, áudio espacial e rolagem fluida (como no projeto Cassa Rosa).
                </p>
              </div>
              <Link
                href="/cassarosa"
                className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono font-bold text-pink-300 hover:underline flex items-center justify-between"
              >
                <span>Ver réplica 3D Cassa Rosa ao vivo</span>
                <span>↗</span>
              </Link>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-cyan-500/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">📡</span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    PIPELINES & APIS
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Engenharia de Dados & Integrações
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Coletores automatizados (ETL), integração de múltiplas APIs REST/GraphQL, cruzamento geoespacial (PostGIS / OpenStreetMap / OSRM), geração dinâmica de cards e relatórios automatizados em tempo real.
                </p>
              </div>
              <p className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-emerald-300">
                ✓ PostgreSQL · PostGIS · Webhooks em tempo real
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-cyan-500/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    DOCKER & VPS
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Infraestrutura Dedicada & Deploy Contínuo
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Arquitetura conteinerizada em Docker sobre servidores Linux dedicados (Hetzner VPS), com proxy reverso Traefik v3, certificados SSL automáticos, proteção Cloudflare e alta velocidade de carregamento (100 PageSpeed).
                </p>
              </div>
              <p className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-amber-300">
                ✓ Sub-50ms TTFB · Zero Downtime Deploy
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          FRENTE 2: SISTEMAS AUTÔNOMOS DE ATENDIMENTO, VENDAS & OPERAÇÃO (IA)
          (Termo executivo e prático no lugar de jargão genérico "agentes de IA")
          ==================================================================== */}
      {(abaAtiva === "todos" || abaAtiva === "ia") && (
        <section id="sistemas-autonomos-ia" className="mt-14 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                02 · SISTEMAS AUTÔNOMOS DE ATENDIMENTO, TRIAGEM & OPERAÇÃO COM IA
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                Atendimento 24h no WhatsApp, Recepção no 1º Toque & Automação Operacional
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl">
                Mais do que robôs de menu engessado: construo sistemas autônomos treinados nas regras da sua empresa que ouvem áudios, tiram dúvidas específicas, consultam agenda, calculam propostas e preparam o fechamento no Pix 24 horas por dia.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                abrirWhats(
                  "Olá Allan! Vi seu perfil no JobPago e quero implantar um Sistema Autônomo de Atendimento e Operação com IA na minha empresa."
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
                  Treinado com as tarifas, fotos, regras e catálogo real do seu negócio. Transcreve áudios longos de clientes em segundos, responde em português, espanhol ou inglês, calcula o valor exato da estadia ou serviço e encaminha o resumo pronto para você receber no Pix.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li>✓ Transcrição instantânea de mensagens de voz</li>
                  <li>✓ Envio contextual de fotos, vídeos e localização</li>
                  <li>✓ Triagem completa antes de acionar o dono</li>
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
                  Todo telefone que toca sem resposta durante uma reunião, na estrada ou fora do horário comercial é um cliente indo para o concorrente. O sistema entra como encaminhamento no seu próprio número, conversa naturalmente com o cliente e agenda direto no seu calendário ou CRM.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li>✓ Mantém o seu número atual (encaminhamento inteligente)</li>
                  <li>✓ Integração direta com Google Calendar e CRM</li>
                  <li>✓ Setup a partir de R$ 1.500 + acompanhamento direto</li>
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
                    PROSPECÇÃO B2B & CRM
                  </span>
                  <span className="text-xs font-mono text-slate-400">Dados Oficiais</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Esteiras de Vendas B2B & Automação de Processos Internos
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Conexão direta entre bases públicas (Receita Federal, Cadastur, CAGED) e fluxos automatizados (n8n, Python, APIs) para encontrar empresas reais do seu setor, enriquecer contatos PJ em conformidade com a LGPD e eliminar tarefas repetitivas de planilha.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <li>✓ Mapeamento de novos negócios abrindo por cidade</li>
                  <li>✓ Disparo de relatórios, cobranças e avisos por e-mail/WhatsApp</li>
                  <li>✓ Painel próprio de acompanhamento de conversão</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  abrirWhats(
                    "Olá Allan! Gostaria de conversar sobre automação operacional e esteiras de prospecção B2B para minha empresa."
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
                    SISANT / ANAC · DECEA
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
                      Vídeos verticais (9:16) prontos para Instagram/TikTok e vídeos horizontais (16:9) para o topo do seu site oficial.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-amber-300 uppercase">Obras, Fazendas & Inspeção</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Acompanhamento periódico de evolução de obras, demarcação visual de áreas rurais/costeiras e inspeção de coberturas.
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-400">
                  * Voos comerciais realizados com equipamento homologado (ANATEL), cadastro no SISANT (ANAC) e autorização de espaço aéreo no SARPAS (DECEA). Disponível nas paradas da Expedição Fortaleza → Paraty ou sob agendamento.
                </p>
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
                    WEB · MOBILE · VR
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  🌐 Fotografia 360° & Tours Virtuais Interativos
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Permita que o seu cliente entre dentro da sua pousada, chalé, restaurante, barco ou espaço de eventos direto pela tela do celular antes de reservar. O Tour Virtual 360° elimina a insegurança de quem compra à distância e multiplica as reservas diretas.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-purple-300 uppercase">Navegação Cômodo a Cômodo</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Hotspots interativos ligando a recepção, piscina, varanda, quartos e praia, com giro livre em 360 graus no dedo ou no mouse.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-xs font-mono font-bold text-purple-300 uppercase">Integrado ao Site & Google</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Publicação das fotos esféricas 360° no Google Street View / Meu Negócio e player leve embutido direto no seu site com botão de reserva.
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-400">
                  * Ideal para combinar no mesmo dia da visita presencial: captação em Drone 4K + Fotos 360° dos quartos + implantação do site próprio com reservas por Pix direto.
                </p>
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
          ==================================================================== */}
      <section id="vitrine-projetos" className="mt-16 scroll-mt-24">
        <div className="mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
            PROVAS REAIS EM PRODUÇÃO · CÓDIGO E DESIGN AUTORAIS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
            Sistemas, Portais & Experiências 3D Construídos por Allan Cândido
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl">
            Cada projeto abaixo está rodando ao vivo. Clique para abrir e testar a velocidade, a fluidez a 120 FPS e os fluxos de conversão no celular ou no computador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              tag: "BLENDER 3D + RESERVAS PIX DIRETO",
              titulo: "Cassa Rosa · Refúgio Pé na Areia",
              url: "jobpago.com.br/cassarosa",
              href: "/cassarosa",
              imagem: "/vitrine/visiteprado-720.webp",
              cor: "border-pink-500/40",
              desc: "Réplica arquitetônica 3D fiel do chalé esculpida no Blender e renderizada em tempo real com Three.js, som estéreo das ondas do mar, vídeos verticais lado a lado e motor de reserva direta sem taxas.",
              cta: "Abrir Cassa Rosa 3D →",
              externo: false,
            },
            {
              tag: "PLATAFORMA P2P · MAPA GPS & DADOS",
              titulo: "JobPago.com.br · Renda na Viagem",
              url: "jobpago.com.br",
              href: "/",
              imagem: "/vitrine/jobpago-720.webp",
              cor: "border-amber-500/40",
              desc: "Ecossistema completo conectando viajantes, profissionais remotos e negócios da rota Fortaleza → Paraty. Inclui mapa GPS com OSRM, relatórios por município, emissão de QR Code de visita e gamificação.",
              cta: "Explorar Plataforma →",
              externo: false,
            },
            {
              tag: "PORTAL TURÍSTICO & CARTOGRAFIA",
              titulo: "VisitePrado.com.br · Costa das Baleias",
              url: "visiteprado.com.br",
              href: "https://www.visiteprado.com.br",
              imagem: "/vitrine/visiteprado-720.webp",
              cor: "border-cyan-500/40",
              desc: "Guia independente e cartografia interativa de praias, falésias e passeios em Prado, Cumuruxatiba e Corumbau (BA), integrado ao OpenStreetMap.",
              cta: "Visitar Portal ao Vivo ↗",
              externo: true,
            },
            {
              tag: "BENCHMARK 6 MOTORES 3D · 120 FPS",
              titulo: "Masterclass 3D Scrollytelling",
              url: "allancandido.com/portfolio/masterclass-3d",
              href: "https://allancandido.com/portfolio/masterclass-3d/",
              imagem: "/vitrine/masterclass-3d.webp",
              cor: "border-emerald-500/40",
              desc: "Demonstração técnica ao vivo das 6 arquiteturas de animação 3D e WebGL na web: Canvas 2D a 120 FPS, Raymarching, CAD Clipping, SkinnedMesh, GPU Geospatial e Shaders táteis com áudio procedural.",
              cta: "Testar Benchmark 3D ↗",
              externo: true,
            },
            {
              tag: "TELEMETRIA & SHADERS WEBGL",
              titulo: "CarbonTrace Terminal 3D",
              url: "allancandido.com/portfolio/carbontrace",
              href: "https://allancandido.com/portfolio/carbontrace/",
              imagem: "/vitrine/carbontrace-720.webp",
              cor: "border-cyan-500/30",
              desc: "Interface interativa de rastreamento de emissões e logística global com visualização 3D acelerada por GPU e rolagem sincronizada a 120 FPS.",
              cta: "Abrir CarbonTrace 3D ↗",
              externo: true,
            },
            {
              tag: "E-COMMERCE · +5.000 PRODUTOS",
              titulo: "Vitrine Oficial Shopee (+5.000 Itens)",
              url: "shopee.com.br/allancandido",
              href: "https://shopee.com.br/shop/1231340512",
              imagem: "/vitrine/ferramentas-720.webp",
              cor: "border-orange-500/40",
              desc: "Operação comercial multimercado com mais de 5.000 itens catalogados (eletrônicos, ferramentas, camping, automotivo e utilidades) com despacho nacional em 24h.",
              cta: "Acessar Loja Oficial ↗",
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
          CHAMADA FINAL DE CONTRATAÇÃO DIRETA (SEM INTERMEDIÁRIOS)
          ==================================================================== */}
      <section className="mt-16 glass-panel rounded-3xl p-7 sm:p-10 border border-amber-500/35 text-center">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          CONTATO DIRETO COM QUEM CONSTRÓI · 0% TAXA DE INTERMEDIAÇÃO
        </span>
        <h2 className="mt-2 text-2xl sm:text-4xl font-black text-white max-w-2xl mx-auto">
          Precisa de um sistema sob medida, automação de atendimento com IA, filmagem com drone ou tour 360°?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Fale direto comigo no WhatsApp. Combinamos o escopo, o prazo e o pagamento direto via Pix (ou permuta de estadia e parceria ao longo da Expedição Fortaleza → Paraty).
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              abrirWhats(
                "Olá Allan! Estou no seu perfil no JobPago e gostaria de solicitar um orçamento."
              )
            }
            className="btn-primary-amalfi px-7 py-4 rounded-2xl text-sm font-black cursor-pointer active:scale-95 transition-transform"
          >
            💬 Chamar Allan no WhatsApp Agora
          </button>
          <Link
            href="/cadastrar-servico?tipo=contratante"
            className="btn-secondary-glass px-6 py-4 rounded-2xl text-xs sm:text-sm font-bold text-white"
          >
            📋 Publicar Demanda na Rede JobPago
          </Link>
          <Link
            href="/viajante"
            className="btn-secondary-glass px-6 py-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-300"
          >
            🛡️ Ir para o Painel do Viajante
          </Link>
        </div>
      </section>
    </div>
  );
}
