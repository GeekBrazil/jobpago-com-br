import type { Metadata } from "next";
import CidadeTopo from "../cidade/CidadeTopo";
import FormDisponibilidade from "./FormDisponibilidade";

export const metadata: Metadata = {
  title: "Cadastre sua disponibilidade · JobPago",
  description: "Diga o que você sabe fazer e de onde trabalha — da cidade, remoto ou na estrada. Quando um negócio precisar, você é chamado. Pix direto, sem comissão.",
  alternates: { canonical: "https://jobpago.com.br/disponibilidade" },
};

export default function DisponibilidadePage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <FormDisponibilidade />
      </main>
    </div>
  );
}
