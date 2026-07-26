"use client";

import { useState } from "react";

interface Job {
  id: string;
  title: string;
  category: string;
  budget: number;
  location: string;
  type: "Remoto" | "Presencial";
  isPixImmediate: boolean;
  postedAgo: string;
  proposalsCount: number;
  description: string;
  clientName: string;
  whatsapp: string;
}

const INITIAL_JOBS: Job[] = [
  {
    id: "1",
    title: "Criação de Landing Page em Next.js para Imobiliária",
    category: "Tecnologia & TI",
    budget: 850,
    location: "Remoto",
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
    location: "Angra dos Reis, RJ",
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
    type: "Remoto",
    isPixImmediate: true,
    postedAgo: "Há 1 hora",
    proposalsCount: 7,
    description: "Buscamos editor dinâmico para colocar legendas animadas e cortes rápidos em 5 vídeos gravados no celular.",
    clientName: "Agência Lumina",
    whatsapp: "5524993326966",
  },
  {
    id: "4",
    title: "Frete e Mudança Residencial Pequena (Van/Pick-up)",
    category: "Transporte & Fretes",
    budget: 450,
    location: "Paraty, RJ -> Angra dos Reis, RJ",
    type: "Presencial",
    isPixImmediate: false,
    postedAgo: "Há 2 horas",
    proposalsCount: 3,
    description: "Transporte de 1 geladeira, 1 sofá de 2 lugares e 4 caixas do Centro de Paraty até o Frade.",
    clientName: "Juliana M.",
    whatsapp: "5524993326966",
  },
  {
    id: "5",
    title: "Fotógrafo para Evento Náutico no Final de Semana",
    category: "Fotografia & Eventos",
    budget: 600,
    location: "Angra dos Reis, RJ",
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 3 horas",
    proposalsCount: 5,
    description: "Ensaios de lancha e cobertura fotográfica durante passeio de barco das 10h às 16h no sábado.",
    clientName: "Capitão Ruy",
    whatsapp: "5524993326966",
  },
  {
    id: "6",
    title: "Tradução e Formatação de Artigo Acadêmico (Português -> Inglês)",
    category: "Aulas & Consultoria",
    budget: 220,
    location: "Remoto",
    type: "Remoto",
    isPixImmediate: true,
    postedAgo: "Há 4 horas",
    proposalsCount: 1,
    description: "Tradução de resumo e introdução de artigo científico com 12 páginas para publicação.",
    clientName: "Profa. Beatriz",
    whatsapp: "5524993326966",
  },
];

const CATEGORIES = [
  { name: "Todas", icon: "🔥" },
  { name: "Reformas & Reparos", icon: "🛠️" },
  { name: "Tecnologia & TI", icon: "💻" },
  { name: "Design & Mídia", icon: "🎨" },
  { name: "Transporte & Fretes", icon: "🚚" },
  { name: "Fotografia & Eventos", icon: "📸" },
  { name: "Aulas & Consultoria", icon: "🎓" },
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [filterType, setFilterType] = useState<"all" | "pix" | "remote" | "local">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Modal Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Tecnologia & TI");
  const [newBudget, setNewBudget] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState<"Remoto" | "Presencial">("Remoto");
  const [newDescription, setNewDescription] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBudget) return;

    const created: Job = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      budget: Number(newBudget),
      location: newLocation || "Remoto",
      type: newType,
      isPixImmediate: true,
      postedAgo: "Agora mesmo",
      proposalsCount: 0,
      description: newDescription || "Entre em contato para saber mais sobre a vaga.",
      clientName: newClientName || "Contratante Anônimo",
      whatsapp: "5524993326966",
    };

    setJobs([created, ...jobs]);
    setIsModalOpen(false);

    // Reset Form
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
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08080c]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-extrabold text-black text-xl shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
              JobPago<span className="text-emerald-400">.com.br</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#vagas" className="hover:text-emerald-400 transition-colors">Vagas ao Vivo</a>
            <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">Como Funciona</a>
            <a href="#categorias" className="hover:text-emerald-400 transition-colors">Categorias</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
            >
              + Publicar Vaga
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PAGAMENTO GARANTIDO VIA PIX · SEM TAXAS OCULTAS
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Encontre Serviços Rápidos e Receba no{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              PIX na Hora
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Conectamos autônomos, freelancers e profissionais a contratantes e tarefas por demanda em todo o Brasil. Sem burocracia.
          </p>

          {/* Barra de Busca Principal */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-2 sm:p-3 rounded-2xl shadow-2xl shadow-black/80 max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-zinc-400">🔍</span>
              <input
                type="text"
                placeholder="Qual serviço você busca ou oferece?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                const element = document.getElementById("vagas");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Buscar Vagas
            </button>
          </div>

          {/* KPI Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-12 pt-8 border-t border-white/10">
            <div>
              <div className="text-xl sm:text-3xl font-black text-white">{jobs.length}</div>
              <div className="text-xs text-zinc-500 font-medium mt-1">Vagas ao Vivo</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black text-emerald-400">R$ 420k+</div>
              <div className="text-xs text-zinc-500 font-medium mt-1">Pagos em PIX</div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black text-cyan-400">100%</div>
              <div className="text-xs text-zinc-500 font-medium mt-1">Verificado</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS RÁPIDAS ── */}
      <section id="categorias" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-xs uppercase tracking-widest text-emerald-400 font-black mb-4">
          Navegue por Categoria
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FEED DE VAGAS AO VIVO ── */}
      <section id="vagas" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vagas e Tarefas ao Vivo
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Confira as oportunidades publicadas recentemente com pagamento imediato
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === "all" ? "bg-emerald-500 text-black shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType("pix")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === "pix" ? "bg-emerald-500 text-black shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              ⚡ PIX Imediato
            </button>
            <button
              onClick={() => setFilterType("remote")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === "remote" ? "bg-emerald-500 text-black shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              🏠 Remoto
            </button>
            <button
              onClick={() => setFilterType("local")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === "local" ? "bg-emerald-500 text-black shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              📍 Presencial
            </button>
          </div>
        </div>

        {/* Grid de Cards de Vagas */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-white/5">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-white mt-4">Nenhuma vaga encontrada</h3>
            <p className="text-sm text-zinc-500 mt-1">Tente mudar o termo de busca ou selecionar outra categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="group bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      {job.category}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">{job.postedAgo}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {job.title}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Orçamento PIX</span>
                    <span className="text-xl font-black text-emerald-400">
                      R$ {job.budget.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-medium">📍 {job.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">PROCESSO SIMPLIFICADO</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Como Funciona o JobPago?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl mb-4">1</div>
              <h3 className="text-lg font-bold text-white">1. Publique a Tarefa</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Descreva o serviço necessário, defina o orçamento em R$ e a localização.
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xl mb-4">2</div>
              <h3 className="text-lg font-bold text-white">2. Receba Propostas</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Profissionais interessados enviam mensagem direta com portfólio e disponibilidade.
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xl mb-4">3</div>
              <h3 className="text-lg font-bold text-white">3. Pagamento no PIX</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Após a entrega do serviço, a transferência é efetuada instantaneamente via PIX.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL FICHA DA VAGA ── */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-[#0f0f16] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <span className="text-xs font-black uppercase text-emerald-400 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              {selectedJob.category}
            </span>

            <h3 className="text-2xl font-black text-white mt-4">{selectedJob.title}</h3>
            <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{selectedJob.description}</p>

            <div className="grid grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="text-xs text-zinc-500 font-bold block">VALOR NO PIX</span>
                <span className="text-2xl font-black text-emerald-400">R$ {selectedJob.budget.toLocaleString("pt-BR")}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-500 font-bold block">LOCALIZAÇÃO</span>
                <span className="text-base font-bold text-white">{selectedJob.location}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href={`https://api.whatsapp.com/send?phone=${selectedJob.whatsapp}&text=${encodeURIComponent(`Olá! Vi sua vaga "${selectedJob.title}" no JobPago.com.br e tenho interesse em realizar o serviço.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-center font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                💬 Candidatar-se via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PUBLICAR VAGA ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#0f0f16] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-white">+ Publicar Nova Vaga / Tarefa</h3>
            <p className="text-xs text-zinc-400 mt-1">Preencha os dados abaixo para receber propostas via PIX</p>

            <form onSubmit={handleCreateJob} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título da Vaga / Serviço</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Instalação de Ar-Condicionado ou Edição de Vídeo"
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
                    {CATEGORIES.filter(c => c.name !== "Todas").map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Orçamento (R$)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 350"
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
                    <option value="Remoto">Remoto</option>
                    <option value="Presencial">Presencial</option>
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
                <label className="text-xs font-bold text-zinc-300 block mb-1">Descrição do Serviço</label>
                <textarea
                  rows={3}
                  placeholder="Detallhe o que precisa ser feito..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Seu Nome / Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Allan C."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-sm py-3.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/25"
              >
                🚀 Publicar Vaga Gratuitamente
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
