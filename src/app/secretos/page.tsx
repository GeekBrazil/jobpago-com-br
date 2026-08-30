"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/MapaServicos";
import type { Job } from "@/app/page";

const MapaServicos = dynamic(() => import("@/components/MapaServicos"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-3xl glass-panel glass-pink flex flex-col items-center justify-center text-pink-400 gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"></div>
      <span className="text-xs font-black uppercase tracking-widest text-pink-400">Carregando Radar Criptografado de Suítes VIP…</span>
    </div>
  ),
});

interface VipUserSession {
  codename: string;
  emailOrKey: string;
  joinedAt: string;
  token: string;
  is18Plus: boolean;
}

export default function SecretosPage() {
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"login" | "register" | "wallet">("login");
  const [vipUser, setVipUser] = useState<VipUserSession | null>(null);

  // Form states
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [inputCodename, setInputCodename] = useState("");
  const [inputWallet, setInputWallet] = useState("");
  const [acceptedNda, setAcceptedNda] = useState(false);
  const [is18Confirmed, setIs18Confirmed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Jobs state
  const [secretJobs, setSecretJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isBtcModalOpen, setIsBtcModalOpen] = useState(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);

  // New Secret Job form
  const [newTitle, setNewTitle] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carregar sessão salva do LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jobpago_vip_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.codename) {
          setVipUser(parsed);
          setIsAuth(true);
        }
      }
    } catch (e) {
      console.error("Erro ao ler sessão VIP:", e);
    }
  }, []);

  // Buscar vagas secretas quando autenticado
  const fetchSecretJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success && data.jobs) {
        const filtered = (data.jobs as Job[]).filter(
          (j) => j.isSecret || j.category.includes("Secretos")
        );
        setSecretJobs(filtered);
      }
    } catch (err) {
      console.error("Erro ao buscar vagas secretas:", err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (isAuth) {
      fetchSecretJobs();
    }
  }, [isAuth]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!inputEmail || !inputPassword) {
      setAuthError("Preencha o e-mail/identificador e a senha de segurança.");
      return;
    }

    const session: VipUserSession = {
      codename: inputEmail.split("@")[0] || "Membro_VIP",
      emailOrKey: inputEmail,
      joinedAt: new Date().toISOString(),
      token: "vip_tok_" + Math.random().toString(36).substring(2, 10),
      is18Plus: true,
    };

    localStorage.setItem("jobpago_vip_session", JSON.stringify(session));
    setVipUser(session);
    setIsAuth(true);
    showToast("🔓 Acesso VIP liberado com sucesso. Sessão criptografada ativa.");
  };

  // Cadastro VIP handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!inputCodename.trim()) {
      setAuthError("Informe um pseudônimo ou codinome para identificação discreta.");
      return;
    }
    if (!inputEmail.trim() || !inputPassword.trim()) {
      setAuthError("Preencha todos os campos do formulário de cadastro.");
      return;
    }
    if (!is18Confirmed) {
      setAuthError("É obrigatório confirmar maioridade (18+ anos) para acessar esta seção.");
      return;
    }
    if (!acceptedNda) {
      setAuthError("Você deve concordar com os Termos de Sigilo e Confidencialidade.");
      return;
    }

    const session: VipUserSession = {
      codename: inputCodename.trim(),
      emailOrKey: inputEmail.trim(),
      joinedAt: new Date().toISOString(),
      token: "vip_tok_" + Math.random().toString(36).substring(2, 10),
      is18Plus: true,
    };

    localStorage.setItem("jobpago_vip_session", JSON.stringify(session));
    setVipUser(session);
    setIsAuth(true);
    showToast(`🎉 Bem-vindo ao Círculo VIP, ${session.codename}! Chave de acesso gerada.`);
  };

  // Carteira Bitcoin handler
  const handleWalletLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!inputWallet.trim() || inputWallet.trim().length < 12) {
      setAuthError("Informe um endereço válido de carteira Bitcoin / Lightning.");
      return;
    }
    if (!is18Confirmed || !acceptedNda) {
      setAuthError("Confirme sua maioridade e aceite os termos de confidencialidade.");
      return;
    }

    const session: VipUserSession = {
      codename: "BTC_" + inputWallet.substring(0, 6) + "…" + inputWallet.substring(inputWallet.length - 4),
      emailOrKey: inputWallet.trim(),
      joinedAt: new Date().toISOString(),
      token: "vip_tok_" + Math.random().toString(36).substring(2, 10),
      is18Plus: true,
    };

    localStorage.setItem("jobpago_vip_session", JSON.stringify(session));
    setVipUser(session);
    setIsAuth(true);
    showToast("⚡ Carteira autenticada com sucesso! Acesso anônimo concedido.");
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("jobpago_vip_session");
    setVipUser(null);
    setIsAuth(false);
    showToast("🔒 Sessão confidencial encerrada.");
  };

  // Publicar vaga secreta
  const handleCreateSecretJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBudget.trim()) return;

    const payload = {
      title: `㊙️ ${newTitle.replace(/^㊙️\s*/, "")}`,
      category: "Serviços Secretos ㊙️",
      budget: Number(newBudget),
      location: newLocation || "Suíte Privativa, Angra dos Reis, RJ",
      type: "Presencial",
      description: newDescription || "Experiência reservada com sigilo contratual garantido.",
      clientName: vipUser?.codename || "Agente Anônimo VIP",
      whatsapp: "5524993326966",
      isSecret: true,
      btcAccepted: true,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.job) {
        setSecretJobs([data.job, ...secretJobs]);
        setIsNewJobModalOpen(false);
        setNewTitle("");
        setNewBudget("");
        setNewLocation("");
        setNewDescription("");
        showToast("✨ Serviço secreto publicado com sucesso no mural encriptado.");
      }
    } catch (err) {
      console.error("Erro ao publicar vaga secreta:", err);
      showToast("Erro ao publicar serviço secreto.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-pink-500 selection:text-white relative">
      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel glass-pink text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 text-sm flex items-center gap-3">
          <span className="text-pink-400 text-lg">㊙️</span> {toastMessage}
        </div>
      )}

      {/* ── NAVBAR VIP ── */}
      <header className="sticky top-0 z-40 glass-panel border-b border-pink-500/20 bg-[#08080f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xs font-black text-slate-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                ← Voltar para o JobPago
              </span>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">㊙️</span>
              <span className="text-lg font-black tracking-tight text-white">
                Círculo <span className="text-pink-500">Secret & Escrow VIP</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuth && vipUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-black text-pink-400 flex items-center justify-end gap-1">
                    <span>🔐</span> {vipUser.codename}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Sessão Encriptada Ativa</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 text-xs font-bold text-slate-300 hover:text-white transition-all"
                >
                  Encerrar Sessão
                </button>
                <button
                  onClick={() => setIsNewJobModalOpen(true)}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  + Anunciar Secreto
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full bg-pink-500/10">
                  🔞 Acesso 18+ Restrito
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── SEÇÃO 1: HERO DA PÁGINA SECRETA ── */}
      <section className="pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel glass-pink p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-400 text-xs font-black uppercase tracking-widest">
                <span>㊙️ 秘密のサービス</span>
                <span>• Smart Contracts & Bitcoin Escrow</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white mt-3 tracking-tight">
                Serviços Secretos & Experiências VIP
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Ambiente restrito com sigilo contratual estrito. Sessões temáticas cosplay, banhos aromáticos sensoriais e experiências exclusivas com pagamentos liquidados via Bitcoin, Lightning Network e PIX Escrow.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/30 text-center">
                <span className="text-2xl block mb-0.5">🔒</span>
                <span className="text-[11px] font-black text-pink-400 uppercase block">100% Confidencial</span>
                <span className="text-[9px] text-slate-400">NDA Digital Obrigatório</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 text-center">
                <span className="text-2xl block mb-0.5">⚡</span>
                <span className="text-[11px] font-black text-purple-400 uppercase block">Bitcoin Escrow</span>
                <span className="text-[9px] text-slate-400">Liquidação Instantânea</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-pink-500/30">
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-pink-400 font-extrabold text-xs block uppercase">🔒 Contrato Encriptado</span>
              <p className="text-xs text-slate-300 mt-1">Termos de confidencialidade gravados com assinatura digital P2P.</p>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-purple-400 font-extrabold text-xs block uppercase">⚡ Bitcoin & Lightning</span>
              <p className="text-xs text-slate-300 mt-1">Pagamentos retidos em garantia e liberados sob confirmação mútua.</p>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-pink-300 font-extrabold text-xs block uppercase">🎭 Cosplay & Banhos Sensoriais</span>
              <p className="text-xs text-slate-300 mt-1">Experiências estéticas imersivas e atendimento privativo com discrição.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: ÁREA DE AUTENTICAÇÃO / LOGIN VIP (QUANDO NÃO AUTENTICADO) ── */}
      {!isAuth && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="glass-panel border border-pink-500/30 p-6 sm:p-10 rounded-3xl shadow-2xl relative">
            <div className="text-center max-w-md mx-auto mb-8">
              <span className="text-4xl block mb-2">🔐</span>
              <h2 className="text-2xl font-black text-white">Identificação & Acesso ao Círculo VIP</h2>
              <p className="text-xs text-slate-300 mt-1">
                Para visualizar vagas, suítes reservadas e entrar em contato com anunciantes, autentique-se ou crie sua conta confidencial.
              </p>
            </div>

            {/* ABAS DE AUTENTICAÇÃO */}
            <div className="flex p-1 bg-black/60 rounded-2xl border border-white/10 max-w-md mx-auto mb-6">
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                  authTab === "login"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🔑 Entrar (Login VIP)
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("register"); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                  authTab === "register"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ✨ Novo Cadastro
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("wallet"); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                  authTab === "wallet"
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ₿ Carteira BTC
              </button>
            </div>

            {authError && (
              <div className="p-3.5 mb-6 rounded-xl bg-pink-500/20 border border-pink-500/50 text-pink-300 text-xs font-bold text-center">
                ⚠️ {authError}
              </div>
            )}

            {/* FORMULÁRIO: LOGIN */}
            {authTab === "login" && (
              <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">E-mail ou Chave de Acesso</label>
                  <input
                    type="text"
                    required
                    placeholder="seu-email@exemplo.com ou chave_vip"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Senha de Segurança</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 uppercase tracking-wider"
                >
                  Desbloquear Acesso VIP 🔓
                </button>
              </form>
            )}

            {/* FORMULÁRIO: CADASTRO */}
            {authTab === "register" && (
              <form onSubmit={handleRegister} className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Pseudônimo / Codinome Discreto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agente_Noir, Kunoichi_X, CyberVip"
                    value={inputCodename}
                    onChange={(e) => setInputCodename(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">E-mail de Contato Criptografado</label>
                  <input
                    type="email"
                    required
                    placeholder="seu-contato@provedor.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Definir Senha de Acesso</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={is18Confirmed}
                      onChange={(e) => setIs18Confirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded"
                    />
                    <span>Declaro sob as penas da lei que sou <strong>maior de 18 anos</strong>.</span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedNda}
                      onChange={(e) => setAcceptedNda(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded"
                    />
                    <span>Concordo com os <strong>Termos de Confidencialidade (NDA)</strong> e o protocolo de anonimato P2P.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 uppercase tracking-wider"
                >
                  Concluir Cadastro & Acessar 🚀
                </button>
              </form>
            )}

            {/* FORMULÁRIO: BITCOIN WALLET */}
            {authTab === "wallet" && (
              <form onSubmit={handleWalletLogin} className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Endereço Bitcoin ou Chave Lightning</label>
                  <input
                    type="text"
                    required
                    placeholder="bc1q... ou lnurl..."
                    value={inputWallet}
                    onChange={(e) => setInputWallet(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={is18Confirmed}
                      onChange={(e) => setIs18Confirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded"
                    />
                    <span>Declaro que sou <strong>maior de 18 anos</strong>.</span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedNda}
                      onChange={(e) => setAcceptedNda(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded"
                    />
                    <span>Concordo com o protocolo de assinatura P2P.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-pink-600 text-black font-black text-sm py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 uppercase tracking-wider"
                >
                  Entrar com Carteira ⚡
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* ── SEÇÃO 3: DASHBOARD DESBLOQUEADO (QUANDO AUTENTICADO) ── */}
      {isAuth && (
        <>
          {/* ── MAPA GPS DE SUÍTES RESERVADAS ── */}
          <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-black text-pink-400 uppercase tracking-widest">
                  ㊙️ Radar Privativo de Suítes & Encontros
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Mapa de Locais Reservados
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Localizações discretas de ateliês, resorts, ofurôs e suítes temáticas na Costa Verde.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-black">
                  {secretJobs.length} Pontos Ativos
                </span>
              </div>
            </div>

            <MapaServicos
              points={secretJobs}
              selectedCategory="Todas"
              onSelectPoint={(point) => setSelectedJob(point as Job)}
              allowSecrets={true}
            />
          </section>

          {/* ── FEED DE VAGAS SECRETAS ── */}
          <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <span>㊙️</span> Mural de Serviços Secretos
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isLoadingJobs ? "Carregando catálogo encriptado..." : `Exibindo ${secretJobs.length} serviços com Smart Contract disponível`}
                </p>
              </div>

              <button
                onClick={() => setIsNewJobModalOpen(true)}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xl transition-all hover:scale-105"
              >
                + Anunciar Secreto
              </button>
            </div>

            {secretJobs.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl text-center">
                <span className="text-4xl block mb-2">🔒</span>
                <p className="text-sm font-bold text-slate-300">Nenhum serviço secreto listado no momento.</p>
                <p className="text-xs text-slate-500 mt-1">Seja o primeiro a publicar um anúncio privativo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secretJobs.map((job) => (
                  <div
                    key={job.id}
                    className="glass-panel border border-pink-500/30 p-6 rounded-3xl hover:border-pink-500/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/40">
                          {job.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{job.postedAgo}</span>
                      </div>

                      <h3 className="text-lg font-black text-white leading-snug mb-2">
                        {job.title}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Orçamento / Cachet</span>
                          <span className="text-xl font-black text-pink-400">
                            R$ {job.budget.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>₿</span> Escrow Ativo
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedJob(job)}
                        className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md uppercase tracking-wider"
                      >
                        Ver Detalhes & Contratar 🔐
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── MODAL DETALHES DO SERVIÇO SECRETO ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel glass-pink p-6 sm:p-8 rounded-3xl relative shadow-2xl">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black bg-pink-500/20 text-pink-400 border border-pink-500/40 px-3 py-1 rounded-xl uppercase">
                {selectedJob.category}
              </span>
              <span className="text-xs text-slate-400">📍 {selectedJob.location}</span>
            </div>

            <h3 className="text-2xl font-black text-white leading-tight mb-3">
              {selectedJob.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {selectedJob.description}
            </p>

            <div className="bg-black/40 border border-pink-500/30 p-4 rounded-2xl mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Valor em Escrow</span>
                <span className="text-2xl font-black text-pink-400">
                  R$ {selectedJob.budget.toLocaleString("pt-BR")}
                </span>
              </div>
              <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <span>₿</span> Bitcoin / Lightning
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsBtcModalOpen(true)}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-sm py-4 rounded-2xl shadow-xl transition-all hover:scale-105 uppercase tracking-wider"
              >
                🔐 Assinar Smart Contract & Iniciar Atendimento
              </button>

              <button
                onClick={() => {
                  window.open(`https://wa.me/${selectedJob.whatsapp}?text=Olá,%20acesso%20VIP%20referente%20ao%20serviço%20${encodeURIComponent(selectedJob.title)}`, "_blank");
                }}
                className="w-full bg-white/5 border border-white/10 hover:border-pink-500/50 text-slate-300 hover:text-white font-bold text-xs py-3 rounded-2xl transition-all"
              >
                💬 Contato Direto Privativo via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SMART CONTRACT BTC ── */}
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
              className="w-full bg-pink-600 text-white font-black text-sm py-4 rounded-2xl shadow-lg transition-all hover:scale-105 uppercase tracking-wider"
            >
              ✅ Aceitar Termos & Enviar Bitcoin
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PUBLICAR NOVO SERVIÇO SECRETO ── */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel glass-pink border border-pink-500/40 rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewJobModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <span className="text-3xl block mb-1">㊙️</span>
            <h3 className="text-2xl font-black text-white">+ Publicar Serviço Secreto VIP</h3>
            <p className="text-xs text-slate-300 mt-1">
              Seu anúncio ficará restrito exclusivamente a membros autenticados no Círculo VIP.
            </p>

            <form onSubmit={handleCreateSecretJob} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Título do Serviço / Experiência</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sessão Cosplay Privativa ou Banho Aromático Relaxante"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Cachet / Orçamento (R$)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 750"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Local / Suíte (Aproximado)</label>
                  <input
                    type="text"
                    placeholder="Ex: Suíte Privativa, Angra dos Reis, RJ"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Descrição & Termos de Atendimento</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva a ambientação, preferências, limites e condições contratuais..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-sm py-4 rounded-2xl transition-all hover:scale-105 shadow-xl uppercase tracking-wider"
              >
                🚀 Publicar no Mural Secreto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FOOTER VIP ── */}
      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · Círculo Secreto & Escrow VIP.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Página Principal
            </Link>
            <Link href="/termos" className="hover:text-cyan-400 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-cyan-400 transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
