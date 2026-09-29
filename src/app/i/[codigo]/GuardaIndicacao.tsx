"use client";

import { useEffect } from "react";
import { guardarIndicacao } from "@/lib/indicacaoCliente";

/* Guarda o código (se for o primeiro link deste navegador) e conta o clique uma vez. */
export default function GuardaIndicacao({ codigo }: { codigo: string }) {
  useEffect(() => {
    if (guardarIndicacao(codigo)) {
      fetch("/api/indicacao/clique", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo }) }).catch(() => {});
    }
  }, [codigo]);
  return null;
}
