"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/MapaServicos";

const MapaServicos = dynamic(() => import("@/components/MapaServicos"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-3xl bg-[#0a0c14] border border-white/10 flex flex-col items-center justify-center text-zinc-400 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
      <span className="text-xs font-bold uppercase tracking-wider">Carregando Mapa de Serviços GPS…</span>
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
  btcAccepted?: boolean;
}

const INITIAL_JOBS: Job[] = [
  // ── CATEGORIA NÔMADE & INFRA ──
  {
    id: "n1",
    title: "Ponto de Apoio Nômade: Chuveiro Quente + Carga 220V (Bikes/Notebooks)",
    category: "Nômade & Infra",
    budget: 35,
    location: "Praia do Coqueiro, Angra dos Reis, RJ",
    lat: -23.012,
    lng: -44.310,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 10 min",
    proposalsCount: 6,
    description: "Espaço privativo para viajantes e nômades digitais. Banheiro amplo com chuveiro a gás aquecido, tomadas dedicadas de alta carga (bikes elétricas, scooters) e bancada de trabalho para notebooks com Wi-Fi 600MB.",
    clientName: "Estação Nômade Costa Verde",
    whatsapp: "5524993326966",
    nomadFeatures: ["🚿 Chuveiro Quente", "🔋 Carga 220V Alta Carga", "💻 Wi-Fi 600MB", "☕ Café Grátis"],
  },
  {
    id: "n2",
    title: "Vaga Segura para Motorhome / Van Life + Tomada Industrial + Água",
    category: "Nômade & Infra",
    budget: 80,
    location: "Centro Histórico, Paraty, RJ",
    lat: -23.218,
    lng: -44.714,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 25 min",
    proposalsCount: 3,
    description: "Terreno plano e murado com portão eletrônico para estacionar Motorhomes, Vans ou instalar Camping. Inclui ponto de água potável, descarte de água cinza e energia até 32A.",
    clientName: "Paraty Van Camping",
    whatsapp: "5524993326966",
    nomadFeatures: ["🚐 Vaga Motorhome", "⚡ Ponto 32A", "🚰 Água Potável", "🔒 Portão 24h"],
  },

  // ── SERVIÇOS SECRETOS (ANIME MAXIMALIST CYBERPUNK) ──
  {
    id: "s1",
    title: "㊙️ Encontro Cosplay Cyberpunk & Sessão Fotográfica Privativa",
    category: "Serviços Secretos ㊙️",
    budget: 650,
    location: "Suíte Reservada, Angra dos Reis, RJ",
    lat: -23.002,
    lng: -44.318,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 5 min",
    proposalsCount: 2,
    description: "Sessão temática cosplay no estilo Cyberpunk 2077 / Anime Maximalista. Ambiente com iluminação neon, total sigilo contratual via Smart Contract P2P e pagamento exclusivo em Bitcoin / Lightning.",
    clientName: "Agência Kunoichi Secret",
    whatsapp: "5524993326966",
    isSecret: true,
    btcAccepted: true,
  },
  {
    id: "s2",
    title: "㊙️ Banho Sensorial Aromático & Acompanhamento VIP Exclusivo",
    category: "Serviços Secretos ㊙️",
    budget: 900,
    location: "Resort Portogalo, Angra dos Reis, RJ",
    lat: -23.030,
    lng: -44.240,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 18 min",
    proposalsCount: 4,
    description: "Experiência relaxante de banho em ofurô com óleos essenciais, massagem tântrica e acompanhamento discreto para eventos noturnos. Contrato encriptado e suporte a pagamento anônimo.",
    clientName: "Club Noir VIP",
    whatsapp: "5524993326966",
    isSecret: true,
    btcAccepted: true,
  },

  // ── TRADICIONAIS ──
  {
    id: "1",
    title: "Criação de Landing Page em Next.js para Imobiliária",
    category: "Tecnologia & TI",
    budget: 850,
    location: "Remoto",
    lat: -23.005,
    lng: -44.320,
    type: "Remoto",
    isPixImmediate: true,
    postedAgo: "Há 15 min",
    proposalsCount: 4,
    description: "Preciso de um desenvolvedor front-end para criar uma landing page rápida de imóveis com design escuro e responsivo.",
    clientName: "Allan C.",
    whatsapp: "5524993326966",
  },
  {
    id: "2",
    title: "Instalação Elétrica Residencial e Troca de Rejunte",
    category: "Reformas & Reparos",
    budget: 380,
    location: "Porto Frade, Angra dos Reis, RJ",
    lat: -23.045,
    lng: -44.420,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 42 min",
    proposalsCount: 2,
    description: "Instalação de 6 luminárias de LED no teto e pequenos reparos elétricos no condomínio Porto Frade.",
    clientName: "Marcos V.",
    whatsapp: "5524993326966",
  },
  {
    id: "3",
    title: "Edição de 5 Vídeos Curtos para Instagram Reels/TikTok",
    category: "Design & Mídia",
    budget: 250,
    location: "Remoto",
    lat: -23.001,
    lng: -44.305,
    type: "Remoto",
    isPixImmediate: true,
    postedAgo: "Há 1 hora",
    proposalsCount: 7,
    description: "Buscamos editor dinâmico para colocar legendas animadas e cortes rápidos em 5 vídeos gravados no celular.",
    clientName: "Agência Lumina",
    whatsapp: "5524993326966",
  },
];

const CATEGORIES = [
  { name: "Todas", icon: "🔥", color: "from-zinc-500 to-zinc-700" },
  { name: "Nômade & Infra", icon: "🚐", color: "from-emerald-500 to-teal-400" },
  { name: "Serviços Secretos ㊙️", icon: "🔞", color: "from-pink-600 via-purple-600 to-cyan-500" },
  { name: "Reformas & Reparos", icon: "🛠️", color: "from-amber-500 to-orange-400" },
  { name: "Tecnologia & TI", icon: "💻", color: "from-cyan-500 to-blue-400" },
  { name: "Design & Mídia", icon: "🎨", color: "from-purple-500 to-indigo-400" },
  { name: "Transporte & Fretes", icon: "🚚", color: "from-blue-500 to-sky-400" },
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [filterType, setFilterType] = useState<"all" | "pix" | "remote" | "local">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isBtcModalOpen, setIsBtcModalOpen] = useState(false);

  // Form Vaga Nova
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Nômade & Infra");
  const [newBudget, setNewBudget] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState<"Remoto" | "Presencial">("Presencial");
  const [newDescription, setNewDescription] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBudget) return;

    const isSecret = newCategory.includes("Secretos");

    const created: Job = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      budget: Number(newBudget),
      location: newLocation || "Angra dos Reis, RJ",
      lat: -23.006 + (Math.random() - 0.5) * 0.05,
      lng: -44.318 + (Math.random() - 0.5) * 0.05,
      type: newType,
      isPixImmediate: true,
      postedAgo: "Agora mesmo",
      proposalsCount: 0,
      description: newDescription || "Serviço cadastrado na plataforma.",
      clientName: newClientName || "Contratante JobPago",
      whatsapp: "5524993326966",
      isSecret,
      btcAccepted: isSecret,
    };

    setJobs([created, ...jobs]);
    setIsModalOpen(false);

    setNewTitle("");
    setNewBudget("");
    setNewDescription("");
    setNewLocation("");
    setNewClientName("");
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesCategory = selectedCategory === "Todas" || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesCategory || !matchesSearch) return false;

    if (filterType === "pix") return job.isPixImmediate;
    if (filterType === "remote") return job.type === "Remoto";
    if (filterType === "local") return job.type === "Presencial";

    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080c] text-white selection:bg-emerald-500 selection:text-black">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08080c]/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-extrabold text-black text-xl shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
              JobPago<span className="text-emerald-400">.com.br</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#mapa-gps" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>🗺️ Mapa GPS</span>
            </a>
            <a href="#vagas" className="hover:text-emerald-400 transition-colors">Vagas & Infra</a>
            <a href="#nomade-space" className="hover:text-emerald-400 transition-colors text-emerald-400 font-extrabold">
              🚐 Espaço Nômade
            </a>
            <a href="#secret-anime" className="hover:text-pink-400 transition-colors text-pink-400 font-extrabold flex items-center gap-1">
              <span>㊙️ Secret Anime</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40"
            >
              + Anunciar Vaga / Serviço
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide uppercase mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Plataforma de Serviços, Apoio Nômade & Smart Contracts P2P
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Serviços Imediatos com <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">PIX & Bitcoin</span> no Mapa
          </h1>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Encontre bicos, pontos de recarga para nômades, apoio de camping, serviços presenciais e sessões secretas com contrato inteligente.
          </p>

          {/* BUSCA RÁPIDA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md shadow-2xl">
            <input
              type="text"
              placeholder="Busque por 'chuveiro', 'notebook', 'cosplay', 'landing page'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            <button className="w-full sm:w-auto bg-emerald-500 text-black font-extrabold px-8 py-3 rounded-xl text-sm transition-all hover:bg-emerald-400 shrink-0">
              🔍 Buscar
            </button>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 1: MAPA INTERATIVO DE SERVIÇOS & ROTAS ── */}
      <section id="mapa-gps" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
              Geolocalização Ativa & OSRM Routing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              🗺️ Mapa de Serviços & Pontos de Apoio
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Veja os serviços mais próximos de você e trace a rota exata de navegação no mapa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat.name
                    ? "bg-white text-black border-white shadow-lg"
                    : "bg-white/5 text-zinc-400 border-white/10 hover:border-white/30"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* COMPONENTE DO MAPA */}
        <MapaServicos
          points={jobs}
          selectedCategory={selectedCategory}
          onSelectPoint={(point) => setSelectedJob(point as Job)}
        />
      </section>

      {/* ── SEÇÃO 2: DESTAQUE ESPAÇO NÔMADE DIGITAL ── */}
      <section id="nomade-space" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-900/80 to-teal-950/30 border border-emerald-500/30 p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl pointer-events-none">🚐</div>

          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
              Infraestrutura Van Life & Remote Workers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              🚐 Espaço & Infraestrutura Nômade
            </h2>
            <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
              Está viajando de motorhome, bike elétrica ou trabalhando remoto? Encontre parceiros que fornecem banheiros com chuveiro aquecido, cargas máximas dedicadas e vagas seguras.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-black/40 border border-emerald-500/20 p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">🚿</span>
                <span className="text-xs font-bold text-white block">Chuveiro Quente</span>
                <span className="text-[10px] text-zinc-400">Banhos privativos</span>
              </div>
              <div className="bg-black/40 border border-emerald-500/20 p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">⚡</span>
                <span className="text-xs font-bold text-white block">Carga 110V/220V/32A</span>
                <span className="text-[10px] text-zinc-400">Bikes, Laptops & Vans</span>
              </div>
              <div className="bg-black/40 border border-emerald-500/20 p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">🚐</span>
                <span className="text-xs font-bold text-white block">Vagas Motorhome</span>
                <span className="text-[10px] text-zinc-400">Camping & Garagem</span>
              </div>
              <div className="bg-black/40 border border-emerald-500/20 p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">💻</span>
                <span className="text-xs font-bold text-white block">Wi-Fi Alta Velocidade</span>
                <span className="text-[10px] text-zinc-400">Pontos de Co-working</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: SERVIÇOS SECRETOS (ESTILO ANIME MAXIMALIST CYBERPUNK) ── */}
      <section id="secret-anime" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#0d0714] anime-neon-card p-6 sm:p-10 relative overflow-hidden anime-scanline">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-400 text-xs font-black uppercase tracking-widest">
                <span>㊙️ 秘密のサービス</span>
                <span>• Cyberpunk & Anime Maximalist</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent mt-3 tracking-tight">
                Serviços Secretos & Smart Contracts BTC
              </h2>
              <p className="text-sm text-zinc-300 mt-2 max-w-2xl leading-relaxed">
                Sessões cosplay, banhos aromáticos sensoriais, fetiches e experiências exclusivas com sigilo contratual garantido via Bitcoin e pagamentos descentralizados P2P.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCategory("Serviços Secretos ㊙️");
                const el = document.getElementById("vagas");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 text-white font-black px-8 py-4 rounded-2xl text-sm shadow-xl shadow-pink-500/30 transition-all hover:scale-105 shrink-0 uppercase tracking-wider border border-white/20"
            >
              🔥 Explorar Serviços Secretos
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-pink-500/30">
            <div className="bg-black/60 border border-pink-500/30 p-4 rounded-2xl">
              <span className="text-pink-400 font-extrabold text-xs block uppercase">🔒 Contrato Encriptado</span>
              <p className="text-xs text-zinc-400 mt-1">Termos de confidencialidade e regras de aceitação mútua gravados com assinatura digital.</p>
            </div>
            <div className="bg-black/60 border border-purple-500/30 p-4 rounded-2xl">
              <span className="text-purple-400 font-extrabold text-xs block uppercase">⚡ Bitcoin & Lightning Network</span>
              <p className="text-xs text-zinc-400 mt-1">Pagamentos liquidados sem intermediários bancários e com anonimato preservado.</p>
            </div>
            <div className="bg-black/60 border border-cyan-500/30 p-4 rounded-2xl">
              <span className="text-cyan-400 font-extrabold text-xs block uppercase">🎭 Cosplay & Banhos Sensoriais</span>
              <p className="text-xs text-zinc-400 mt-1">Experiências estéticas imersivas ambientadas com luzes neon e privacidade total.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4: FEED DE VAGAS E SERVIÇOS ── */}
      <section id="vagas" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">📋 Vagas & Serviços Disponíveis</h2>
            <p className="text-xs text-zinc-400 mt-1">Exibindo {filteredJobs.length} resultados encontrados</p>
          </div>

          {/* FILTRO TIPO */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === "all" ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType("pix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === "pix" ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              ⚡ PIX / BTC
            </button>
            <button
              onClick={() => setFilterType("local")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === "local" ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              📍 Presenciais
            </button>
          </div>
        </div>

        {/* LISTA DE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isSecret = job.isSecret || job.category.includes("Secretos");
            const isNomad = job.category.includes("Nômade");

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer relative flex flex-col justify-between ${
                  isSecret
                    ? "bg-[#12071a] border border-pink-500/40 hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/20"
                    : isNomad
                    ? "bg-[#071712] border border-emerald-500/40 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20"
                    : "bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/[0.07]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                        isSecret
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/40"
                          : isNomad
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {job.category}
                    </span>

                    <span className="text-xs text-zinc-500 font-semibold">{job.postedAgo}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug line-clamp-2">
                    {job.title}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Badges de Serviços Nômades */}
                  {job.nomadFeatures && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.nomadFeatures.map((feat) => (
                        <span key={feat} className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">Recompensa</span>
                    <span className={`text-xl font-black ${isSecret ? "text-pink-400" : "text-emerald-400"}`}>
                      R$ {job.budget.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
                    Ver Detalhes →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MODAL DETALHES DO SERVIÇO / CANDIDATURA ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 relative border shadow-2xl animate-in zoom-in-95 ${
            selectedJob.isSecret ? "bg-[#14071f] border-pink-500/50" : "bg-[#0f111a] border-white/15"
          }`}>
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 ${
              selectedJob.isSecret ? "bg-pink-500/20 text-pink-400 border border-pink-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
            }`}>
              {selectedJob.category}
            </span>

            <h3 className="text-2xl font-black text-white leading-tight">{selectedJob.title}</h3>

            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
              <span>📍 {selectedJob.location}</span>
              <span>👤 {selectedJob.clientName}</span>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs font-extrabold text-zinc-400 uppercase block mb-1">Descrição Completa</span>
              <p className="text-sm text-zinc-200 leading-relaxed">{selectedJob.description}</p>

              {selectedJob.nomadFeatures && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <span className="text-xs font-bold text-emerald-400 block mb-2">Comodidades Nômades Inclusas:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.nomadFeatures.map((f) => (
                      <span key={f} className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs text-zinc-500 font-bold block">Valor da Recompensa</span>
                <span className={`text-3xl font-black ${selectedJob.isSecret ? "text-pink-400" : "text-emerald-400"}`}>
                  R$ {selectedJob.budget.toLocaleString("pt-BR")}
                </span>
              </div>

              {selectedJob.btcAccepted && (
                <span className="text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <span>₿</span> Aceita Bitcoin / Lightning
                </span>
              )}
            </div>

            {selectedJob.isSecret ? (
              <button
                onClick={() => setIsBtcModalOpen(true)}
                className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-xl shadow-pink-500/30 transition-all hover:scale-105 uppercase tracking-wider"
              >
                🔐 Assinar Smart Contract & Iniciar Atendimento
              </button>
            ) : (
              <a
                href={`https://wa.me/${selectedJob.whatsapp}?text=Olá,%20tenho%20interesse%20no%20serviço:%20${encodeURIComponent(selectedJob.title)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-sm py-4 rounded-xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                💬 Entrar em Contato Direto via WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL SMART CONTRACT BTC (SERVIÇOS SECRETOS) ── */}
      {isBtcModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0f0717] border border-pink-500/60 p-6 sm:p-8 relative shadow-2xl text-center anime-scanline">
            <button
              onClick={() => setIsBtcModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <span className="text-4xl block mb-2">⚡ ㊙️ ₿</span>
            <h3 className="text-2xl font-black text-white">Smart Contract P2P & Bitcoin</h3>
            <p className="text-xs text-zinc-400 mt-1">Acordo contratual confidencial com liquidação em escrow digital.</p>

            <div className="my-6 p-4 rounded-2xl bg-black/60 border border-pink-500/30 text-left text-xs text-zinc-300 space-y-2">
              <p className="font-mono text-pink-400">HASH: 0x9f88c3a1b...77e2a9b</p>
              <p>• Este contrato garante sigilo bilateral sobre o atendimento.</p>
              <p>• O valor de R$ {selectedJob.budget} será mantido em Escrow até a confirmação de conclusão por ambas as partes.</p>
              <p>• Suporte a pagamento instantâneo via Lightning Network (LNURL).</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl font-mono text-xs text-emerald-400 mb-6 truncate">
              lnbc6500n1pj99...x8a2qqqsp572
            </div>

            <button
              onClick={() => {
                alert("Contrato assinado digitalmente! Redirecionando para canal privativo.");
                setIsBtcModalOpen(false);
                setSelectedJob(null);
              }}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-sm py-4 rounded-xl shadow-lg transition-all hover:scale-105 uppercase tracking-wider"
            >
              ✅ Aceitar Termos & Enviar Bitcoin
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PUBLICAR VAGA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0d0e17] border border-white/15 rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-white">+ Publicar Nova Vaga / Serviço</h3>
            <p className="text-xs text-zinc-400 mt-1">Preencha os dados abaixo para exibir no mapa e receber propostas</p>

            <form onSubmit={handleCreateJob} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título da Vaga / Serviço</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chuveiro Quente + Carga 220V ou Sessão Cosplay"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter((c) => c.name !== "Todas").map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Orçamento (R$)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 150"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Modalidade</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "Remoto" | "Presencial")}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Cidade / Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: Angra dos Reis, RJ"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Descrição do Serviço & Comodidades</label>
                <textarea
                  rows={3}
                  placeholder="Detallhe se há tomadas 220V, Wi-Fi, chuveiro aquecido, fetiches ou termos contratuais..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Seu Nome / Contratante</label>
                <input
                  type="text"
                  placeholder="Ex: Estação Nômade"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-sm py-3.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/25"
              >
                🚀 Publicar no Mapa Gratuitamente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-zinc-500">
        <p>© 2026 JobPago.com.br · Todos os direitos reservados. Allan Candido.</p>
      </footer>
    </div>
  );
}
