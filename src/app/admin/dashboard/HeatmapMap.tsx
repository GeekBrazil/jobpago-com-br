"use client";

import { useEffect, useRef, useState } from "react";

interface HeatmapMapProps {
  currentLat: number;
  currentLon: number;
  currentRadius: number;
  points: any[];
  onSelectCnpj: (cnpj: string) => void;
  onChangeRadius: (r: number) => void;
  onUseGps: () => void;
}

export default function HeatmapMap({
  currentLat,
  currentLon,
  currentRadius,
  points,
  onSelectCnpj,
  onChangeRadius,
  onUseGps,
}: HeatmapMapProps) {
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(window as any).L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/leaflet/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "/leaflet/leaflet.js";
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      const container = document.getElementById("jobpagoMap");
      if (!container) return;
      mapRef.current = L.map("jobpagoMap", { zoomControl: true }).setView([currentLat, currentLon], 14);

      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      });
      const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "&copy; Esri World Imagery",
      });
      osm.addTo(mapRef.current);
      L.control.layers({
        "🗺️ Ruas (OpenStreetMap)": osm,
        "🛰️ Satélite HD": sat,
      }, undefined, { position: 'topright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Limpa camadas anteriores
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    // 1. Círculo de Raio
    const circleRadiusM = currentRadius * 1000;
    const outerCircle = L.circle([currentLat, currentLon], {
      radius: circleRadiusM,
      color: "#6366f1",
      weight: 2,
      fillColor: "#6366f1",
      fillOpacity: 0.04,
      dashArray: "6, 6",
    }).addTo(map);
    layersRef.current.push(outerCircle);

    // 2. Base Computador Allan
    const baseMarker = L.circleMarker([currentLat, currentLon], {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: "#4f46e5",
      fillOpacity: 1,
    }).addTo(map);
    baseMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px;">
        <div style="font-weight: 800; font-size: 13px; color: #4f46e5;">📍 BASE / COMPUTADOR ALLAN</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">GPS: ${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}</div>
      </div>
    `);
    layersRef.current.push(baseMarker);

    // 3. Camada de Calor + Pinos
    points.forEach((p) => {
      const heatBlob = L.circle([p.lat, p.lon], {
        radius: 120 + (p.pesoCalor || 0.5) * 100,
        color: "transparent",
        fillColor: "#ef4444",
        fillOpacity: 0.32,
      }).addTo(map);
      layersRef.current.push(heatBlob);

      const pin = L.circleMarker([p.lat, p.lon], {
        radius: 6,
        color: "#ffffff",
        weight: 2,
        fillColor: "#dc2626",
        fillOpacity: 1,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: system-ui; min-width: 230px; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${p.nome}</div>
          <div style="font-size: 10px; font-weight: bold; color: #dc2626; margin: 4px 0;">🚫 SEM SITE • 🏛️ ZERO LICITAÇÕES</div>
          <div style="font-size: 11px; color: #475569;">📏 <b>${p.distanciaM} m</b> de distância</div>
          <div style="font-size: 11px; color: #475569;">📍 ${p.endereco} (${p.municipio})</div>
          <div style="font-size: 11px; color: #475569;">💰 Capital: R$ ${Number(p.capitalSocial).toLocaleString("pt-BR")}</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">🏷️ ${p.cnae}</div>
          <button id="btn-lead-${p.cnpj}" style="width: 100%; padding: 6px 10px; border-radius: 6px; background: #4f46e5; color: #fff; border: none; font-weight: bold; cursor: pointer; font-size: 11px;">Carregar Diagnóstico Completo →</button>
        </div>
      `;
      pin.bindPopup(popupHtml);

      pin.on("popupopen", () => {
        const btn = document.getElementById(`btn-lead-${p.cnpj}`);
        if (btn) btn.onclick = () => onSelectCnpj(p.cnpj);
      });

      layersRef.current.push(pin);
    });

    map.setView([currentLat, currentLon], currentRadius <= 1.5 ? 15 : currentRadius <= 3.5 ? 14 : 13);
  }, [loaded, currentLat, currentLon, currentRadius, points, onSelectCnpj]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              🔥 MAPA DE CALOR: SEM SITE & ZERO LICITAÇÕES
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Base: Rio de Janeiro / Costa Verde
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualização cartográfica das ruas e estabelecimentos no raio que não possuem site e nunca participaram de licitações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Raio:</span>
          {[1.0, 3.0, 5.0].map((r) => (
            <button
              key={r}
              onClick={() => onChangeRadius(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                currentRadius === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {r} km
            </button>
          ))}
          <button
            onClick={onUseGps}
            className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            📍 GPS Navegador
          </button>
        </div>
      </div>

      <div id="jobpagoMap" className="w-full h-[500px] rounded-lg border border-slate-200 overflow-hidden z-0"></div>
    </div>
  );
}
