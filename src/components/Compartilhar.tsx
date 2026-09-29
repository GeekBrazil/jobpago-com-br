"use client";

import { useState } from "react";

/* Compartilhar um card: no celular abre a folha de compartilhar com a imagem
   (Instagram, WhatsApp, X…); sem suporte, baixa o PNG. */
const FORMATOS = [
  ["feed", "Instagram (feed)"],
  ["story", "Stories"],
  ["link", "X / Facebook"],
] as const;

export default function Compartilhar({ card, titulo, link, compacto = false }: { card: string; titulo: string; link: string; compacto?: boolean }) {
  const [estado, setEstado] = useState("");

  async function compartilhar(formato: string) {
    setEstado("…");
    try {
      const r = await fetch(`${card}?formato=${formato}`);
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const arquivo = new File([blob], `jobpago-${formato}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: titulo, text: `${titulo} ${link}` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = arquivo.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setEstado("");
    } catch (e) {
      setEstado(e instanceof DOMException && e.name === "AbortError" ? "" : "Não deu — tente de novo.");
    }
  }

  return (
    <div className={compacto ? "mt-3" : "mt-6"}>
      {!compacto && <p className="text-sm font-bold text-slate-300 mb-2">Compartilhar</p>}
      <div className="flex flex-wrap gap-2">
        {FORMATOS.map(([f, rotulo]) => (
          <button key={f} type="button" onClick={() => compartilhar(f)}
            className="btn-secondary-glass rounded-xl px-3 py-2 text-xs font-bold">{rotulo}</button>
        ))}
      </div>
      {estado && <p className="mt-2 text-xs text-slate-400">{estado}</p>}
    </div>
  );
}
