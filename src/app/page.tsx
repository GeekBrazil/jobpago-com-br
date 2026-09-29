"use client";

import { useEffect, useState } from "react";
import RendaNaCidade from "@/components/RendaNaCidade";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/MapaServicos";
import ModalPerfilRPG, { UserRPG, GUILD_DETAILS } from "@/components/ModalPerfilRPG";
import { FILTROS } from "@/data/categorias";
import { Icon } from "@/components/Icons";

const MapaServicos = dynamic(() => import("@/components/MapaServicos"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-3xl glass-panel flex flex-col items-center justify-center text-amber-400 gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
      <span className="text-xs font-black uppercase tracking-widest text-amber-400">Carregando Mapa Geolocalizado GPS…</span>
    </div>
  ),
});

export interface Job extends MapPoint {
  type: "Remoto" | "Presencial";
  isPixImmediate: boolean;
  postedAgo: string;
  proposalsCount: number;
  description: string;
  clientName: string;
  whatsapp: string;
  nomadFeatures?: string[];
  isFreeHonor?: boolean;
  tribo?: string;
  /** Estabelecimento visitado e verificado pessoalmente (ver /parceiros/planos e /certificados). */
  isVerifiedPartner?: boolean;
  /** Foto de contexto pro card do carrossel — opcional, nem toda vaga tem uma ainda. */
  imagemUrl?: string;
}

/* Perfil de quem chega: começa do zero (até 29/09 todo visitante via o perfil
   de demonstração "Allan C. — Nômade VIP", nível 14, como se fosse dele). */
const DEFAULT_RPG_USER: UserRPG = {
  name: "Viajante",
  email: "",
  level: 1,
  xp: 0,
  nextLevelXp: 500,
  title: "Recém-chegado à estrada",
  guild: "Nômades & Van Life",
  honorScore: 0,
  honorTitle: "Reputação a construir",
  stats: {
    velocidade: 0,
    confiabilidade: 0,
    hospitalidade: 0,
  },
  badges: [
    { id: "b1", icon: "bolt", title: "Primeiro Acordo PIX", desc: "1ª tarefa combinada e paga direto via PIX", unlocked: false },
    { id: "b2", icon: "shower", title: "Mestre da Carga 32A", desc: "Forneceu ou usou infra nômade verificada", unlocked: false },
    { id: "b3", icon: "compass", title: "Explorador da Rota", desc: "Indicou um lugar que virou Refúgio da Estrada", unlocked: false },
    { id: "b4", icon: "handshake", title: "Anfitrião de Alta Honra", desc: "Ofereceu apoio 100% cortesia a viajantes", unlocked: false },
  ],
  rewards: [
    {
      id: "r1",
      category: "Camping",
      icon: "tent",
      title: "Pernoite cortesia num Refúgio da Estrada parceiro",
      location: "Rota Paraty → Fortaleza",
      requiredLevel: 5,
      requiredHonor: 100,
      unlocked: false,
      claimed: false,
      description: "Liberado quando os primeiros Refúgios da Estrada forem verificados na Expedição nº 01.",
    },
    {
      id: "r4",
      category: "Comboio",
      icon: "tractor",
      title: "Vaga no Comboio da Expedição Paraty → Fortaleza",
      location: "Rota Litorânea (RJ -> BA -> CE)",
      requiredLevel: 15,
      requiredHonor: 300,
      unlocked: false,
      claimed: false,
      description: "Integração ao comboio da expedição com rádio comunicador, suporte mecânico mútuo e pontos de parada mapeados.",
    },
  ],
};

const REGRAS_HONRA = [
  {
    id: "gratuito",
    icon: "shield" as const,
    xp: "+200 XP",
    honra: "+50 PTS",
    title: "Apoio de cortesia",
    desc: "Ajudar de graça quem está na estrada — chuveiro, tomada, recarga, mentoria —, confirmado por quem recebeu.",
  },
  {
    id: "tarefa",
    icon: "bolt" as const,
    xp: "+150 XP",
    honra: "+10 PTS",
    title: "Tarefa concluída e paga",
    desc: "Cada tarefa fechada pela JobPago e confirmada pelas duas partes.",
  },
  {
    id: "nivel",
    icon: "medal" as const,
    xp: "×1,4",
    honra: "por nível",
    title: "Progressão meritocrática",
    desc: "A meta de XP do próximo nível sobe 40% a cada subida — nível alto é fruto de reputação real.",
  },
];

const CATEGORIES = FILTROS;

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // User State & RPG Modals
  const [user, setUser] = useState<UserRPG | null>(null);
  const [isRpgModalOpen, setIsRpgModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Vaga Nova

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Erro ao buscar vagas em tempo real:", err);
    }
  };

  useEffect(() => {
    fetchJobs();

    const storedUser = localStorage.getItem("jobpago_rpg_user");
    if (storedUser) {
      try {
        const salvo = JSON.parse(storedUser) as UserRPG;
        if (salvo.name === "Allan C. (Nômade VIP)") throw new Error("perfil de demonstração antigo");
        setUser(salvo);
      } catch {
        setUser(DEFAULT_RPG_USER);
        localStorage.setItem("jobpago_rpg_user", JSON.stringify(DEFAULT_RPG_USER));
      }
    } else {
      setUser(DEFAULT_RPG_USER);
      localStorage.setItem("jobpago_rpg_user", JSON.stringify(DEFAULT_RPG_USER));
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const publicJobs = jobs;


  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* TOAST FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-amber-500/40 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold text-white animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER RESPONSIVO ANTI-SOBREPOSIÇÃO ── */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:border-amber-400 transition-colors">
              <img
                src="/icon_flutuante-96.webp"
                width={96}
                height={96}
                alt="JobPago Logo"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                JobPago<span className="text-amber-400">.</span>
              </span>
              <span className="hidden sm:block text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                Renda & Estrada
              </span>
            </div>
          </Link>

          {/* NAVEGAÇÃO CENTRAL (DESKTOP) */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Link href="/como-funciona" className="hover:text-amber-400 transition-colors">
              Como Funciona
            </Link>
            <Link href="/cidade" className="hover:text-amber-400 transition-colors">
              Sua Cidade
            </Link>
            <Link href="/expedicao" className="hover:text-amber-400 transition-colors">
              Expedição
            </Link>
            <a href="#mapa-gps" className="hover:text-amber-400 transition-colors">
              Mapa GPS
            </a>
            <a href="#nomade-space" className="hover:text-amber-400 transition-colors">
              Infra Nômade
            </a>
            <Link href="/cadastrar-servico" className="hover:text-amber-400 transition-colors text-amber-400/90 flex items-center gap-1">
              <span>+ Oferecer ou Contratar</span>
            </Link>
            <a href="#guildas-leaderboard" className="hover:text-amber-300 transition-colors text-amber-400/90 flex items-center gap-1">
              <span>Alta Honra</span>
            </a>
            <a href="#refugio-estrada" className="hover:text-amber-400 transition-colors">
              Refúgios
            </a>
          </nav>

          {/* AÇÕES DIREITAS: PERFIL RPG + BOTÃO ANUNCIAR */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {user && (
              <button
                onClick={() => setIsRpgModalOpen(true)}
                className="flex items-center gap-2 glass-card rounded-2xl py-1.5 px-2.5 sm:px-3 hover:border-amber-500/40 border-white/10"
                title="Abrir Perfil de Gamificação & Recompensas"
              >
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="hidden sm:block text-[11px] sm:text-xs font-black text-white truncate max-w-[90px] sm:max-w-[120px]">
                      {user.name.split(" ")[0]}
                    </span>
                    <span className="max-[369px]:hidden text-[9px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
                      <Icon name="shield" width={24} height={24} /> {user.honorScore}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-amber-400 font-medium truncate max-w-[110px] hidden sm:flex items-center gap-1">
                    <Icon name={GUILD_DETAILS[user.guild]?.icon || "van"} width={26} height={26} /> Nível {user.level}
                  </span>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-md shrink-0">
                  <Icon name="gift" width={36} height={36} />
                </div>
              </button>
            )}

            <Link
              href="/disponibilidade"
              className="btn-primary-amalfi text-xs sm:text-base px-3 sm:px-6 py-2 sm:py-3 rounded-2xl shrink-0 cursor-pointer whitespace-nowrap"
            >
              {/* rótulo curto no celular: o header não cabe em 388px com o texto longo */}
              <span className="sm:hidden">Disponível</span>
              <span className="hidden sm:inline">Estou disponível</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* ── HERO BANNER REFINED OBSIDIAN & EMERALD ── */}
      <section className="relative hero-grid-pattern pt-6 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* BADGE DE CONFIANÇA PIX DIRETO */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-6 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            PIX COMBINADO DIRETO ENTRE AS PARTES · 0% DE COMISSÕES
          </div>

          {/* HEADLINE PRINCIPAL */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            Renda online & conexões para <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">nômades da estrada</span>
          </h1>

          {/* SUBHEADLINE */}
          <p className="mt-5 text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            De devs e criadores remotos a caminhoneiros, motorhomes e vans: quem trabalha e quem vive na estrada, no mesmo lugar. PIX combinado direto entre as partes, sem taxa de intermediação.
          </p>

          {/* OS DOIS PÚBLICOS: quem paga (negócio) e quem faz (renda) */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 text-left">
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/25">
              <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">Tenho um negócio</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">Mais clientes no bairro e na estrada</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Diga a tarefa (fotos, Instagram, cardápio, frete, atendimento) e encontre quem faz, com Pix direto. Ganhe o selo de estabelecimento verificado.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/cadastrar-servico?tipo=contratante" className="btn-primary-amalfi rounded-2xl px-5 py-3 text-sm font-black">Publicar uma tarefa</Link>
                <Link href="/cidade" className="btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold">Relatório da minha cidade</Link>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6 sm:p-7">
              <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">Quero renda</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">Trabalho de verdade, pago por Pix</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Conte o que você sabe fazer e de onde trabalha — da cidade, remoto ou na estrada. Quando um negócio precisar, você é chamado.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/disponibilidade" className="btn-primary-amalfi rounded-2xl px-5 py-3 text-sm font-black">Cadastrar minha disponibilidade</Link>
                <a href="#renda-na-cidade" className="btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold">Quanto se paga</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 1: MAPA GPS DE SERVIÇOS & ROTAS ── */}
      {/* renda com número oficial (CAGED) — o oposto da promessa de renda fácil */}
      <RendaNaCidade />

      <section id="mapa-gps" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              Geolocalização Ativa & OSRM Routing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Mapa GPS de serviços e rotas
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Trace sua rota. Os pontos de apoio verificados aparecem aqui conforme a Expedição nº 01 avança.
            </p>
          </div>

          {/* FILTRO POR CATEGORIA NO MAPA */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedCategory === cat.name
                    ? "bg-amber-500 text-black border-amber-400 font-black shadow-lg"
                    : "glass-card text-slate-300 border-white/10 hover:border-white/30"
                } flex items-center gap-1.5`}
              >
                <Icon name={cat.icon} width={30} height={30} /> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* COMPONENTE DO MAPA PÚBLICO */}
        <MapaServicos
          points={publicJobs}
          selectedCategory={selectedCategory}
          onSelectPoint={(point) => setSelectedJob(point as Job)}
        />
      </section>

      {/* ── SEÇÃO 2: DESTAQUE ESPAÇO NÔMADE DIGITAL ── */}
      <section id="nomade-space" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel glass-amalfi p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
          <Icon name="van" width={440} height={440} className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none" />

          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
              Apoio na estrada · verificado
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 flex items-center gap-3">
              <Icon name="van" width={60} height={60} /> Espaço Nômade & Apoio na Estrada
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Viajando de motorhome, campervan ou trabalhando remoto na estrada? Chuveiro quente, tomada 220V, internet e pernoite seguro entram no mapa conforme a Expedição nº 01 visita e verifica cada lugar.
            </p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Dono de posto, pousada ou camping na rota? Peça a visita e vire{" "}
              <Link href="/parceiros/planos" className="text-amber-400 underline hover:text-amber-300">
                parceiro verificado
              </Link>{" "}
              — ou Refúgio da Estrada, se tiver onde dormir.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="shower" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">Chuveiro Quente</span>
                <span className="text-[10px] text-slate-400">Banhos privativos</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="plug" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">Carga 110V/220V/32A</span>
                <span className="text-[10px] text-slate-400">Vans & Baterias</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="van" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">Motorhome & Garagem</span>
                <span className="text-[10px] text-slate-400">Pernoite seguro</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="wifi" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">Internet</span>
                <span className="text-[10px] text-slate-400">Velocidade medida</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/certificados"
                className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                <Icon name="shield" width={32} height={32} className="text-amber-300" /> Ver refúgios e lugares verificados
              </Link>
              <Link
                href="/contribuir"
                className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                <Icon name="pin" width={32} height={32} className="text-amber-400" /> Contribuir com uma Foto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4: SISTEMA DE ALTA HONRA & REPUTAÇÃO ── */}
      <section id="guildas-leaderboard" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel glass-amber p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
                <Icon name="shield" width={30} height={30} /> Gamificação Comunitária & Reputação
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                Como Funciona a Alta Honra
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                A reputação começa a contar com as primeiras tarefas fechadas e os primeiros Refúgios da Estrada verificados na Expedição nº 01. Até lá, todo mundo começa do zero — inclusive nós.
              </p>
            </div>

            {user && (
              <button
                onClick={() => setIsRpgModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-xl transition-all hover:scale-105 shrink-0 cursor-pointer flex items-center gap-2"
              >
                <Icon name="gift" width={34} height={34} /> Painel de Alta Honra & Benefícios
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {REGRAS_HONRA.map((regra) => (
              <div key={regra.id} className="glass-card p-6 rounded-2xl border border-amber-400/20 flex flex-col justify-between">
                <div>
                  <Icon name={regra.icon} width={64} height={64} className="mb-3 text-amber-300" />
                  <h3 className="text-lg font-black text-white mb-1">{regra.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{regra.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono">
                    {regra.xp}
                  </span>
                  <span className="text-xs font-black text-amber-300 bg-amber-950/60 border border-amber-400/30 px-2.5 py-1 rounded-lg font-mono">
                    {regra.honra}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 5: REFÚGIO DA ESTRADA — selo de lugar verificado para dormir ── */}
      <section id="refugio-estrada" className="pt-24 sm:pt-32 pb-32 sm:pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Icon name="shield" width={18} height={18} className="text-amber-400" />
            <span>Selo JobPago · lugar verificado para dormir</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Refúgio da Estrada
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Camping, hostel, pousada, hotel ou pátio para motorhome onde a gente passou a noite, conferiu e recomenda.
            Não é anúncio: só recebe o selo quem foi visitado pessoalmente na Expedição.
          </p>
        </div>

        {/* janela para o cenário 3D do fundo — ilustração, não um lugar real */}
        <div className="relative w-full rounded-3xl border border-amber-500/30 min-h-[520px] sm:min-h-[680px] flex flex-col justify-between p-6 sm:p-8 overflow-hidden bg-transparent shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9)] my-10 pointer-events-none">
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono font-bold tracking-wider text-amber-400 bg-slate-950/80 border border-amber-500/40 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              ILUSTRAÇÃO · COMO É UM REFÚGIO DA ESTRADA
            </span>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-slate-300 bg-slate-950/80 border border-white/10 p-3 sm:px-5 sm:py-2.5 rounded-2xl backdrop-blur-md w-full">
            <span className="font-bold text-white">Os primeiros refúgios serão verificados na Expedição nº 01</span>
            <span className="text-slate-400"> · Paraty → Fortaleza, pelo litoral</span>
          </div>
        </div>

        {/* O QUE CONFERIMOS PARA DAR O SELO */}
        <div className="mt-14 sm:mt-16">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white">O que conferimos antes de dar o selo</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Dormimos lá. O que está no selo é o que encontramos — não o que o lugar diz de si.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              ["lock", "Noite segura", "Portão, recepção ou vigia; onde deixar o carro, a moto ou o motorhome sem susto."],
              ["shower", "Banho quente e banheiro limpo", "Conferido na hora de usar, não pela foto."],
              ["plug", "Energia", "Tomada para carregar celular e notebook; ponto 220V para motorhome e van, quando houver — anotamos a amperagem."],
              ["wifi", "Internet que funciona", "Medimos a velocidade no quarto ou na área comum, para quem trabalha remoto."],
              ["water", "Água e cozinha", "Água potável; cozinha ou refeição por perto; descarte para motorhome, quando houver."],
              ["ticket", "Preço claro", "Anotamos quanto custou a noite e o que estava incluído — sem letra miúda."],
            ] as const).map(([icone, titulo, texto]) => (
              <div key={titulo} className="glass-card p-6 rounded-2xl border border-amber-400/20">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                  <Icon name={icone} width={32} height={32} />
                </div>
                <h4 className="text-base font-black text-white mb-2">{titulo}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Vale para camping, hostel, pousada, hotel e pátio de posto com pernoite. Cada refúgio mostra o que tem — e o que não tem.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/certificados"
              className="btn-primary-amalfi px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2"
            >
              <Icon name="tent" width={22} height={22} /> Ver refúgios verificados
            </Link>
            <Link
              href="/parceiros/planos"
              className="btn-secondary-glass px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center gap-2"
            >
              <Icon name="pin" width={20} height={20} /> Tenho um lugar na rota: quero a visita
            </Link>
          </div>
        </div>
      </section>

      {/* ── MODAL DETALHES DA VAGA ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl relative shadow-2xl">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            >
              <Icon name="close" width={34} height={34} />
            </button>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl uppercase">
                {selectedJob.category}
              </span>
              {selectedJob.isVerifiedPartner && (
                <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-1">
                  <Icon name="shield" width={28} height={28} /> Estabelecimento Certificado
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1"><Icon name="pin" width={28} height={28} /> {selectedJob.location}</span>
            </div>

            <h3 className="text-2xl font-black text-white leading-tight mb-3">
              {selectedJob.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-normal">
              {selectedJob.description}
            </p>

            {selectedJob.nomadFeatures && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedJob.nomadFeatures.map((f, i) => (
                  <span key={i} className="text-xs bg-amber-950/80 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-xl font-mono">
                    {f}
                  </span>
                ))}
              </div>
            )}

            <div className="bg-black/40 border border-white/10 p-4 rounded-2xl mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Valor Combinado</span>
                <span className="text-2xl font-black text-amber-400 font-mono flex items-center gap-2">
                  {selectedJob.budget === 0 ? (<><Icon name="shield" width={40} height={40} /> CORTESIA</>) : `R$ ${selectedJob.budget.toLocaleString("pt-BR")}`}
                </span>
              </div>
              <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1 font-mono">
                <Icon name="bolt" width={30} height={30} /> PIX Direto
              </span>
            </div>

            <button
              onClick={() => {
                const url = `https://wa.me/${selectedJob.whatsapp}?text=Olá,%20tenho%20interesse%20no%20serviço:%20${encodeURIComponent(selectedJob.title)}`;
                // passo de 1 toque (r.js) antes do WhatsApp; sem o script, abre direto
                const passo = (window as unknown as { acWhats?: (u: string) => void }).acWhats;
                if (passo) passo(url);
                else window.open(url, "_blank");
              }}
              className="btn-primary-amalfi w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon name="chat" width={36} height={36} /> Entrar em Contato Direto via WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PERFIL RPG & RECOMPENSAS ── */}
      {isRpgModalOpen && user && (
        <ModalPerfilRPG
          user={user}
          onClose={() => setIsRpgModalOpen(false)}
          onUpdateGuild={(g) => {
            const updated = { ...user, guild: g };
            setUser(updated);
            localStorage.setItem("jobpago_rpg_user", JSON.stringify(updated));
            showToast(`Você agora é membro oficial da guilda: ${g}`);
          }}
          onClaimReward={(rid) => {
            const updatedRewards = user.rewards.map((r) =>
              r.id === rid ? { ...r, claimed: true } : r
            );
            const updated = { ...user, rewards: updatedRewards };
            setUser(updated);
            localStorage.setItem("jobpago_rpg_user", JSON.stringify(updated));
            showToast("Recompensa resgatada com sucesso! Apresente o voucher no local.");
          }}
        />
      )}

      {/* ── FOOTER ELEGANTE ── */}
      </main>

      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · Marketplace Passivo mantido por Allan Candido.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/como-funciona" className="hover:text-amber-400 transition-colors">
              Como Funciona
            </Link>
            <Link href="/cidade" className="hover:text-amber-400 transition-colors">
              Relatório da cidade
            </Link>
            <Link href="/termos" className="hover:text-amber-400 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-amber-400 transition-colors">
              Política de Privacidade
            </Link>
            <a href="mailto:allan@jobpago.com.br" className="hover:text-amber-400 transition-colors">
              allan@jobpago.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
