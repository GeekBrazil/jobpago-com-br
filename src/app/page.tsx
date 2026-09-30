"use client";

import { useEffect, useState } from "react";
import RendaNaCidade from "@/components/RendaNaCidade";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";
import { tCategoria, tHonra } from "@/lib/traducoesCadastro";
import { NIVEIS_HONRA } from "@/data/honra";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/MapaServicos";
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

const CATEGORIES = FILTROS;

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // User State & RPG Modals
  const [idioma] = useIdioma();
  const [viajante, setViajante] = useState<{ nome: string; nivel: number } | null>(null);

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

    // nível real do viajante logado (reputação fica no banco, não no navegador)
    fetch("/api/viajante")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.logado) setViajante({ nome: d.nome, nivel: d.nivel }); })
      .catch(() => {});
  }, []);


  const publicJobs = jobs;


  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">

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
                {L(idioma, "renda na viagem", "ingresos en el viaje", "income on the go")}
              </span>
            </div>
          </Link>

          {/* NAVEGAÇÃO CENTRAL (DESKTOP) */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Link href="/como-funciona" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Como Funciona", "Cómo funciona", "How it works")}
            </Link>
            <Link href="/cidade" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Sua Cidade", "Tu ciudad", "Your town")}
            </Link>
            <Link href="/expedicao" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Expedição", "Expedición", "Expedition")}
            </Link>
            <a href="#mapa-gps" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Mapa GPS", "Mapa GPS", "GPS map")}
            </a>
            <a href="#nomade-space" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Infra Nômade", "Infra nómade", "Nomad infra")}
            </a>
            <Link href="/cadastrar-servico" className="hover:text-amber-400 transition-colors text-amber-400/90 flex items-center gap-1">
              <span>+ {L(idioma, "Oferecer ou Contratar", "Ofrecer o contratar", "Offer or hire")}</span>
            </Link>
            <a href="#guildas-leaderboard" className="hover:text-amber-300 transition-colors text-amber-400/90 flex items-center gap-1">
              <span>{L(idioma, "Alta Honra", "Alto Honor", "High Honour")}</span>
            </a>
            <a href="#refugio-estrada" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Pousos visitados", "Paradas visitadas", "Visited stopovers")}
            </a>
          </nav>

          {/* AÇÕES DIREITAS: PERFIL RPG + BOTÃO ANUNCIAR */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            <Link
              href="/viajante"
              className="flex items-center gap-2 glass-card rounded-2xl py-1.5 px-2.5 sm:px-3 hover:border-amber-500/40 border-white/10"
              title={L(idioma, "Seu painel de viagem: contribua e suba de nível", "Tu panel de viaje: contribuí y subí de nivel", "Your travel dashboard: contribute and level up")}
            >
              <div className="flex flex-col text-right">
                <span className="hidden sm:block text-[11px] sm:text-xs font-black text-white truncate max-w-[120px]">
                  {viajante ? viajante.nome.split(" ")[0] : L(idioma, "Viajante", "Viajero", "Traveller")}
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-400 font-medium flex items-center gap-1 justify-end">
                  <Icon name="shield" width={22} height={22} /> {viajante ? `${L(idioma, "Nível", "Nivel", "Level")} ${viajante.nivel}` : L(idioma, "Pontuar", "Sumar puntos", "Earn points")}
                </span>
              </div>
            </Link>

            <Link
              href="/disponibilidade"
              className="btn-primary-amalfi text-xs sm:text-base px-3 sm:px-6 py-2 sm:py-3 rounded-2xl shrink-0 cursor-pointer whitespace-nowrap"
            >
              {/* rótulo curto no celular: o header não cabe em 388px com o texto longo */}
              <span className="sm:hidden">{L(idioma, "Meu serviço", "Mi servicio", "My service")}</span>
              <span className="hidden sm:inline">{L(idioma, "Oferecer meu serviço", "Ofrecer mi servicio", "Offer my service")}</span>
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
            {L(idioma, "PIX COMBINADO DIRETO ENTRE AS PARTES · 0% DE COMISSÕES", "PIX ACORDADO DIRECTO ENTRE LAS PARTES · 0% DE COMISIONES", "PIX PAID DIRECTLY BETWEEN THE PARTIES · 0% COMMISSION")}
          </div>

          {/* HEADLINE PRINCIPAL */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            {L(idioma, "Renda online & conexões para ", "Ingresos online y conexiones para ", "Online income & connections for ")}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">{L(idioma, "quem vive viajando", "quien vive viajando", "people who live on the move")}</span>
          </h1>

          {/* SUBHEADLINE */}
          <p className="mt-5 text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            {L(idioma, "De devs e criadores remotos a caminhoneiros, motorhomes e vans: quem trabalha e quem vive viajando, no mesmo lugar. PIX combinado direto entre as partes, sem taxa de intermediação.", "De devs y creadores remotos a camioneros, motorhomes y vans: quien trabaja y quien vive en la ruta, en un mismo lugar. PIX acordado directo entre las partes, sin comisión de intermediación.", "From remote devs and creators to truckers, motorhomes and vans: people who work and live on the move, in one place. PIX paid directly between the parties, no middleman fee.")}
          </p>

          {/* OS DOIS PÚBLICOS: quem paga (negócio) e quem faz (renda) */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 text-left">
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/25">
              <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">{L(idioma, "Tenho um negócio", "Tengo un negocio", "I have a business")}</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">{L(idioma, "Mais clientes no bairro e na rota", "Más clientes en el barrio y en la ruta", "More customers in the neighbourhood and along the route")}</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {L(idioma, "Diga a tarefa (fotos, Instagram, cardápio, frete, atendimento) e encontre quem faz, com Pix direto. Receba o registro de visita da expedição.", "Contá la tarea (fotos, Instagram, menú, flete, atención) y encontrá quién la hace, con Pix directo. Recibí el registro de visita de la expedición.", "Describe the task (photos, Instagram, menu, freight, customer service) and find who does it, paid by Pix. Get an expedition visit record.")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/cadastrar-servico?tipo=contratante" className="btn-primary-amalfi rounded-2xl px-5 py-3 text-sm font-black">{L(idioma, "Publicar uma tarefa", "Publicar una tarea", "Post a task")}</Link>
                <Link href="/cidade" className="btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold">{L(idioma, "Relatório da minha cidade", "Informe de mi ciudad", "My town report")}</Link>
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6 sm:p-7">
              <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">{L(idioma, "Quero renda", "Quiero ingresos", "I want income")}</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">{L(idioma, "Trabalho de verdade, pago por Pix", "Trabajo de verdad, pagado por Pix", "Real work, paid by Pix")}</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {L(idioma, "Conte o que você sabe fazer e de onde trabalha — da cidade, remoto ou viajando. Quando um negócio precisar, você é chamado.", "Contá qué sabés hacer y desde dónde trabajás: en la ciudad, remoto o en la ruta. Cuando un negocio lo necesite, te llamamos.", "Tell us what you can do and where you work from — in town, remotely or while travelling. When a business needs it, we call you.")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/disponibilidade" className="btn-primary-amalfi rounded-2xl px-5 py-3 text-sm font-black">{L(idioma, "Cadastrar meu serviço", "Registrar mi servicio", "Register my service")}</Link>
                <a href="#renda-na-cidade" className="btn-secondary-glass rounded-2xl px-5 py-3 text-sm font-bold">{L(idioma, "Valores de referência", "Valores de referencia", "Reference rates")}</a>
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
              {L(idioma, "Geolocalização Ativa & OSRM Routing", "Geolocalización y rutas", "Geolocation & routing")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {L(idioma, "Mapa GPS de serviços e rotas", "Mapa GPS de servicios y rutas", "GPS map of services and routes")}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {L(idioma, "Trace sua rota. Os lugares visitados aparecem aqui conforme a Expedição nº 01 avança.", "Trazá tu ruta. Los lugares visitados aparecen aquí a medida que avanza la Expedición nº 01.", "Plot your route. Visited places show up here as Expedition no. 01 moves on.")}
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
                <Icon name={cat.icon} width={30} height={30} /> {cat.id === "todas" ? L(idioma, "Todas", "Todas", "All") : tCategoria(idioma, cat.id, cat.name)}
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
              {L(idioma, "Apoio na viagem · lugares visitados", "Apoyo en el viaje · lugares visitados", "Travel support · visited places")}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 flex items-center gap-3">
              <Icon name="van" width={60} height={60} /> {L(idioma, "Espaço Nômade & Apoio na Viagem", "Espacio nómade y apoyo en el viaje", "Nomad space & travel support")}
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              {L(idioma, "Viajando de motorhome, campervan ou trabalhando remoto enquanto viaja? Chuveiro quente, tomada 220V, internet e lugar para pernoitar entram no mapa conforme a Expedição nº 01 visita e registra cada lugar.", "¿Viajás en motorhome, campervan o trabajás remoto en la ruta? Ducha caliente, enchufe 220V, internet y lugar para pasar la noche entran al mapa a medida que la Expedición nº 01 visita y registra cada lugar.", "Travelling by motorhome or campervan, or working remotely while travelling? Hot showers, 220V power, internet and overnight stops go on the map as Expedition no. 01 visits and records each place.")}
            </p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {L(idioma, "Dono de posto, pousada ou camping na rota?", "¿Tenés estación, posada o camping en la ruta?", "Own a gas station, guesthouse or campsite on the route?")}{" "}
              <Link href="/refugio" className="text-amber-400 underline hover:text-amber-300">
                {L(idioma, "Peça a visita", "Pedí la visita", "Ask for a visit")}
              </Link>{" "}
              {L(idioma, "e vire Parceiro JobPago — ou Pouso visitado, se tiver onde dormir.", "y sé Socio JobPago — o Parada visitada, si tenés dónde dormir.", "and become a JobPago Partner — or a Visited stopover, if you have somewhere to sleep.")}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="shower" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">{L(idioma, "Chuveiro quente", "Ducha caliente", "Hot shower")}</span>
                <span className="text-[10px] text-slate-400">{L(idioma, "Banhos privativos", "Duchas privadas", "Private showers")}</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="plug" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">Carga 110V/220V/32A</span>
                <span className="text-[10px] text-slate-400">{L(idioma, "Vans & baterias", "Vans y baterías", "Vans & batteries")}</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="van" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">{L(idioma, "Motorhome & garagem", "Motorhome y garaje", "Motorhome & parking")}</span>
                <span className="text-[10px] text-slate-400">{L(idioma, "Pernoite", "Pernocte", "Overnight")}</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center flex flex-col items-center">
                <Icon name="wifi" width={52} height={52} className="mb-1 text-amber-400" />
                <span className="text-xs font-bold text-white block">Internet</span>
                <span className="text-[10px] text-slate-400">{L(idioma, "Velocidade medida", "Velocidad medida", "Measured speed")}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/certificados"
                className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                <Icon name="shield" width={32} height={32} className="text-amber-300" /> {L(idioma, "Ver lugares visitados", "Ver lugares visitados", "See visited places")}
              </Link>
              <Link
                href="/viajante/contribuir?tipo=fachada"
                className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                <Icon name="pin" width={32} height={32} className="text-amber-400" /> {L(idioma, "Contribuir e ganhar pontos", "Contribuir y sumar puntos", "Contribute and earn points")}
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
                <Icon name="shield" width={30} height={30} /> {L(idioma, "Registro de visita", "Registro de visita", "Visit record")}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                {L(idioma, "Alta Honra: como o lugar apoia a expedição", "Alto Honor: cómo el lugar apoya la expedición", "High Honour: how the place supports the expedition")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {L(idioma, "O registro de visita não é vendido. Parceiros pagantes aparecem em destaque e são sempre identificados como Parceiro. A Honra mostra quanto o lugar apoia a expedição — dinheiro e permuta no topo, depois só dinheiro, depois só permuta.", "El registro de visita no se vende. Los socios que pagan aparecen destacados y siempre identificados como Socio. El Honor muestra cuánto apoya el lugar a la expedición: dinero y canje arriba, después solo dinero, después solo canje.", "The visit record isn't sold. Paying partners are featured and always labeled as Partner. Honour shows how much the place supports the expedition — money plus exchange at the top, then money only, then exchange only.")}
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {NIVEIS_HONRA.map((n) => (
              <div key={n.id} className="glass-card p-6 rounded-2xl border border-amber-400/20 flex flex-col justify-between">
                <div>
                  <span className={`inline-block text-xs font-black px-3 py-1 rounded-full border ${n.cor}`}>{tHonra(idioma, n.id, "nome", n.nome)}</span>
                  <p className="mt-3 text-sm font-bold text-white">{tHonra(idioma, n.id, "como", n.como)}</p>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{tHonra(idioma, n.id, "desc", n.desc)}</p>
                </div>
                <p className="mt-4 pt-3 border-t border-white/10 text-[11px] text-amber-200/90 leading-relaxed">{tHonra(idioma, n.id, "ganha", n.ganha)}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/refugio" className="btn-primary-amalfi px-7 py-3 rounded-2xl text-sm font-black">{L(idioma, "Pedir a visita da Expedição", "Pedir la visita de la Expedición", "Ask for the Expedition's visit")}</Link>
            <Link href="/parceiros/planos" className="btn-secondary-glass px-7 py-3 rounded-2xl text-sm font-bold">{L(idioma, "Ver planos de parceiro", "Ver planes de socio", "See partner plans")}</Link>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 5: REFÚGIO DA ESTRADA — selo de lugar verificado para dormir ── */}
      <section id="refugio-estrada" className="pt-24 sm:pt-32 pb-32 sm:pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Icon name="shield" width={18} height={18} className="text-amber-400" />
            <span>{L(idioma, "Registro JobPago · lugar visitado para dormir", "Registro JobPago · lugar visitado para dormir", "JobPago record · visited place to sleep")}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {L(idioma, "Pouso visitado", "Parada visitada", "Visited stopover")}
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            {L(idioma, "Camping, hostel, pousada, hotel ou pátio para motorhome onde a expedição passou. Cada registro mostra a data e o que havia no dia.", "Camping, hostel, posada, hotel o patio para motorhome por donde pasó la expedición. Cada registro muestra la fecha y lo que había ese día.", "A campsite, hostel, guesthouse, hotel or motorhome yard the expedition passed through. Each record shows the date and what was there that day.")}
          </p>
        </div>

        {/* espaço limpo: aqui o cenário 3D do fundo enquadra o ponto de apoio (ilustração, não um lugar real) */}
        <div className="min-h-[70vh] sm:min-h-[80vh]" aria-hidden="true" />
        <p className="text-center text-[11px] text-slate-400">
          {L(idioma, "Ilustração. Os primeiros Pousos serão visitados na Expedição nº 01 · Paraty → Fortaleza, pelo litoral", "Ilustración. Las primeras Paradas se visitarán en la Expedición nº 01 · Paraty → Fortaleza, por la costa", "Illustration. The first stopovers will be visited on Expedition no. 01 · Paraty → Fortaleza, along the coast")}
        </p>

        {/* O QUE CONFERIMOS PARA DAR O SELO */}
        <div className="mt-14 sm:mt-16">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white">{L(idioma, "O que registramos na visita", "Qué registramos en la visita", "What we record on the visit")}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {L(idioma, "O registro mostra o que encontramos no dia da visita. Não é garantia: as condições podem mudar depois.", "El registro muestra lo que encontramos el día de la visita. No es garantía: las condiciones pueden cambiar después.", "The record shows what we found on the day of the visit. It isn't a guarantee: conditions may change later.")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              ["lock", L(idioma, "Acesso e estacionamento", "Acceso y estacionamiento", "Access and parking"), L(idioma, "Se havia portão, recepção ou vigia no dia da visita, e onde havia espaço para carro, moto ou motorhome.", "Si había portón, recepción o sereno el día de la visita, y dónde había lugar para auto, moto o motorhome.", "Whether there was a gate, reception or night guard on the day of the visit, and where there was room for a car, bike or motorhome.")],
              ["shower", L(idioma, "Banho quente e banheiro limpo", "Ducha caliente y baño limpio", "Hot shower and clean bathroom"), L(idioma, "Registrado no dia da visita.", "Registrado el día de la visita.", "Recorded on the day of the visit.")],
              ["plug", L(idioma, "Energia", "Energía", "Power"), L(idioma, "Tomada para carregar celular e notebook; ponto 220V para motorhome e van, quando houver — anotamos a amperagem.", "Enchufe para cargar celular y notebook; toma 220V para motorhome y van, si hay: anotamos el amperaje.", "Sockets for phones and laptops; a 220V hookup for motorhomes and vans where available — we note the amperage.")],
              ["wifi", L(idioma, "Internet que funciona", "Internet que funciona", "Internet that works"), L(idioma, "Velocidade medida no dia da visita, no quarto ou na área comum.", "Velocidad medida el día de la visita, en la habitación o en el área común.", "Speed measured on the day of the visit, in the room or common area.")],
              ["water", L(idioma, "Água e cozinha", "Agua y cocina", "Water and kitchen"), L(idioma, "Água potável; cozinha ou refeição por perto; descarte para motorhome, quando houver.", "Agua potable; cocina o comida cerca; descarga para motorhome, si hay.", "Drinking water; a kitchen or meals nearby; a motorhome dump point where available.")],
              ["ticket", L(idioma, "Preço claro", "Precio claro", "Clear price"), L(idioma, "Anotamos quanto custou a noite e o que estava incluído — sem letra miúda.", "Anotamos cuánto costó la noche y qué incluía, sin letra chica.", "We note what the night cost and what was included — no fine print.")],
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
            {L(idioma, "Vale para camping, hostel, pousada, hotel e pátio de posto com pernoite. Cada pouso mostra o que havia no dia da visita.", "Vale para camping, hostel, posada, hotel y patio de estación con pernocte. Cada parada muestra lo que había el día de la visita.", "Applies to campsites, hostels, guesthouses, hotels and gas-station yards with overnight stays. Each stopover shows what was there on the day of the visit.")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/certificados"
              className="btn-primary-amalfi px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2"
            >
              <Icon name="tent" width={22} height={22} /> {L(idioma, "Ver lugares visitados", "Ver lugares visitados", "See visited places")}
            </Link>
            <Link
              href="/refugio"
              className="btn-secondary-glass px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center gap-2"
            >
              <Icon name="pin" width={20} height={20} /> {L(idioma, "Tenho um lugar na rota: quero a visita", "Tengo un lugar en la ruta: quiero la visita", "I have a place on the route: I want a visit")}
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
                  <Icon name="shield" width={28} height={28} /> {L(idioma, "Parceiro JobPago", "Socio JobPago", "JobPago Partner")}
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
                <span className="text-[10px] text-slate-400 uppercase block font-mono">{L(idioma, "Valor combinado", "Valor acordado", "Agreed price")}</span>
                <span className="text-2xl font-black text-amber-400 font-mono flex items-center gap-2">
                  {selectedJob.budget === 0 ? (<><Icon name="shield" width={40} height={40} /> {L(idioma, "CORTESIA", "CORTESÍA", "FREE")}</>) : `R$ ${selectedJob.budget.toLocaleString("pt-BR")}`}
                </span>
              </div>
              <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1 font-mono">
                <Icon name="bolt" width={30} height={30} /> {L(idioma, "PIX direto", "PIX directo", "Direct PIX")}
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
              <Icon name="chat" width={36} height={36} /> {L(idioma, "Falar direto no WhatsApp", "Hablar directo por WhatsApp", "Message directly on WhatsApp")}
            </button>
          </div>
        </div>
      )}


      {/* ── FOOTER ELEGANTE ── */}
      </main>

      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · {L(idioma, "mantido por Allan Candido", "mantenido por Allan Candido", "run by Allan Candido")}.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/como-funciona" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Como Funciona", "Cómo funciona", "How it works")}
            </Link>
            <Link href="/cidade" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Relatório da cidade", "Informe de la ciudad", "Town report")}
            </Link>
            <Link href="/termos" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Termos de Uso", "Términos de Uso", "Terms of Use")}
            </Link>
            <Link href="/privacidade" className="hover:text-amber-400 transition-colors">
              {L(idioma, "Política de Privacidade", "Política de Privacidad", "Privacy Policy")}
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
