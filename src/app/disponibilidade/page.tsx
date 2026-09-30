import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CidadeTopo from "../cidade/CidadeTopo";
import FormDisponibilidade from "./FormDisponibilidade";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Cadastre o seu serviço · JobPago · renda na viagem", "Registrá tu servicio · JobPago · ingresos en el viaje", "Register your service · JobPago · income on the go"),
    description: L(i, "Diga o que você sabe fazer e de onde trabalha — da cidade, remoto ou viajando. Quando um negócio precisar, você é chamado. Pix direto, sem comissão.", "Contá qué sabés hacer y desde dónde trabajás: en la ciudad, remoto o viajando. Cuando un negocio lo necesite, te llamamos. Pix directo, sin comisión.", "Tell us what you can do and where you work from — local, remote or while travelling. When a business needs you, we'll call. Direct Pix, no commission."),
    alternates: { canonical: "https://jobpago.com.br/disponibilidade" },
  };
}

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
