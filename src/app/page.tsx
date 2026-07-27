"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/MapaServicos";
import ModalPerfilRPG, { UserRPG, GUILD_DETAILS } from "@/components/ModalPerfilRPG";

const MapaServicos = dynamic(() => import("@/components/MapaServicos"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-3xl glass-panel flex flex-col items-center justify-center text-cyan-300 gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
      <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Carregando Mapa Translúcido Glass GPS…</span>
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
  isFreeHonor?: boolean;
  tribo?: string;
}

const DEFAULT_RPG_USER: UserRPG = {
  name: "Allan C. (Nômade VIP)",
  email: "allan@jobpago.com.br",
  level: 14,
  xp: 2850,
  nextLevelXp: 3500,
  title: "Cyber Freelancer Rank A ⚡",
  guild: "Nômades & Van Life",
  pixBalance: 2500.0,
  btcAddress: "bc1q9f88c3a1b77e2a9b44988x1",
  honorScore: 320,
  honorTitle: "Paladino Nômade (Rank S) 🏆",
  stats: {
    velocidade: 94,
    confiabilidade: 98,
    sigilo: 100,
  },
  badges: [
    { id: "b1", icon: "⚡", title: "Primeiro Sangue PIX", desc: "1ª vaga concluída com PIX na hora", unlocked: true },
    { id: "b2", icon: "🚿", title: "Mestre da Carga 32A", desc: "Forneceu ou usou infra nômade aquecida", unlocked: true },
    { id: "b3", icon: "🔐", title: "Guardião Bitcoin", desc: "Assinou Smart Contract encriptado", unlocked: true },
    { id: "b4", icon: "🤝", title: "Anfitrião de Alta Honra", desc: "Ofereceu apoio 100% cortesia a viajantes", unlocked: true },
  ],
  rewards: [
    {
      id: "r1",
      category: "Ingresso",
      icon: "🎟️",
      title: "Ingresso VIP: Feira Náutica & Ecoturismo Angra 2026",
      location: "Marina Porto Frade, Angra dos Reis, RJ",
      requiredLevel: 5,
      requiredHonor: 100,
      unlocked: true,
      claimed: false,
      description: "Entrada gratuita com acesso à área VIP, palestras sobre tecnologia sustentável e degustação de gastronomia marinha.",
    },
    {
      id: "r2",
      category: "Camping",
      icon: "⛺",
      title: "Passaporte Camping Temático Nômade (3 Noites Cortesia)",
      location: "Camping Costa Verde, Paraty, RJ",
      requiredLevel: 10,
      requiredHonor: 200,
      unlocked: true,
      claimed: false,
      description: "Vaga privativa para Motorhome ou barraca com luz 220V, Wi-Fi Starlink e café da manhã incluso.",
    },
    {
      id: "r3",
      category: "Aventura",
      icon: "🧭",
      title: "Expedição Guiada: Mergulho nas Ilhas de Angra & Abrolhos",
      location: "Ilha Grande & Abrolhos, BA",
      requiredLevel: 12,
      requiredHonor: 250,
      unlocked: true,
      claimed: false,
      description: "Voucher para batismo de mergulho autônomo com instrutor credenciado PADI e barco com fotógrafo subaquático.",
    },
    {
      id: "r4",
      category: "Comboio",
      icon: "🚜",
      title: "Passaporte Comboio de Destinos (Expedição Van Life Costa Verde)",
      location: "Paraty -> Cumuruxatiba -> Prado, BA",
      requiredLevel: 15,
      requiredHonor: 300,
      unlocked: false,
      claimed: false,
      description: "Vaga em comboio organizado com suporte mecânico, rádio comunicador, escolta e recepções festivas nos destinos.",
    },
  ],
};

const LEADERBOARD_USERS = [
  { rank: 1, name: "Allan C.", title: "Paladino Nômade Rank S", guild: "Nômades & Van Life", xp: "14.850 XP", honor: "320 PTS 🛡️", level: 52, icon: "👑" },
  { rank: 2, name: "Kunoichi VIP", title: "Guardiã Sombra S", guild: "Guardiões Sombra ㊙️", xp: "12.400 XP", honor: "290 PTS 🛡️", level: 46, icon: "㊙️" },
  { rank: 3, name: "Capitão Ruy", title: "Anfitrião Benemérito", guild: "Nômades & Van Life", xp: "9.350 XP", honor: "450 PTS 🛡️", level: 38, icon: "⚓" },
  { rank: 4, name: "Dev_Mago", title: "Arch-Mage Tech", guild: "Magos do Código", xp: "8.100 XP", honor: "180 PTS 🛡️", level: 31, icon: "🧙‍♂️" },
];

const TRIBOS_CANONICAS = [
  { id: "harley", name: "Harley Bikers", icon: "🏍️", desc: "Estradeiros & Custom Bikes" },
  { id: "investors", name: "Investidores 50+", icon: "💼", desc: "Aportes & Escrow Imobiliário" },
  { id: "liveaboards", name: "Velejadores", icon: "⛵", desc: "Veleiros & Fundeios Náuticos" },
  { id: "vanlife", name: "Van Life", icon: "🚐", desc: "Motorhomes & Camping 220V" },
  { id: "devs", name: "Devs & Tech", icon: "💻", desc: "Full-Stack & Automação IA" },
  { id: "gamers", name: "Gamers", icon: "🎮", desc: "Consoles Portáteis & Arenas" },
  { id: "cosplay", name: "Cosplayers", icon: "🎭", desc: "Anime, Figurinos & Props" },
  { id: "festivais", name: "Festivais", icon: "🎪", desc: "Música, Arte & Marés Bioluminescentes" },
];

const CATEGORIES = [
  { name: "Todas", icon: "🔥" },
  { name: "Harley & Moto-Trails", icon: "🏍️" },
  { name: "Nômade & Infra", icon: "🚐" },
  { name: "Serviços Secretos ㊙️", icon: "🔞" },
  { name: "Reformas & Reparos", icon: "🛠️" },
  { name: "Tecnologia & TI", icon: "💻" },
  { name: "Design & Mídia", icon: "🎨" },
  { name: "Transporte & Fretes", icon: "🚚" },
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [filterType, setFilterType] = useState<"all" | "pix" | "remote" | "local" | "honor">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isBtcModalOpen, setIsBtcModalOpen] = useState(false);

  // User State & RPG Modals
  const [user, setUser] = useState<UserRPG | null>(null);
  const [isRpgModalOpen, setIsRpgModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Vaga Nova
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Nômade & Infra");
  const [newBudget, setNewBudget] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState<"Remoto" | "Presencial">("Presencial");
  const [newDescription, setNewDescription] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [isFreeService, setIsFreeService] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Erro ao buscar vagas em tempo real:", err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const savedUser = localStorage.getItem("jobpago_rpg_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    } else {
      setUser(DEFAULT_RPG_USER);
      localStorage.setItem("jobpago_rpg_user", JSON.stringify(DEFAULT_RPG_USER));
    }

    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateGuild = (newGuild: UserRPG["guild"]) => {
    if (!user) return;
    const updated = { ...user, guild: newGuild };
    setUser(updated);
    localStorage.setItem("jobpago_rpg_user", JSON.stringify(updated));
    showToast(`⚔️ Você se filiou à ${newGuild}! Insígnia atualizada.`);
  };

  const handleClaimReward = (rewardId: string) => {
    if (!user) return;
    const updatedRewards = user.rewards.map((r) =>
      r.id === rewardId ? { ...r, claimed: true } : r
    );
    const updatedUser = { ...user, rewards: updatedRewards };
    setUser(updatedUser);
    localStorage.setItem("jobpago_rpg_user", JSON.stringify(updatedUser));
    showToast("🎉 Benefício resgatado! Seu voucher cortesia está ativo no perfil.");
  };

  const addXpAndHonor = (xpAmount: number, honorAmount: number, reason: string) => {
    if (!user) return;
    const newXp = user.xp + xpAmount;
    const newHonor = user.honorScore + honorAmount;
    let newLevel = user.level;
    let nextXp = user.nextLevelXp;

    if (newXp >= nextXp) {
      newLevel += 1;
      nextXp = Math.round(nextXp * 1.4);
      showToast(`🎉 PARABÉNS! Você subiu para o Nível ${newLevel}!`);
    } else {
      showToast(`✨ +${xpAmount} XP | 🛡️ +${honorAmount} PTS de Alta Honra por: ${reason}`);
    }

    const updated = {
      ...user,
      xp: newXp,
      level: newLevel,
      nextLevelXp: nextXp,
      honorScore: newHonor,
    };
    setUser(updated);
    localStorage.setItem("jobpago_rpg_user", JSON.stringify(updated));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const isSecret = newCategory.includes("Secretos");
    const budgetVal = isFreeService ? 0 : Number(newBudget || 0);
    const client = newClientName || user?.name || "Allan C. (Nômade VIP)";

    const payload = {
      title: isFreeService ? `🛡️ [CORTESIA 0800] ${newTitle}` : newTitle,
      category: newCategory,
      budget: budgetVal,
      location: newLocation || "Angra dos Reis, RJ",
      type: newType,
      description: newDescription || "Serviço cadastrado na guilda.",
      clientName: client,
      whatsapp: "5524993326966",
      isSecret,
      btcAccepted: isSecret,
      isFreeHonor: isFreeService,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.job) {
        setJobs([data.job, ...jobs]);
        setIsModalOpen(false);

        if (isFreeService) {
          addXpAndHonor(200, 50, "Oferecer Serviço 100% Gratuito (Alta Honra)");
        } else {
          addXpAndHonor(150, 10, "Publicar Serviço na Guilda");
        }

        setNewTitle("");
        setNewBudget("");
        setNewDescription("");
        setNewLocation("");
        setIsFreeService(false);
      }
    } catch (err) {
      console.error("Erro ao enviar vaga:", err);
      showToast("Erro ao publicar vaga. Tente novamente.");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesCategory = selectedCategory === "Todas" || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesCategory || !matchesSearch) return false;

    if (filterType === "pix") return job.isPixImmediate && job.budget > 0;
    if (filterType === "remote") return job.type === "Remoto";
    if (filterType === "local") return job.type === "Presencial";
    if (filterType === "honor") return job.budget === 0 || job.isFreeHonor;

    return true;
  });

  return (
    <div className="min-h-screen text-white selection:bg-cyan-400 selection:text-black relative">
      {/* ── TOAST NOTIFICATION GLASS ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel glass-cyan text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 text-sm flex items-center gap-3">
          <span className="text-cyan-400 text-lg">⚡</span> {toastMessage}
        </div>
      )}

      {/* ── NAVBAR GLASSMORPHISM ── */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-300 to-amber-300 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-cyan-500/25">
              ⚡
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
              JobPago<span className="text-cyan-400">.com.br</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-7 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
            <a href="#mapa-gps" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <span>🗺️ Mapa GPS</span>
            </a>
            <a href="#guildas-leaderboard" className="hover:text-amber-300 transition-colors text-amber-400 flex items-center gap-1">
              <span>⚔️ Ranking Guildas</span>
            </a>
            <a href="#nomade-space" className="hover:text-cyan-400 transition-colors">🚐 Nômades</a>
            <a href="#secret-anime" className="hover:text-pink-400 transition-colors text-pink-400 flex items-center gap-1">
              <span>㊙️ Secret Anime</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setIsRpgModalOpen(true)}
                className="flex items-center gap-2.5 glass-card rounded-2xl p-1.5 pl-3 hover:border-cyan-400"
              >
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-black text-white">{user.name}</span>
                    <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                      🛡️ {user.honorScore} PTS
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-medium">
                    {GUILD_DETAILS[user.guild].icon} {user.guild}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-black font-black text-xs flex items-center justify-center shadow-md">
                  🎁
                </div>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-105"
            >
              + Anunciar Vaga
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER GLASSMORPHISM ── */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* TOTEM 3D EMBLEM FLUTUANTE TRANSPARENTE */}
        <div className="flex justify-center mb-4">
          <img
            src="/totem_3d_flutuante.png"
            alt="Totem 3D Nômade JobPago"
            className="w-28 sm:w-36 h-auto drop-shadow-[0_12px_35px_rgba(0,240,255,0.45)] hover:scale-110 transition-transform duration-500 cursor-pointer"
          />
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-widest uppercase mb-6 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Interface Glassmorphism Translúcida • 10 Tribos Conectadas
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Ecossistema Nômade & Investimento em <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Vidro Translúcido</span>
          </h1>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            De motociclistas estradeiros Harley-Davidson a investidores 50+, velejadores, nômades van life, devs e cosplayers. Conecte-se e resgate recompensas reais.
          </p>

          {/* BARRA DE NAVEGAÇÃO DE TRIBOS CANÔNICAS GLASS */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 max-w-5xl mx-auto">
            {TRIBOS_CANONICAS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSearchQuery(t.name);
                  const el = document.getElementById("vagas");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="glass-card p-3 rounded-2xl flex flex-col items-center text-center group hover:border-cyan-400/50"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{t.icon}</span>
                <span className="text-[11px] font-black text-white group-hover:text-cyan-300">{t.name}</span>
                <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>

          {/* BUSCA GLASS */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 glass-panel p-2 rounded-2xl shadow-2xl border border-white/20 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Busque por 'Harley', 'Investimento 50+', 'Veleiro', 'Cosplay'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            <button className="w-full sm:w-auto bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black px-8 py-3 rounded-xl text-sm transition-all hover:scale-105 shrink-0">
              🔍 Buscar
            </button>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO LEADERBOARD GUILDAS & MERCENÁRIOS RPG ── */}
      <section id="guildas-leaderboard" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel glass-gold p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
                ⚔️ Ranking de Alta Honra & Escrow
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Líderes de Reputação & Investimento 🛡️
              </h2>
            </div>

            {user && (
              <button
                onClick={() => setIsRpgModalOpen(true)}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black font-black px-6 py-3 rounded-2xl text-xs shadow-xl transition-all hover:scale-105"
              >
                🎁 Loot Vault & Benefícios VIP
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEADERBOARD_USERS.map((lb) => (
              <div
                key={lb.rank}
                className="glass-card p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden hover:border-amber-400/60"
              >
                <div className="text-2xl font-black text-amber-400 w-8 text-center shrink-0">
                  #{lb.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">{lb.name}</span>
                    <span className="text-xs">{lb.icon}</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold block truncate">{lb.title}</span>
                  <span className="text-[10px] font-bold text-cyan-300 font-mono mt-1 block">
                    {lb.xp} | {lb.honor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 1: MAPA INTERATIVO DE SERVIÇOS & ROTAS GLASS ── */}
      <section id="mapa-gps" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
              Geolocalização Ativa & OSRM Routing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              🗺️ Mapa GPS Translúcido de Serviços
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Encontre rotas de Harley, fundeios de veleiro, pontos 220V e hubs de investimento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat.name
                    ? "bg-cyan-400 text-black border-cyan-400 font-black shadow-lg"
                    : "glass-card text-slate-300 border-white/10 hover:border-white/30"
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

      {/* ── SEÇÃO 2: DESTAQUE ESPAÇO NÔMADE DIGITAL GLASS ── */}
      <section id="nomade-space" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel glass-cyan p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl pointer-events-none">🚐</div>

          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-xs font-black uppercase tracking-wider">
              Infraestrutura Van Life & Harley Travel
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              🚐 Espaço Nômade & Moto-Trails
            </h2>
            <p className="text-sm text-slate-200 mt-3 leading-relaxed">
              Viajando de Harley-Davidson, motorhome ou veleiro? Encontre locais com chuveiro aquecido, cargas 32A e apoio de fundeio com selo de Alta Honra.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="glass-card p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">🚿</span>
                <span className="text-xs font-bold text-white block">Chuveiro Quente</span>
                <span className="text-[10px] text-slate-400">Banhos privativos</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">⚡</span>
                <span className="text-xs font-bold text-white block">Carga 110V/220V/32A</span>
                <span className="text-[10px] text-slate-400">Harleys, Vans & Laptops</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">🚐</span>
                <span className="text-xs font-bold text-white block">Motorhome & Garagem</span>
                <span className="text-[10px] text-slate-400">Garagens seguras</span>
              </div>
              <div className="glass-card p-3 rounded-2xl text-center">
                <span className="text-2xl block mb-1">💻</span>
                <span className="text-xs font-bold text-white block">Wi-Fi Alta Velocidade</span>
                <span className="text-[10px] text-slate-400">Pontos de Co-working</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: SERVIÇOS SECRETOS GLASS ── */}
      <section id="secret-anime" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel glass-pink p-6 sm:p-10 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-400 text-xs font-black uppercase tracking-widest">
                <span>㊙️ 秘密のサービス</span>
                <span>• Smart Contracts & Bitcoin</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent mt-3 tracking-tight">
                Serviços Secretos & Escrow VIP
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Sessões cosplay, banhos aromáticos sensoriais e experiências exclusivas com sigilo contratual garantido via Bitcoin e pagamentos P2P.
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
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-pink-400 font-extrabold text-xs block uppercase">🔒 Contrato Encriptado</span>
              <p className="text-xs text-slate-300 mt-1">Termos de confidencialidade gravados com assinatura digital.</p>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-purple-400 font-extrabold text-xs block uppercase">⚡ Bitcoin & Lightning Network</span>
              <p className="text-xs text-slate-300 mt-1">Pagamentos liquidados com anonimato preservado.</p>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-cyan-400 font-extrabold text-xs block uppercase">🎭 Cosplay & Banhos Sensoriais</span>
              <p className="text-xs text-slate-300 mt-1">Experiências estéticas imersivas com privacidade total.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4: FEED DE VAGAS GLASSMORPHISM ── */}
      <section id="vagas" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">📋 Vagas & Serviços Disponíveis</h2>
            <p className="text-xs text-slate-400 mt-1">
              {isLoadingJobs ? "Atualizando feed em tempo real..." : `Exibindo ${filteredJobs.length} resultados atualizados`}
            </p>
          </div>

          {/* FILTRO TIPO GLASS */}
          <div className="flex flex-wrap items-center gap-2 glass-panel p-1.5 rounded-2xl">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                filterType === "all" ? "bg-cyan-400 text-black shadow-lg" : "text-slate-300 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType("honor")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                filterType === "honor" ? "bg-amber-400 text-black shadow-lg" : "text-amber-400 hover:text-amber-300"
              }`}
            >
              🛡️ Gratuitos (Alta Honra)
            </button>
            <button
              onClick={() => setFilterType("pix")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                filterType === "pix" ? "bg-cyan-400 text-black shadow-lg" : "text-slate-300 hover:text-white"
              }`}
            >
              ⚡ PIX / BTC
            </button>
            <button
              onClick={() => setFilterType("local")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                filterType === "local" ? "bg-cyan-400 text-black shadow-lg" : "text-slate-300 hover:text-white"
              }`}
            >
              📍 Presenciais
            </button>
          </div>
        </div>

        {/* LISTA DE CARDS GLASS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isSecret = job.isSecret || job.category.includes("Secretos");
            const isNomad = job.category.includes("Nômade");
            const isFree = job.budget === 0 || job.isFreeHonor;

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`glass-card rounded-3xl p-6 cursor-pointer relative flex flex-col justify-between ${
                  isFree
                    ? "glass-gold"
                    : isSecret
                    ? "glass-pink"
                    : isNomad
                    ? "glass-cyan"
                    : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                        isFree
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : isSecret
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/40"
                          : isNomad
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {job.category}
                    </span>

                    <span className="text-xs text-slate-400 font-semibold">{job.postedAgo}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug line-clamp-2">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Badges de Serviços Nômades */}
                  {job.nomadFeatures && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.nomadFeatures.map((feat) => (
                        <span key={feat} className="text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Recompensa</span>
                    {isFree ? (
                      <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                        <span>🛡️</span> CORTESIA 0800
                      </span>
                    ) : (
                      <span className={`text-xl font-black ${isSecret ? "text-pink-400" : "text-cyan-400"}`}>
                        R$ {job.budget.toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>

                  <button className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all">
                    Ver Detalhes →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MODAL FICHA DE PERSONAGEM RPG & LOOT VAULT GLASS ── */}
      {isRpgModalOpen && user && (
        <ModalPerfilRPG
          user={user}
          onClose={() => setIsRpgModalOpen(false)}
          onUpdateGuild={handleUpdateGuild}
          onClaimReward={handleClaimReward}
        />
      )}

      {/* ── MODAL DETALHES DO SERVIÇO GLASS ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl p-6 sm:p-8 relative glass-panel border border-white/20 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {selectedJob.category}
            </span>

            <h3 className="text-2xl font-black text-white leading-tight">{selectedJob.title}</h3>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>📍 {selectedJob.location}</span>
              <span>👤 {selectedJob.clientName}</span>
            </div>

            <div className="my-6 p-4 rounded-2xl glass-card">
              <span className="text-xs font-extrabold text-slate-400 uppercase block mb-1">Descrição Completa</span>
              <p className="text-sm text-slate-200 leading-relaxed">{selectedJob.description}</p>

              {selectedJob.nomadFeatures && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <span className="text-xs font-bold text-cyan-400 block mb-2">Comodidades Nômades Inclusas:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.nomadFeatures.map((f) => (
                      <span key={f} className="text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Valor da Recompensa</span>
                {selectedJob.budget === 0 ? (
                  <span className="text-2xl font-black text-amber-300 flex items-center gap-1">
                    <span>🛡️</span> CORTESIA 0800 (Alta Honra)
                  </span>
                ) : (
                  <span className={`text-3xl font-black ${selectedJob.isSecret ? "text-pink-400" : "text-cyan-400"}`}>
                    R$ {selectedJob.budget.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              {selectedJob.btcAccepted && (
                <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <span>₿</span> Bitcoin / Lightning
                </span>
              )}
            </div>

            {selectedJob.isSecret ? (
              <button
                onClick={() => setIsBtcModalOpen(true)}
                className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-pink-500/30 transition-all hover:scale-105 uppercase tracking-wider"
              >
                🔐 Assinar Smart Contract & Iniciar Atendimento
              </button>
            ) : (
              <button
                onClick={() => {
                  window.open(`https://wa.me/${selectedJob.whatsapp}?text=Olá,%20tenho%20interesse%20no%20serviço:%20${encodeURIComponent(selectedJob.title)}`, "_blank");
                }}
                className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black text-sm py-4 rounded-2xl shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                💬 Entrar em Contato Direto via WhatsApp
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL SMART CONTRACT BTC GLASS ── */}
      {isBtcModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl glass-panel glass-pink p-6 sm:p-8 relative shadow-2xl text-center">
            <button
              onClick={() => setIsBtcModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <span className="text-4xl block mb-2">⚡ ㊙️ ₿</span>
            <h3 className="text-2xl font-black text-white">Smart Contract P2P & Bitcoin</h3>
            <p className="text-xs text-slate-300 mt-1">Acordo contratual confidencial com liquidação em escrow digital.</p>

            <div className="my-6 p-4 rounded-2xl glass-card text-left text-xs text-slate-200 space-y-2">
              <p className="font-mono text-pink-400">HASH: 0x9f88c3a1b...77e2a9b</p>
              <p>• Este contrato garante sigilo bilateral sobre o atendimento.</p>
              <p>• O valor de R$ {selectedJob.budget} será mantido em Escrow até a confirmação por ambas as partes.</p>
              <p>• Suporte a pagamento instantâneo via Lightning Network (LNURL).</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl font-mono text-xs text-cyan-300 mb-6 truncate">
              lnbc6500n1pj99...x8a2qqqsp572
            </div>

            <button
              onClick={() => {
                showToast("Contrato assinado digitalmente! Redirecionando para canal privativo.");
                setIsBtcModalOpen(false);
                setSelectedJob(null);
              }}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-sm py-4 rounded-2xl shadow-lg transition-all hover:scale-105 uppercase tracking-wider"
            >
              ✅ Aceitar Termos & Enviar Bitcoin
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PUBLICAR VAGA GLASS ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel border border-white/20 rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-white">+ Publicar Nova Vaga na Guilda</h3>
            <p className="text-xs text-slate-300 mt-1">Sua vaga aparecerá instantaneamente no mapa e lhe renderá XP e Honra</p>

            <form onSubmit={handleCreateJob} className="mt-6 flex flex-col gap-4">
              {/* OPÇÃO DE SERVIÇO CORTESIA 0800 */}
              <div className="glass-card border border-amber-400/40 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <span>🛡️</span> Serviço 100% Gratuito (Alta Honra)
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    Ganhe +50 PTS de Alta Honra ao doar apoio para nômades na estrada.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isFreeService}
                  onChange={(e) => setIsFreeService(e.target.checked)}
                  className="w-5 h-5 accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Título da Vaga / Serviço</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chuveiro Quente Cortesia ou Tomada 220V Grátis"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    {CATEGORIES.filter((c) => c.name !== "Todas").map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!isFreeService && (
                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1">Orçamento (R$)</label>
                    <input
                      type="number"
                      required={!isFreeService}
                      placeholder="Ex: 150"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Modalidade</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "Remoto" | "Presencial")}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Cidade / Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: Angra dos Reis, RJ"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Descrição do Serviço & Comodidades</label>
                <textarea
                  rows={3}
                  placeholder="Detallhe se há tomadas 220V, Wi-Fi, chuveiro aquecido, fetiches ou termos contratuais..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Seu Nome / Contratante</label>
                <input
                  type="text"
                  placeholder={user ? user.name : "Ex: Allan C. (Nômade VIP)"}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black text-sm py-4 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-cyan-500/25 uppercase tracking-wider"
              >
                🚀 Publicar em Tempo Real (+XP & +Honra)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FOOTER GLASS ── */}
      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <p>© 2026 JobPago.com.br · Design System Glassmorphic Translúcido por Allan Candido.</p>
      </footer>
    </div>
  );
}
