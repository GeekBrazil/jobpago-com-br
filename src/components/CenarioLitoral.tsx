"use client";

import { useEffect, useRef, useState } from "react";

/* Fundo de todas as páginas: a estrada beira-mar em 3D (src/lib/cenario/litoral.ts).
   Carrega o Three.js só depois que a página já apareceu; até lá (e em aparelho
   sem WebGL) fica um céu de entardecer em CSS. A vinheta escura garante leitura do
   texto e abre no fim da página, onde o ponto de apoio aparece. */
export default function CenarioLitoral() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vinhetaRef = useRef<HTMLDivElement>(null);
  const faixaTopoRef = useRef<HTMLDivElement>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let encerrar: (() => void) | null = null;
    let cancelado = false;

    const progresso = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const vinheta = () => {
      const p = progresso();
      const fim = Math.min(1, Math.max(0, (p - 0.7) / 0.2));
      // a faixa escura do topo (leitura do texto) some no fim, para o céu dourado aparecer
      if (faixaTopoRef.current) faixaTopoRef.current.style.opacity = String(1 - fim);
      if (vinhetaRef.current) vinhetaRef.current.style.opacity = String(1 - 0.8 * fim);
    };
    window.addEventListener("scroll", vinheta, { passive: true });
    vinheta();

    const temWebGL = (() => {
      try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
    })();
    if (!temWebGL) return () => window.removeEventListener("scroll", vinheta);

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const leve = window.matchMedia("(pointer: coarse)").matches || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;

    const iniciar = () =>
      import("@/lib/cenario/litoral").then(({ iniciarCenario }) => {
        if (cancelado) return;
        encerrar = iniciarCenario(canvas, { leve, reduzido, progresso, pronto: () => setPronto(true) });
      }).catch(() => {});
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(iniciar, { timeout: 2500 });
    else setTimeout(iniciar, 800);

    return () => {
      cancelado = true;
      window.removeEventListener("scroll", vinheta);
      encerrar?.();
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none">
      {/* céu de entardecer enquanto o 3D não chega (ou sem WebGL) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #1c2f55 0%, #6d4a6b 42%, #e08a5c 62%, #1b3a3f 63%, #0b1d24 100%)" }} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full transition-opacity duration-700"
        style={{ opacity: pronto ? 1 : 0 }}
      />
      <div
        ref={faixaTopoRef}
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(6,9,19,0.62) 0%, rgba(6,9,19,0.42) 45%, rgba(6,9,19,0.12) 75%)" }}
      />
      <div
        ref={vinhetaRef}
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(6,9,19,0) 0%, rgba(6,9,19,0.6) 100%)" }}
      />
    </div>
  );
}
