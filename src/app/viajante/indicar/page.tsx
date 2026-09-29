import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CidadeTopo from "../../cidade/CidadeTopo";
import PainelIndicacao from "./PainelIndicacao";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Indicar e ganhar · JobPago", "Recomendar y ganar · JobPago", "Refer and earn · JobPago"),
    robots: { index: false },
  };
}

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
