"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import type { Job } from "@/app/page";

const INTERVALO_MS = 3000;

export default function CarrosselAnuncios({
  jobs,
  onSelect,
}: {
  jobs: Job[];
  onSelect: (job: Job) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(jobs.length / 2));
  const [pagina, setPagina] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (totalPaginas <= 1 || pausado || reducedMotionRef.current) return;
    const id = setInterval(() => {
      setPagina((p) => (p + 1) % totalPaginas);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [totalPaginas, pausado]);

  if (jobs.length === 0) return null;

  const visiveis = [jobs[pagina * 2], jobs[pagina * 2 + 1]].filter(Boolean) as Job[];

  return (
    <div
      className="mt-12 max-w-3xl mx-auto"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {visiveis.map((job) => {
          const isFree = job.budget === 0 || job.isFreeHonor;
          const isNomad = job.category.includes("Nômade");
          return (
            <button
              key={job.id}
              onClick={() => onSelect(job)}
              className={`text-left glass-panel ${
                isFree ? "glass-amber" : isNomad ? "glass-emerald" : ""
              } rounded-3xl relative overflow-hidden group hover:border-emerald-400/50 transition-all cursor-pointer p-0`}
            >
              {job.imagemUrl && (
                <div className="relative h-28 sm:h-32 w-full overflow-hidden">
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
                    {isFree ? <Icon name="shield" width={13} height={13} /> : <Icon name="bolt" width={13} height={13} />}
                    {job.category}
                  </span>
                  <span className={`text-[11px] font-mono font-bold ${isFree ? "text-amber-300" : "text-emerald-400"}`}>
                    {isFree ? "100% CORTESIA" : `R$ ${job.budget.toLocaleString("pt-BR")}`}
                  </span>
                </div>
                <h2 className="text-sm font-black text-white leading-snug">{job.title}</h2>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{job.description}</p>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Icon name="pin" width={13} height={13} /> {job.location}
                  </span>
                  <span className={`font-bold flex items-center gap-1 ${isFree ? "text-amber-400" : "text-emerald-400"}`}>
                    Ver detalhes <Icon name="chat" width={13} height={13} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i)}
              aria-label={`Ver anúncios ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === pagina ? "w-6 bg-emerald-400" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
