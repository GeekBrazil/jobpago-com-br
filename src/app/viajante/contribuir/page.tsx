import type { Metadata } from "next";
import { Suspense } from "react";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormContribuicao from "./FormContribuicao";

export const metadata: Metadata = { title: "Contribuir com a estrada · JobPago", robots: { index: false } };

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
