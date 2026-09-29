import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormExpedicao from "./FormExpedicao";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Sua expedição · JobPago", "Tu expedición · JobPago", "Your expedition · JobPago"),
    robots: { index: false },
  };
}

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
