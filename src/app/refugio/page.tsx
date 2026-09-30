import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CidadeTopo from "../cidade/CidadeTopo";
import RefugioConteudo from "./RefugioConteudo";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Seja um Refúgio da Estrada · Expedição JobPago Paraty → Fortaleza", "Sé un Refugio de la Ruta · Expedición JobPago Paraty → Fortaleza", "Become a Road Refuge · JobPago Expedition Paraty → Fortaleza"),
    description: L(i, "Camping, hostel, pousada, hotel ou pátio para motorhome na rota Paraty → Fortaleza: peça a visita da Expedição JobPago e receba o registro de visita, com data.", "Camping, hostel, posada, hotel o patio para motorhome en la ruta Paraty → Fortaleza: pedí la visita de la Expedición JobPago y recibí el registro de visita, con fecha.", "Campsite, hostel, guesthouse, hotel or motorhome yard on the Paraty → Fortaleza route: request a JobPago Expedition visit and get a dated visit record."),
    alternates: { canonical: "https://jobpago.com.br/refugio" },
  };
}

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
