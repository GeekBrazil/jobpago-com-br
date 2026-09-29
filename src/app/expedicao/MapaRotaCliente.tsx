"use client";

import dynamic from "next/dynamic";
import type { Pedagio, Parada } from "@/components/MapaRota";
import type { Idioma } from "@/lib/textosEstrada";

const MapaRota = dynamic(() => import("@/components/MapaRota"), {
  ssr: false,
  loading: () => <div style={{ height: "min(72vh, 640px)", minHeight: 420 }} className="w-full rounded-3xl bg-slate-900/60 animate-pulse" />,
});

export default function MapaRotaCliente(props: { geometria: [number, number][]; acostamento: string; pista: string; pedagios: Pedagio[]; paradas: Parada[]; idioma?: Idioma }) {
  return <MapaRota {...props} />;
}
