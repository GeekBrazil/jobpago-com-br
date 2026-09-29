import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CidadeTopo from "../cidade/CidadeTopo";
import PainelViajante from "./PainelViajante";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Painel do viajante · JobPago", "Panel del viajero · JobPago", "Traveller dashboard · JobPago"),
    description: L(i, "Contribua com a estrada — fotos, onde dormir, internet, combustível, condição da estrada — e suba de nível: do Andarilho à Lenda da Estrada.", "Contribuí con la ruta (fotos, dónde dormir, internet, combustible, estado de la ruta) y subí de nivel.", "Contribute to the road — photos, places to sleep, internet, fuel, road conditions — and level up."),
    robots: { index: false },
  };
}

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
