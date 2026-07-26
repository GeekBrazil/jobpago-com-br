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
  stats: {
    velocidade: number; // 1-100
    confiabilidade: number; // 1-100
    sigilo: number; // 1-100
  };
  badges: Array<{
    id: string;
    icon: string;
    title: string;
    desc: string;
    unlocked: boolean;
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
}

export default function ModalPerfilRPG({
  user,
  onClose,
  onUpdateGuild,
}: ModalPerfilRPGProps) {
  const [selectedGuild, setSelectedGuild] = useState(user.guild);
  const guildInfo = GUILD_DETAILS[selectedGuild];

  const xpPercentage = Math.min(100, Math.round((user.xp / user.nextLevelXp) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0b0c16] border border-white/15 rounded-3xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto anime-scanline">
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
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  {user.title}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col items-end bg-white/5 border border-white/10 p-3 rounded-2xl shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Saldo de Recompensas</span>
            <span className="text-lg font-black text-emerald-400">R$ {user.pixBalance.toLocaleString("pt-BR")}</span>
            <span className="text-[10px] font-mono text-orange-400">₿ {user.btcAddress.substring(0, 10)}...</span>
          </div>
        </div>

        {/* ── BARRA DE XP (PROGRESSO DE NÍVEL) ── */}
        <div className="my-6">
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

        {/* ── GUILDA SELECIONADA & TROCA ── */}
        <div className="my-6 p-5 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-xs font-extrabold text-zinc-400 uppercase block mb-3">
            🛡️ Sua Guilda de Atuação
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

        {/* ── ATRIBUTOS DO MERCENÁRIO ── */}
        <div className="my-6">
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

        {/* ── CONQUISTAS & BADGES ── */}
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
                    ? "bg-gradient-to-b from-white/10 to-white/5 border-emerald-500/40 text-white"
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
    </div>
  );
}
