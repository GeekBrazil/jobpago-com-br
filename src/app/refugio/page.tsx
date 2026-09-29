import type { Metadata } from "next";
import CidadeTopo from "../cidade/CidadeTopo";
import RefugioConteudo from "./RefugioConteudo";

export const metadata: Metadata = {
  title: "Seja um Refúgio da Estrada · Expedição JobPago Paraty → Fortaleza",
  description:
    "Camping, hostel, pousada, hotel ou pátio para motorhome na rota Paraty → Fortaleza: peça a visita da Expedição JobPago e ganhe o selo de Refúgio da Estrada verificado.",
  alternates: { canonical: "https://jobpago.com.br/refugio" },
};

export default function RefugioPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <RefugioConteudo />
      </main>
    </div>
  );
}
