import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import CadastroServicoLead from "@/components/CadastroServicoLead";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Cadastrar Serviço & Envio para Contratantes · JobPago", "Registrar servicio y envío a contratantes · JobPago", "Post a service or task · JobPago"),
    description: L(i, "Cadastre seu serviço com segurança e compliance LGPD. O JobPago envia as propostas diretamente para os contratantes qualificados da rede.", "Registrá tu servicio de forma segura y conforme a la LGPD. JobPago envía las propuestas directamente a los contratantes de la red.", "Register your service safely and LGPD-compliant. JobPago sends proposals straight to the right people in the network."),
  };
}

export default async function CadastrarServicoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CadastroServicoLead tipoInicial={tipo === "contratante" ? "contratante" : "prestador"} />
      </main>

      <RodapeSimples />
    </div>
  );
}
