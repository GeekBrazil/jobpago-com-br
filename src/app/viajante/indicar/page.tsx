import type { Metadata } from "next";
import CidadeTopo from "../../cidade/CidadeTopo";
import PainelIndicacao from "./PainelIndicacao";

export const metadata: Metadata = { title: "Indicar e ganhar · JobPago", robots: { index: false } };

export default function IndicarPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <PainelIndicacao />
      </main>
    </div>
  );
}
