"use client";

import dynamic from "next/dynamic";
import type { Pedagio, Parada } from "@/components/MapaRota";

const MapaRota = dynamic(() => import("@/components/MapaRota"), {
  ssr: false,
  loading: () => <div className="w-full h-[520px] sm:h-[640px] rounded-3xl bg-slate-900/60 animate-pulse" />,
});

export default function MapaRotaCliente(props: { geometria: [number, number][]; acostamento: string; pista: string; pedagios: Pedagio[]; paradas: Parada[] }) {
  return <MapaRota {...props} />;
}
