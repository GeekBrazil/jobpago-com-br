"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Idioma } from "@/lib/textosEstrada";

/* O idioma vem do servidor (layout) e fica igual no navegador — sem piscar em
   português. Trocar grava o cookie e re-renderiza as partes do servidor. */
const Ctx = createContext<[Idioma, (i: Idioma) => void]>(["pt", () => {}]);

export default function IdiomaProvider({ inicial, children }: { inicial: Idioma; children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(inicial);
  const router = useRouter();
  const troca = (i: Idioma) => {
    setIdioma(i);
    document.cookie = `jp_lang=${i}; path=/; max-age=${365 * 86400}; samesite=lax`;
    document.documentElement.lang = i === "pt" ? "pt-BR" : i;
    router.refresh();
  };
  return <Ctx.Provider value={[idioma, troca]}>{children}</Ctx.Provider>;
}

export const useIdiomaContexto = () => useContext(Ctx);
