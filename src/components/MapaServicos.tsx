"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

export interface MapPoint {
  id: string;
  title: string;
  category: string;
  budget: number;
  location: string;
  lat: number;
  lng: number;
  details?: string;
}

interface MapaServicosProps {
  points: MapPoint[];
  selectedCategory: string;
  onSelectPoint: (point: MapPoint) => void;
}

// Icones por Categoria
const CATEGORY_COLORS: Record<string, string> = {
  "Nômade & Infra": "#10b981",       // Esmeralda / Lime
  "Tecnologia & TI": "#06b6d4",     // Cyan Dev
  "Reformas & Reparos": "#f59e0b",   // Amarelo
  "Transporte & Fretes": "#3b82f6",  // Azul
  "Fotografia & Eventos": "#ec4899", // Rosa
  "Aulas & Consultoria": "#6366f1",  // Indigo
  "Design & Mídia": "#a855f7",      // Roxo
};

export default function MapaServicos({
  points,
  selectedCategory,
  onSelectPoint,
}: MapaServicosProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  /** Guarda o localizador para o botao poder dispara-lo fora do useEffect. */
  const localizarRef = useRef<(() => void) | null>(null);

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [activeDestination, setActiveDestination] = useState<MapPoint | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: string; durationMin: string } | null>(null);
  const [, setGeoError] = useState<string | null>(null);

  // Inicializar o Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = [-23.006, -44.318]; // Centro em Angra dos Reis / Paraty (Costa Verde)
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
    });

    // Camada Esri Dark Gray Base + Reference (Rápida, sem API Key, sem marcas d'água)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: '&copy; Esri &copy; OpenStreetMap',
      maxZoom: 16,
    }).addTo(map);

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
      attribution: '',
      maxZoom: 16,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Geolocalização: nunca pedir permissão no carregamento da página.
    // Só centraliza sozinho em quem já concedeu antes; para os demais o mapa
    // abre na visão padrão e a localização fica atrás do botão "Minha posição".
    const localizar = () => {
      if (typeof window === "undefined" || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          const uPos: [number, number] = [uLat, uLng];
          setUserPos(uPos);

          const userIcon = L.divIcon({
            className: "custom-user-marker",
            html: `<div class="user-pulse-marker" title="Sua Posição Atual"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          userMarkerRef.current = L.marker(uPos, { icon: userIcon })
            .addTo(map)
            .bindPopup(`<div style="text-align:center; font-weight:bold; padding:4px;">📍 Você está Aqui</div>`);

          map.setView(uPos, 13);
        },
        () => {
          setGeoError("Permissão de localização não concedida. Usando centro padrão.");
        }
      );
    };
    localizarRef.current = localizar;

    // Permissions API diz se ja ha consentimento — consultar nao dispara prompt.
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((p) => { if (p.state === "granted") localizar(); })
        .catch(() => { /* navegador sem Permissions API: espera o clique */ });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Atualizar Marcadores no Mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Limpar markers existentes (exceto usuário)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        map.removeLayer(layer);
      }
    });

    const sanitizedPoints = points;

    const filtered = sanitizedPoints.filter(
      (p) => selectedCategory === "Todas" || p.category === selectedCategory
    );

    filtered.forEach((pt) => {
      const color = CATEGORY_COLORS[pt.category] || "#10b981";

      // Envelope transparente de 44x44: o circulo continua com 26px de diametro,
      // mas o alvo de toque atende o minimo de 44px sem engordar o mapa.
      const markerHtml = `
        <div style="
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
        <div style="
          width: 26px;
          height: 26px;
          background-color: ${color};
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ⚡
        </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-point-marker",
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(map);

      const popupContent = document.createElement("div");
      popupContent.className = "p-2 min-w-[200px]";
      popupContent.innerHTML = `
        <div style="font-size: 11px; font-weight: 800; color: ${color}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
          ${pt.category}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 6px;">
          ${pt.title}
        </div>
        <div style="font-size: 13px; font-weight: 900; color: #10b981; margin-bottom: 8px;">
          R$ ${pt.budget.toLocaleString("pt-BR")} via PIX
        </div>
        <div style="font-size: 11px; color: #9ca3af; margin-bottom: 10px;">
          📍 ${pt.location}
        </div>
        <button id="btn-route-${pt.id}" style="
          width: 100%;
          background: linear-gradient(90deg, #10b981, #06b6d4);
          color: #000;
          font-weight: 800;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        ">
          🗺️ Traçar Rota até Aqui
        </button>
      `;

      marker.bindPopup(popupContent);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-route-${pt.id}`);
        if (btn) {
          btn.onclick = () => {
            handleCalculateRoute(pt);
            onSelectPoint(pt);
          };
        }
      });
    });
  }, [points, selectedCategory]);

  // Função para Traçar Rota (OSRM API pública)
  const handleCalculateRoute = async (destination: MapPoint) => {
    setActiveDestination(destination);
    const map = mapRef.current;
    if (!map) return;

    const originCoords = userPos || [-23.000, -44.300];

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originCoords[1]},${originCoords[0]};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }

        const polylineColor = "#10b981";

        const polyline = L.polyline(coordinates as [number, number][], {
          color: polylineColor,
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        routePolylineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        const dist = (route.distance / 1000).toFixed(1) + " km";
        const dur = Math.round(route.duration / 60) + " min";
        setRouteInfo({ distanceKm: dist, durationMin: dur });
      }
    } catch (e) {
      console.error("Erro ao calcular rota:", e);
      if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
      const fallbackPolyline = L.polyline([originCoords, [destination.lat, destination.lng]], {
        color: "#10b981",
        weight: 4,
        dashArray: "6, 6",
      }).addTo(map);
      routePolylineRef.current = fallbackPolyline;
    }
  };

  const clearRoute = () => {
    if (routePolylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    setActiveDestination(null);
    setRouteInfo(null);
  };

  const visiblePointsCount = points.length;

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/15 bg-[#0a0c14] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* A permissao de localizacao so e pedida daqui, por acao do usuario.
          Pedir no carregamento da pagina e dark pattern e reprova no Lighthouse. */}
      <button
        type="button"
        onClick={() => localizarRef.current?.()}
        className="absolute bottom-4 left-4 z-[1000] min-h-[44px] px-4 rounded-2xl bg-[#08080c]/90 backdrop-blur-md border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:border-emerald-400 transition-colors"
      >
        Minha posição
      </button>

      {/* Overlays de Informação e Controles */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#08080c]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Mapa de Serviços GPS
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {visiblePointsCount} pontos disponíveis na região
          </p>
        </div>

        {routeInfo && activeDestination && (
          <div className="bg-[#0b121c]/95 backdrop-blur-lg border border-cyan-500/40 rounded-2xl p-4 shadow-2xl pointer-events-auto max-w-xs animate-in fade-in">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                🗺️ Rota Ativa
              </span>
              <button
                onClick={clearRoute}
                className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 bg-white/10 rounded-lg"
              >
                Limpar Rota
              </button>
            </div>
            <p className="text-sm font-extrabold text-white truncate">
              {activeDestination.title}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-emerald-400">
              <span>📍 {routeInfo.distanceKm}</span>
              <span>⏱️ ~{routeInfo.durationMin}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legenda de Categorias Rápidas */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden sm:flex items-center gap-2 bg-[#08080c]/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-xl">
        <span className="text-[10px] font-bold text-zinc-400 uppercase px-1">Legenda:</span>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Nômade & Infra
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Tech & Devs
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Reparos
        </div>
      </div>
    </div>
  );
}
