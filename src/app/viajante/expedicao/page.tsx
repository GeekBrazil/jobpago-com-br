import type { Metadata } from "next";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormExpedicao from "./FormExpedicao";

export const metadata: Metadata = { title: "Sua expedição · JobPago", robots: { index: false } };

export default function ExpedicaoViajantePage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <FormExpedicao />
      </main>
    </div>
  );
}
