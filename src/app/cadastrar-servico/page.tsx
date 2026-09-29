import type { Metadata } from "next";
import CadastroServicoLead from "@/components/CadastroServicoLead";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";

export const metadata: Metadata = {
  title: "Cadastrar Serviço & Envio para Contratantes · JobPago",
  description:
    "Cadastre seu serviço com segurança e compliance LGPD. O JobPago envia as propostas diretamente para os contratantes qualificados da rede.",
};

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
