"use client";

import { useEffect, useState } from "react";
import { idiomaValido, type Idioma } from "@/lib/textosEstrada";

/* Idioma das páginas do viajante: ?lang= na URL > escolha salva > idioma do navegador. */
export function useIdioma(): [Idioma, (i: Idioma) => void] {
  const [idioma, setIdioma] = useState<Idioma>("pt");
  useEffect(() => {
    let i: Idioma = "pt";
    try {
      const q = new URLSearchParams(location.search).get("lang");
      const salvo = localStorage.getItem("jp_idioma");
      const nav = (navigator.language || "").slice(0, 2);
      i = idiomaValido(q || salvo || (nav === "es" || nav === "en" ? nav : "pt"));
    } catch { /* sem storage */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o idioma só no cliente (evita divergência de hidratação)
    setIdioma(i);
  }, []);
  const troca = (i: Idioma) => {
    setIdioma(i);
    try { localStorage.setItem("jp_idioma", i); } catch { /* sem storage */ }
  };
  return [idioma, troca];
}
