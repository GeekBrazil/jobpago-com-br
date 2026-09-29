"use client";

import { IDIOMAS, type Idioma } from "@/lib/textosEstrada";

export default function SeletorIdioma({ idioma, onChange }: { idioma: Idioma; onChange: (i: Idioma) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-white/15 overflow-hidden text-xs font-bold" role="group" aria-label="Idioma / Language">
      {IDIOMAS.map(([id, nome]) => (
        <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={idioma === id}
          className={`px-3 py-1.5 ${idioma === id ? "bg-amber-400 text-black" : "text-slate-300 hover:bg-white/5"}`}>{nome}</button>
      ))}
    </div>
  );
}
