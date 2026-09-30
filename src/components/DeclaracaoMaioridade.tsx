"use client";

import type { Idioma } from "@/lib/textosEstrada";
import { L } from "@/lib/i18n";

/* Caixa obrigatória "Declaro ter 18 anos ou mais" (Termos, seção 7).
   O servidor valida de novo — a caixa sozinha não basta. */
export default function DeclaracaoMaioridade({ idioma, marcado, onChange, id = "maior18" }: {
  idioma: Idioma; marcado: boolean; onChange: (v: boolean) => void; id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm text-slate-200 cursor-pointer">
      <input id={id} type="checkbox" required checked={marcado} onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 mt-0.5 accent-amber-500 cursor-pointer shrink-0" />
      <span>
        <strong>{L(idioma, "Declaro ter 18 anos ou mais.", "Declaro tener 18 años o más.", "I declare I am 18 or older.")}</strong>{" "}
        <span className="text-slate-400">{L(idioma, "A JobPago é só para maiores de idade.", "JobPago es solo para mayores de edad.", "JobPago is for adults only.")}</span>
      </span>
    </label>
  );
}
