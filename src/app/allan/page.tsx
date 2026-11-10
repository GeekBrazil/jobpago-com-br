import type { Metadata } from "next";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";
import PerfilAllanClient from "./PerfilAllanClient";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(
      i,
      "Allan Cândido · Software Sob Medida, Sistemas Autônomos IA, Drone 4K & Foto 360° · JobPago",
      "Allan Cândido · Software a Medida, Sistemas Autónomos IA, Dron 4K y Foto 360° · JobPago",
      "Allan Cândido · Custom Software, Autonomous AI Systems, 4K Drone & 360° Photo · JobPago"
    ),
    description: L(
      i,
      "Perfil oficial de Allan Cândido no JobPago: desenvolvimento de software personalizado e sites 3D a 120 FPS, sistemas autônomos de atendimento e operação com IA, filmagens aéreas com drone 4K e fotografia 360° interativa.",
      "Perfil oficial de Allan Cândido en JobPago: desarrollo de software personalizado y sitios 3D a 120 FPS, sistemas autónomos de atención con IA, filmación con dron 4K y fotografía 360°.",
      "Official JobPago profile of Allan Cândido: custom software development and 120 FPS 3D web apps, autonomous AI customer service and operations systems, 4K drone filming, and interactive 360° photography."
    ),
    alternates: { canonical: "https://jobpago.com.br/allan" },
  };
}

export default function PerfilAllanPage() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      <TopoSimples />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <PerfilAllanClient />
      </main>
      <RodapeSimples />
    </div>
  );
}

