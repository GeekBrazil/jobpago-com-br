"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

/* Mapa da Expedição (Paraty → Fortaleza): traçado colorido por pista duplicada/simples
   e trechos com acostamento confirmado no OpenStreetMap, praças de pedágio (ANTT) e paradas com link
   para o relatório da cidade. Sem prender o scroll no celular. */

export interface Parada { nome: string; uf: string; ibge?: string; lat: number; lon: number }
export interface Pedagio { nome: string; rodovia: string; concessionaria: string; km_rota: number; lat: number; lon: number }

const COR_PISTA = { d: "#60a5fa", s: "#fb923c", "?": "#94a3b8" } as const;
const COR_ACOST = { s: "#34d399", n: "#f87171" } as const;

/* Desenha trechos contínuos de mesma classe (1 caractere por km em `classes`). */
function trechos(mapa: L.Map, geo: [number, number][], classes: string, estilo: (c: string) => L.PolylineOptions | null) {
  let ini = 0;
  for (let i = 1; i <= geo.length; i++) {
    const cls = classes[ini] ?? "?";
    if (i === geo.length || (classes[i] ?? "?") !== cls) {
      const pts = geo.slice(ini, Math.min(i + 1, geo.length));
      const e = estilo(cls);
      if (e && pts.length > 1) L.polyline(pts, e).addTo(mapa);
      ini = i;
    }
  }
}

export default function MapaRota({
  geometria, acostamento, pista, pedagios, paradas,
}: { geometria: [number, number][]; acostamento: string; pista: string; pedagios: Pedagio[]; paradas: Parada[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const toque = window.matchMedia("(pointer: coarse)").matches;
    const mapa = L.map(ref.current, { zoomControl: true, dragging: !toque, scrollWheelZoom: false, attributionControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      maxZoom: 18,
    }).addTo(mapa);

    // base: pista duplicada/simples; por cima, só os trechos com acostamento confirmado no OSM
    trechos(mapa, geometria, pista, (c) => ({ color: COR_PISTA[c as keyof typeof COR_PISTA] ?? COR_PISTA["?"], weight: c === "d" ? 5 : 3.5, opacity: 0.85 }));
    trechos(mapa, geometria, acostamento, (c) => (c === "s" || c === "n" ? { color: COR_ACOST[c], weight: 9, opacity: 0.9 } : null));

    const icone = (cor: string, tam: number) =>
      L.divIcon({ className: "", html: `<span style="display:block;width:${tam}px;height:${tam}px;border-radius:50%;background:${cor};border:2px solid #0b1220;box-shadow:0 0 0 2px ${cor}55"></span>`, iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2] });

    for (const p of pedagios) {
      L.marker([p.lat, p.lon], { icon: icone("#fbbf24", 12), title: p.nome })
        .bindPopup(`<strong>Pedágio ${p.nome}</strong><br>${p.rodovia} · ${p.concessionaria}<br>km ${Math.round(p.km_rota)} do roteiro`)
        .addTo(mapa);
    }
    for (const c of paradas) {
      const link = c.ibge ? `<br><a href="/cidade/${c.ibge}">Relatório da cidade →</a>` : "";
      L.marker([c.lat, c.lon], { icon: icone("#f8fafc", 14), title: c.nome })
        .bindPopup(`<strong>${c.nome} · ${c.uf}</strong>${link}`)
        .addTo(mapa);
    }
    mapa.fitBounds(L.latLngBounds(geometria), { padding: [20, 20] });
    return () => { mapa.remove(); };
  }, [geometria, acostamento, pista, pedagios, paradas]);

  return <div ref={ref} className="w-full h-[520px] sm:h-[640px] rounded-3xl overflow-hidden border border-white/10" role="region" aria-label="Mapa do roteiro Paraty a Fortaleza" />;
}
