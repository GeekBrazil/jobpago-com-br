import type { Metadata } from "next";
import CidadeTopo from "../cidade/CidadeTopo";
import PainelViajante from "./PainelViajante";

export const metadata: Metadata = {
  title: "Painel do viajante · JobPago",
  description: "Contribua com a estrada — fotos, onde dormir, internet, combustível, condição da estrada — e suba de nível: do Andarilho à Lenda da Estrada.",
  robots: { index: false },
};

export default function ViajantePage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <PainelViajante />
      </main>
    </div>
  );
}
