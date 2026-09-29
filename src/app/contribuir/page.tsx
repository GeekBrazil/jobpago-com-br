import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import ContribuirFotoForm from "@/components/ContribuirFotoForm";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Contribuir com uma Foto · JobPago.com.br", "Contribuir con una foto · JobPago.com.br", "Contribute a photo · JobPago.com.br"),
    description: L(i, "Envie a foto de um posto, pousada, camping ou ponto de apoio na estrada — a localização é lida automaticamente da foto.", "Enviá la foto de una estación, posada, camping o punto de apoyo en la ruta; la ubicación se lee automáticamente de la foto.", "Send a photo of a gas station, guesthouse, campsite or support point on the road — the location is read from the photo automatically."),
    robots: { index: true, follow: true },
  };
}

export default async function ContribuirPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <Icon name="pin" width={30} height={30} /> {t("Camada da Comunidade", "Capa de la Comunidad", "Community Layer")}
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            {t("Achou um ponto de apoio? Manda a foto.", "¿Encontraste un punto de apoyo? Mandá la foto.", "Found a support point? Send the photo.")}
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("Posto com chuveiro, pousada que aceita motorhome, oficina de confiança — se a foto tiver GPS, a localização entra sozinha no mapa. Toda contribuição passa por uma revisão antes de aparecer pra todo mundo.",
              "Estación con ducha, posada que acepta motorhome, taller de confianza: si la foto tiene GPS, la ubicación entra sola en el mapa. Toda contribución se revisa antes de aparecer para todos.",
              "A gas station with a shower, a guesthouse that takes motorhomes, a trusted mechanic — if the photo has GPS, the location goes on the map by itself. Every contribution is reviewed before it goes public.")}
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
