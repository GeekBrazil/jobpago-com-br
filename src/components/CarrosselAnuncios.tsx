"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import type { Job } from "@/app/page";

const SEGUNDOS_POR_CARD = 4;

function CardAnuncio({ job, onSelect }: { job: Job; onSelect: (job: Job) => void }) {
  const isFree = job.budget === 0 || job.isFreeHonor;
  const isNomad = job.category.includes("Nômade");
  return (
    <button
      onClick={() => onSelect(job)}
      className={`shrink-0 w-[260px] sm:w-[320px] text-left glass-panel ${
        isFree ? "glass-amber" : isNomad ? "glass-emerald" : ""
      } rounded-3xl relative overflow-hidden group hover:border-emerald-400/50 transition-all cursor-pointer p-0`}
    >
      {job.imagemUrl && (
        <div className="relative h-36 sm:h-44 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={job.imagemUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
              isFree
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {isFree ? <Icon name="shield" width={22} height={22} /> : <Icon name="bolt" width={22} height={22} />}
            {job.category}
          </span>
        </div>
        <h2 className="text-sm font-black text-white leading-snug">{job.title}</h2>
        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{job.description}</p>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className={`font-mono font-bold ${isFree ? "text-amber-300" : "text-emerald-400"}`}>
            {isFree ? "100% CORTESIA" : `R$ ${job.budget.toLocaleString("pt-BR")}`}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="pin" width={22} height={22} /> {job.location}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function CarrosselAnuncios({
  jobs,
  onSelect,
}: {
  jobs: Job[];
  onSelect: (job: Job) => void;
}) {
  const total = jobs.length;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (total === 0) return null;

  // Fita dobrada: cada card carrega seu próprio espaçamento à direita (em vez
  // de gap no flex), então cada "slot" tem largura fixa e igual. Isso faz o
  // -50% do translateX cair exatamente onde a cópia repetida começa — sem
  // esse cuidado, o padding do container e o gap entre itens desalinham a
  // matemática e o loop pula visivelmente a cada volta.
  const faixa = total > 1 ? [...jobs, ...jobs] : jobs;
  const duracaoS = Math.max(total, 1) * SEGUNDOS_POR_CARD;

  return (
    <div
      className="mt-12 relative w-screen overflow-hidden"
      style={{ left: "50%", marginLeft: "-50vw" }}
    >
      <div
        className="flex w-max py-2"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)",
          animation:
            total > 1 && !reducedMotion ? `carrosselAnuncios ${duracaoS}s linear infinite` : undefined,
        }}
      >
        {faixa.map((job, i) => (
          <div key={`${job.id}-${i}`} className="shrink-0 pr-5">
            <CardAnuncio job={job} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
}
