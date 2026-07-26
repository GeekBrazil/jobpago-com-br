"use client";

import { useState } from "react";

export interface UserRPG {
  name: string;
  email: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  title: string;
  guild: "Nômades & Van Life" | "Magos do Código" | "Artistas & Cosplay" | "Guardiões Sombra ㊙️";
  pixBalance: number;
  btcAddress: string;
  honorScore: number; // Pontos de Alta Honra (Gratuidade & Apoio)
  honorTitle: string; // Ex: Paladino Nômade Rank S
  stats: {
    velocidade: number;
    confiabilidade: number;
    sigilo: number;
  };
  badges: Array<{
    id: string;
    icon: string;
    title: string;
    desc: string;
    unlocked: boolean;
  }>;
  rewards: Array<{
    id: string;
    category: "Ingresso" | "Camping" | "Aventura" | "Comboio";
    icon: string;
    title: string;
    location: string;
    requiredLevel: number;
    requiredHonor: number;
    unlocked: boolean;
    claimed: boolean;
    description: string;
  }>;
}

export const GUILD_DETAILS = {
  "Nômades & Van Life": {
    icon: "🚐",
    color: "from-emerald-500 to-teal-400",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    desc: "Especialistas em infraestrutura de estrada, cargas 220V/32A, chuveiro quente e apoio motorhome.",
  },
  "Magos do Código": {
    icon: "💻",
    color: "from-cyan-500 to-blue-400",
    border: "border-cyan-500/40",
    text: "text-cyan-400",
    desc: "Mestres do desenvolvimento Next.js, automações com IA, APIs e segurança digital.",
  },
  "Artistas & Cosplay": {
    icon: "🎨",
    color: "from-purple-500 to-pink-500",
    border: "border-purple-500/40",
    text: "text-purple-400",
    desc: "Criadores visuais, editores de Reels/TikTok, ensaios fotográficos e performances temáticas.",
  },
  "Guardiões Sombra ㊙️": {
    icon: "㊙️",
    color: "from-pink-600 via-purple-600 to-cyan-500",
    border: "border-pink-500/50",
    text: "text-pink-400",
    desc: "Guardiões de Smart Contracts confidenciais, liquidação em Bitcoin P2P e privacidade total.",
  },
};

interface ModalPerfilRPGProps {
  user: UserRPG;
  onClose: () => void;
  onUpdateGuild: (guild: UserRPG["guild"]) => void;
  onClaimReward: (rewardId: string) => void;
}

export default function ModalPerfilRPG({
  user,
  onClose,
  onUpdateGuild,
  onClaimReward,
}: ModalPerfilRPGProps) {
  const [activeTab, setActiveTab] = useState<"perfil" | "guildas" | "loot">("perfil");
  const [selectedGuild, setSelectedGuild] = useState(user.guild);

  const guildInfo = GUILD_DETAILS[selectedGuild];
  const xpPercentage = Math.min(100, Math.round((user.xp / user.nextLevelXp) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0b0c16] border border-white/15 rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[92vh] overflow-y-auto anime-scanline">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
        >
          ✕
        </button>

        {/* ── HEADER FICHA DE PERSONAGEM ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-3xl font-black text-black shadow-lg shadow-emerald-500/20">
                ⚡
              </div>
              <span className="absolute -bottom-2 -right-2 bg-black border border-emerald-400 text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                Nv. {user.level}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">{user.name}</h3>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>🛡️</span> {user.honorTitle}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col items-end bg-white/5 border border-white/10 p-3 rounded-2xl shrink-0">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Pontos de Alta Honra</span>
            <span className="text-lg font-black text-amber-300">🛡️ {user.honorScore} PTS</span>
            <span className="text-[10px] text-emerald-400 font-bold">Anfitrião 100% Cortesia</span>
          </div>
        </div>

        {/* ── NAVEGAÇÃO DE ABAS RPG ── */}
        <div className="flex items-center gap-2 my-6 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "perfil"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚔️ Status & Ficha
          </button>
          <button
            onClick={() => setActiveTab("guildas")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "guildas"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🛡️ Minha Guilda
          </button>
          <button
            onClick={() => setActiveTab("loot")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all relative ${
              activeTab === "loot"
                ? "bg-amber-400 text-black shadow-lg"
                : "text-amber-400 hover:text-amber-300"
            }`}
          >
            🎁 Loot Vault & Recompensas
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-2"></span>
          </button>
        </div>

        {/* ── ABA 1: PERFIL & ATRIBUTOS ── */}
        {activeTab === "perfil" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* BARRA DE XP */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-zinc-300">Progresso de Experiência (XP)</span>
                <span className="text-emerald-400 font-mono">
                  {user.xp} / {user.nextLevelXp} XP ({xpPercentage}%)
                </span>
              </div>
              <div className="w-full h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* ATRIBUTOS */}
            <div>
              <span className="text-xs font-extrabold text-zinc-400 uppercase block mb-3">
                📊 Atributos de Combate & Serviço
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-cyan-400">⚡ Velocidade</span>
                    <span className="text-white font-mono">{user.stats.velocidade}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${user.stats.velocidade}%` }}></div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-400">🛡️ Confiabilidade</span>
                    <span className="text-white font-mono">{user.stats.confiabilidade}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${user.stats.confiabilidade}%` }}></div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-pink-400">🔒 Sigilo Contratual</span>
                    <span className="text-white font-mono">{user.stats.sigilo}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400 rounded-full" style={{ width: `${user.stats.sigilo}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BADGES / INSÍGNIAS */}
            <div>
              <span className="text-xs font-extrabold text-zinc-400 uppercase block mb-3">
                🏆 Insígnias & Conquistas Desbloqueadas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {user.badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                      b.unlocked
                        ? "bg-gradient-to-b from-white/10 to-white/5 border-emerald-500/40 text-white shadow-lg"
                        : "bg-black/30 border-white/5 text-zinc-600 opacity-50"
                    }`}
                  >
                    <span className="text-2xl mb-1">{b.icon}</span>
                    <span className="text-xs font-bold block">{b.title}</span>
                    <span className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{b.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA 2: GUILDAS ── */}
        {activeTab === "guildas" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs font-extrabold text-zinc-400 uppercase block mb-3">
                🛡️ Seleção de Guilda
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {(Object.keys(GUILD_DETAILS) as Array<keyof typeof GUILD_DETAILS>).map((gName) => {
                  const g = GUILD_DETAILS[gName];
                  const isActive = selectedGuild === gName;
                  return (
                    <button
                      key={gName}
                      onClick={() => {
                        setSelectedGuild(gName);
                        onUpdateGuild(gName);
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isActive
                          ? `bg-white/10 border-emerald-400 shadow-lg`
                          : `bg-black/40 border-white/10 hover:border-white/20 text-zinc-400`
                      }`}
                    >
                      <span className="text-2xl mb-1">{g.icon}</span>
                      <span className={`text-xs font-black ${isActive ? g.text : "text-zinc-300"}`}>
                        {gName}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                <span className={`font-bold ${guildInfo.text}`}>{guildInfo.icon} {selectedGuild}: </span>
                {guildInfo.desc}
              </p>
            </div>
          </div>
        )}

        {/* ── ABA 3: LOOT VAULT & RECOMPENSAS RPG ── */}
        {activeTab === "loot" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <h4 className="text-sm font-black text-amber-300">Loot Vault & Benefícios Exclusivos</h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Resgate ingressos cortesia, passes de camping, aventuras guiadas e vagas em comboios de destinos.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.rewards.map((rew) => {
                const canUnlock = user.level >= rew.requiredLevel && user.honorScore >= rew.requiredHonor;

                return (
                  <div
                    key={rew.id}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      rew.claimed
                        ? "bg-emerald-950/30 border-emerald-500/40 opacity-80"
                        : canUnlock
                        ? "bg-amber-950/30 border-amber-500/50 shadow-xl shadow-amber-500/10 hover:border-amber-400"
                        : "bg-black/40 border-white/10 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          {rew.icon} {rew.category}
                        </span>

                        <span className="text-[10px] text-zinc-400 font-mono">
                          Requer: Nv.{rew.requiredLevel} | 🛡️ {rew.requiredHonor} PTS
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">{rew.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{rew.description}</p>
                      <span className="text-[10px] font-bold text-emerald-400 mt-2 block">📍 {rew.location}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10">
                      {rew.claimed ? (
                        <span className="w-full block text-center bg-emerald-500/20 text-emerald-300 font-extrabold text-xs py-2 rounded-xl border border-emerald-500/40">
                          ✓ Resgatado (Voucher Ativo)
                        </span>
                      ) : canUnlock ? (
                        <button
                          onClick={() => onClaimReward(rew.id)}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-black font-extrabold text-xs py-2 rounded-xl transition-all hover:scale-105 shadow-md shadow-amber-500/20"
                        >
                          🎁 Resgatar Benefício Gratuitamente
                        </button>
                      ) : (
                        <span className="w-full block text-center bg-white/5 text-zinc-500 font-bold text-xs py-2 rounded-xl border border-white/10">
                          🔒 Nível ou Honra Insuficiente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
