"use client";

import { useIdioma } from "@/components/useIdioma";
import type { Idioma } from "@/lib/textosEstrada";

/* Seletor de idioma presente em todas as páginas (canto inferior esquerdo; o chat fica à direita). */
export default function IdiomaFlutuante() {
  const [idioma, setIdioma] = useIdioma();
  return (
    <div className="fixed bottom-4 left-4 z-40 inline-flex rounded-full border border-white/15 bg-slate-950/85 backdrop-blur-md overflow-hidden text-[11px] font-black shadow-lg" role="group" aria-label="Idioma · Idioma · Language">
      {(["pt", "es", "en"] as Idioma[]).map((i) => (
        <button key={i} type="button" onClick={() => setIdioma(i)} aria-pressed={idioma === i}
          className={`px-2.5 py-1.5 uppercase ${idioma === i ? "bg-amber-400 text-black" : "text-slate-300 hover:bg-white/10"}`}>{i}</button>
      ))}
    </div>
  );
}
