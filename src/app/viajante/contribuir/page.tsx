import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import { Suspense } from "react";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormContribuicao from "./FormContribuicao";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Contribuir com a rota · JobPago · renda na viagem", "Contribuir con la ruta · JobPago · ingresos en el viaje", "Contribute to the route · JobPago · income on the go"),
    robots: { index: false },
  };
}

export default function ContribuirViajantePage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Suspense fallback={<p className="text-slate-400">…</p>}>
          <FormContribuicao />
        </Suspense>
      </main>
    </div>
  );
}
