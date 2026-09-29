import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import ContribuirFotoForm from "@/components/ContribuirFotoForm";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";

export const metadata: Metadata = {
  title: "Contribuir com uma Foto · JobPago.com.br",
  description:
    "Envie a foto de um posto, pousada, camping ou ponto de apoio na estrada — a localização é lida automaticamente da foto.",
  robots: { index: true, follow: true },
};

export default function ContribuirPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <Icon name="pin" width={30} height={30} /> Camada da Comunidade
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            Achou um ponto de apoio? Manda a foto.
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Posto com chuveiro, pousada que aceita motorhome, oficina de
            confiança — se a foto tiver GPS, a localização entra sozinha no
            mapa. Toda contribuição passa por uma revisão antes de aparecer
            pra todo mundo.
          </p>
        </div>

        <div className="mt-12">
          <ContribuirFotoForm />
        </div>
      </main>

      <RodapeSimples />
    </div>
  );
}
