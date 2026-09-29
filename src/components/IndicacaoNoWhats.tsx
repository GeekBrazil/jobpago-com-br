"use client";

import { useEffect } from "react";
import { lerIndicacao } from "@/lib/indicacaoCliente";

/* Se o visitante chegou por um link de indicação, todo botão de WhatsApp do
   Allan leva "Indicação: CÓDIGO" no fim da mensagem — é por ela que a Central
   liga o fechamento a quem indicou. */
const NUMERO = "5524993326966";

export default function IndicacaoNoWhats() {
  useEffect(() => {
    const codigo = lerIndicacao();
    if (!codigo) return;
    const marca = `Indicação: ${codigo}`;
    const aplica = () => {
      document.querySelectorAll<HTMLAnchorElement>(`a[href*="wa.me/${NUMERO}"]`).forEach((a) => {
        try {
          const u = new URL(a.href);
          const t = u.searchParams.get("text") || "";
          if (t.includes(marca)) return;
          // encodeURIComponent (%20), não searchParams.set: este troca espaço por "+", que aparece literal no WhatsApp
          a.href = `https://wa.me/${NUMERO}?text=${encodeURIComponent((t ? t + "\n\n" : "") + marca)}`;
        } catch { /* link estranho: deixa como está */ }
      });
    };
    aplica();
    const obs = new MutationObserver(aplica);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return null;
}
