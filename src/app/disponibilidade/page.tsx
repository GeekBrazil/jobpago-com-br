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
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Quero renda</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">Cadastre sua disponibilidade</h1>
        <p className="mt-4 text-lg text-slate-300">
          Sem vitrine: seu contato não fica exposto. Você diz o que sabe fazer e de onde trabalha; quando um negócio publicar uma tarefa que combina,
          a gente te chama no WhatsApp. O pagamento é combinado direto entre vocês, por Pix, sem comissão.
        </p>
        <FormDisponibilidade />
      </main>
    </div>
  );
}
