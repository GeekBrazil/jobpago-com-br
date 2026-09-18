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
  const total = jobs.length;
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (total <= 1 || pausado || reducedMotionRef.current) return;
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % total);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [total, pausado]);

  if (total === 0) return null;

  return (
    <div
      className="mt-12 max-w-lg mx-auto"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
    >
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {jobs.map((job) => {
            const isFree = job.budget === 0 || job.isFreeHonor;
            const isNomad = job.category.includes("Nômade");
            return (
              <button
                key={job.id}
                onClick={() => onSelect(job)}
                className={`shrink-0 w-full text-left glass-panel ${
                  isFree ? "glass-amber" : isNomad ? "glass-emerald" : ""
                } rounded-3xl relative overflow-hidden group hover:border-emerald-400/50 transition-all cursor-pointer p-0`}
              >
                {job.imagemUrl && (
                  <div className="relative h-40 sm:h-48 w-full overflow-hidden">
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
                      {isFree ? <Icon name="shield" width={26} height={26} /> : <Icon name="bolt" width={26} height={26} />}
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
                      <Icon name="pin" width={26} height={26} /> {job.location}
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${isFree ? "text-amber-400" : "text-emerald-400"}`}>
                      Ver detalhes <Icon name="chat" width={26} height={26} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              aria-label={`Ver anúncio ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === indice ? "w-6 bg-emerald-400" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
