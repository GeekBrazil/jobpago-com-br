"use client";

import { useEffect, useMemo, useState } from "react";
import { useIdioma } from "@/components/useIdioma";
import { PAISES, bandeira, mascaraBR, montarTelefone } from "@/lib/telefone";

/* WhatsApp com seletor de país. Brasil mantém a máscara (DDD) de sempre;
   outros países digitam o número como usam no próprio país. */
export default function CampoTelefone({
  onChange, id, className = "", required = true,
}: { onChange: (valor: string) => void; id?: string; className?: string; required?: boolean }) {
  const [idioma] = useIdioma();
  const [iso, setIso] = useState(idioma === "es" ? "AR" : idioma === "en" ? "US" : "BR");
  const [numero, setNumero] = useState("");
  const ddi = PAISES.find(([p]) => p === iso)?.[1] ?? "55";

  // país do navegador (es-AR, en-GB…) quando o campo ainda está vazio
  useEffect(() => {
    const regiao = navigator.language.split("-")[1]?.toUpperCase();
    if (regiao && PAISES.some(([p]) => p === regiao)) setIso(regiao);
  }, []);

  const nomes = useMemo(() => {
    try {
      const dn = new Intl.DisplayNames([idioma === "pt" ? "pt-BR" : idioma], { type: "region" });
      return (p: string) => dn.of(p) ?? p;
    } catch {
      return (p: string) => p;
    }
  }, [idioma]);

  const trocar = (novoIso: string, novoNumero: string) => {
    const novoDdi = PAISES.find(([p]) => p === novoIso)?.[1] ?? "55";
    const n = novoDdi === "55" ? mascaraBR(novoNumero) : novoNumero.replace(/[^\d\s-]/g, "").slice(0, 20);
    setIso(novoIso);
    setNumero(n);
    onChange(montarTelefone(novoDdi, n));
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        aria-label={idioma === "es" ? "País" : idioma === "en" ? "Country" : "País"}
        value={iso}
        onChange={(e) => trocar(e.target.value, numero)}
        className="shrink-0 w-[6.5rem] rounded-xl bg-slate-900 border border-white/10 px-2 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
      >
        {PAISES.map(([p, c]) => (
          <option key={p} value={p}>{bandeira(p)} +{c} {nomes(p)}</option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        required={required}
        autoComplete="tel-national"
        value={numero}
        onChange={(e) => trocar(iso, e.target.value)}
        placeholder={ddi === "55" ? "(24) 99999-9999" : idioma === "en" ? "Number with area code" : "Número con código de área"}
        className="min-w-0 flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
      />
    </div>
  );
}
