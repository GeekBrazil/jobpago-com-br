"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Icon } from "@/components/Icons";

export interface MapPoint {
  id: string;
  title: string;
  category: string;
  budget: number;
  location: string;
  lat: number;
  lng: number;
  details?: string;
  /** Estabelecimento visitado e verificado pessoalmente (selo no pin do mapa). */
  isVerifiedPartner?: boolean;
}

/** Ponto da camada compartilhada de fotos (allancandido.com/api/pontos-fotograficos) —
    mesma fonte que o Olho do Investidor e o Sofia bot alimentam e leem. */
interface PontoFoto {
  id: number;
  origem: string;
  tipo_contribuidor: "allan" | "empresario" | "viajante";
  verificado: boolean;
  titulo: string;
  categoria: string | null;
  descricao: string | null;
  foto_url: string;
  lat: number;
  lng: number;
  fonte_geo: "exif" | "manual";
  criado_em: string;
}

const PONTOS_FOTO_API = "https://allancandido.com/api/pontos-fotograficos";

interface MapaServicosProps {
  points: MapPoint[];
  selectedCategory: string;
  onSelectPoint: (point: MapPoint) => void;
}

// Icones por Categoria
const CATEGORY_COLORS: Record<string, string> = {
  "Nômade & Infra": "#10b981",       // Esmeralda / Lime
  "Tecnologia & TI": "#06b6d4",     // Cyan Dev
  "Estrada & Cargas": "#f59e0b",     // Âmbar
  "Transporte & Fretes": "#3b82f6",  // Azul
  "Vídeo & Conteúdo": "#ec4899",     // Rosa
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
  /** Camadas do control nativo do Leaflet — Certificados é a primeira camada
      de dado externo; CNPJ georreferenciado entra do mesmo jeito quando
      existir (hoje não existe nenhum CNPJ com lat/lon, ver CLAUDE.md). */
  const oportunidadesLayerRef = useRef<L.LayerGroup | null>(null);
  const certificadosLayerRef = useRef<L.LayerGroup | null>(null);
  const fotosComunidadeLayerRef = useRef<L.LayerGroup | null>(null);
  /** Guarda o localizador para o botao poder dispara-lo fora do useEffect. */
  const localizarRef = useRef<(() => void) | null>(null);

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [activeDestination, setActiveDestination] = useState<MapPoint | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: string; durationMin: string } | null>(null);
  const [, setGeoError] = useState<string | null>(null);

  // ── TRAÇADOR MANUAL DE ROTA ──
  // Modo separado do "Traçar Rota até um ponto": aqui o usuário clica no mapa
  // pra empilhar waypoints livres (ex: cidades de uma viagem), sem precisar
  // de GPS nem de um ponto de apoio cadastrado como destino.
  const [isTracingMode, setIsTracingMode] = useState(false);
  const isTracingModeRef = useRef(false);
  const [isRoutePanelHidden, setIsRoutePanelHidden] = useState(false);
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number; nome: string }[]>([]);
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const tracedRouteRef = useRef<L.Polyline | null>(null);
  const [isResolvingRoute, setIsResolvingRoute] = useState(false);
  const [tracedRouteInfo, setTracedRouteInfo] = useState<{ distanceKm: string; durationMin: string } | null>(null);

  // Inicializar o Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = [-23.006, -44.318]; // Centro em Angra dos Reis / Paraty (Costa Verde)
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
    });

    // CARTO Dark Matter passou a exigir API key até pro estilo básico
    // (watermark "API KEY REQUIRED" confirmado ao vivo em 18/09/2026) —
    // voltando pro Esri, que continua de graça e sem chave. O ganho visual
    // agora vem do filtro CSS no container (ver classe mapa-tema-escuro),
    // não troca de provedor de novo sem testar em produção antes.
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: '&copy; Esri &copy; OpenStreetMap',
      maxZoom: 16,
    }).addTo(map);

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
      attribution: '',
      maxZoom: 16,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const oportunidadesLayer = L.layerGroup().addTo(map);
    const certificadosLayer = L.layerGroup();
    const fotosComunidadeLayer = L.layerGroup();
    oportunidadesLayerRef.current = oportunidadesLayer;
    certificadosLayerRef.current = certificadosLayer;
    fotosComunidadeLayerRef.current = fotosComunidadeLayer;

    L.control
      .layers(
        undefined,
        {
          "Oportunidades & Serviços": oportunidadesLayer,
          "Estabelecimentos Certificados": certificadosLayer,
          "Fotos da Comunidade": fotosComunidadeLayer,
        },
        { position: "bottomleft", collapsed: true }
      )
      .addTo(map);

    mapRef.current = map;

    // Em touch, o drag de 1 dedo do Leaflet "sequestra" o scroll da página
    // inteira (chamava preventDefault no touchmove pra fazer pan do mapa,
    // mesmo quando a intenção era só continuar rolando a home). Desliga o
    // pan de 1 dedo e só reativa com 2 dedos no mapa — o tap continua
    // funcionando normal (handler separado do Leaflet, não afetado por
    // dragging.disable()), então clicar em pin e marcar waypoint não muda.
    let cleanupTouchPan: (() => void) | undefined;
    const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) {
      map.dragging.disable();
      const container = map.getContainer();

      const dica = document.createElement("div");
      dica.textContent = "Use 2 dedos pra mover o mapa";
      dica.style.cssText =
        "position:absolute;left:50%;bottom:14px;transform:translateX(-50%);" +
        "background:rgba(0,0,0,0.8);color:#fff;font-size:11px;font-weight:700;" +
        "padding:6px 12px;border-radius:999px;z-index:1500;pointer-events:none;" +
        "opacity:0;transition:opacity 200ms ease;white-space:nowrap;";
      container.appendChild(dica);

      let dicaTimeout: ReturnType<typeof setTimeout> | null = null;
      let touchStart: { x: number; y: number } | null = null;
      const mostrarDica = () => {
        dica.style.opacity = "1";
        if (dicaTimeout) clearTimeout(dicaTimeout);
        dicaTimeout = setTimeout(() => { dica.style.opacity = "0"; }, 1400);
      };

      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length >= 2) {
          map.dragging.enable();
          touchStart = null;
        } else {
          touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length !== 1 || !touchStart) return;
        const dx = Math.abs(e.touches[0].clientX - touchStart.x);
        const dy = Math.abs(e.touches[0].clientY - touchStart.y);
        if (dx > 8 || dy > 8) {
          mostrarDica();
          touchStart = null;
        }
      };
      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) map.dragging.disable();
      };

      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: true });
      container.addEventListener("touchend", onTouchEnd, { passive: true });
      container.addEventListener("touchcancel", onTouchEnd, { passive: true });

      cleanupTouchPan = () => {
        container.removeEventListener("touchstart", onTouchStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onTouchEnd);
        container.removeEventListener("touchcancel", onTouchEnd);
        if (dicaTimeout) clearTimeout(dicaTimeout);
        dica.remove();
      };
    }

    // Clique no mapa só empilha waypoint quando o modo de traçar rota está
    // ativo — o ref evita closure velha, já que este efeito roda uma vez só.
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!isTracingModeRef.current) return;
      addWaypoint(e.latlng.lat, e.latlng.lng);
    });

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
            .bindPopup(`<div style="text-align:center; font-weight:bold; padding:4px;">Você está Aqui</div>`);

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
      cleanupTouchPan?.();
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

    const oportunidadesLayer = oportunidadesLayerRef.current;
    const certificadosLayer = certificadosLayerRef.current;
    if (!oportunidadesLayer || !certificadosLayer) return;
    oportunidadesLayer.clearLayers();
    certificadosLayer.clearLayers();

    const sanitizedPoints = points;

    const filtered = sanitizedPoints.filter(
      (p) => selectedCategory === "Todas" || p.category === selectedCategory
    );

    // Uma função por ponto, chamada até 2x (camada de Oportunidades sempre,
    // camada de Certificados só se verificado) — cada camada precisa da sua
    // própria instância de marker/popup, um único Marker não vive em duas
    // camadas do Leaflet ao mesmo tempo sem conflito de DOM.
    const criarMarker = (pt: MapPoint, color: string, ringColor: string) => {

      // Envelope transparente de 44x44: o circulo continua com 26px de diametro,
      // mas o alvo de toque atende o minimo de 44px sem engordar o mapa.
      // Anel âmbar em vez de branco marca estabelecimento verificado (ver /certificados).
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
          border: 3px solid ${ringColor};
          border-radius: 50%;
          box-shadow: 0 0 10px ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.2s;
        "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-point-marker",
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

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
        <div style="font-size: 11px; color: #9ca3af; margin-bottom: 10px; display:flex; align-items:center; gap:4px;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.6 7-11.5a7 7 0 1 0-14 0C5 14.4 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/></svg>
          ${pt.location}
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6z"/></svg>
          Traçar Rota até Aqui
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

      return marker;
    };

    filtered.forEach((pt) => {
      const color = CATEGORY_COLORS[pt.category] || "#10b981";

      criarMarker(pt, color, pt.isVerifiedPartner ? "#fbbf24" : "#ffffff").addTo(oportunidadesLayer);

      if (pt.isVerifiedPartner) {
        criarMarker(pt, color, "#fbbf24").addTo(certificadosLayer);
      }
    });
  }, [points, selectedCategory]);

  // Camada compartilhada de fotos georreferenciadas (allancandido.com) —
  // busca uma vez, a mesma base que o Olho do Investidor e o Sofia bot
  // alimentam. Só traz o que já está status=aprovado (a API filtra isso
  // sozinha sem precisar de secret aqui).
  useEffect(() => {
    const layer = fotosComunidadeLayerRef.current;
    if (!layer) return;

    const CORES_TIPO: Record<string, string> = {
      allan: "#fbbf24",
      empresario: "#38bdf8",
      viajante: "#a78bfa",
    };
    const LABEL_TIPO: Record<string, string> = {
      allan: "Verificado pelo JobPago",
      empresario: "Enviado pelo estabelecimento",
      viajante: "Avistamento de viajante",
    };

    fetch(PONTOS_FOTO_API)
      .then((res) => res.json())
      .then((data: { ok: boolean; pontos: PontoFoto[] }) => {
        if (!data.ok || !Array.isArray(data.pontos)) return;
        const map = mapRef.current;
        if (!map) return;

        data.pontos.forEach((p) => {
          const cor = CORES_TIPO[p.tipo_contribuidor] || "#a78bfa";
          const icon = L.divIcon({
            className: "foto-comunidade-marker",
            html: `
              <div style="
                width: 38px; height: 38px; border-radius: 10px;
                background-image: url('${p.foto_url}');
                background-size: cover; background-position: center;
                border: 3px solid ${cor};
                box-shadow: 0 0 10px ${cor};
              "></div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });

          const marker = L.marker([p.lat, p.lng], { icon });
          const popup = document.createElement("div");
          popup.className = "p-2 min-w-[200px]";
          popup.innerHTML = `
            <img src="${p.foto_url}" style="width:100%; border-radius:8px; margin-bottom:8px; max-height:140px; object-fit:cover;" />
            <div style="font-size: 10px; font-weight: 800; color: ${cor}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
              ${LABEL_TIPO[p.tipo_contribuidor] || "Comunidade"}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 4px;">
              ${p.titulo}
            </div>
            ${p.descricao ? `<div style="font-size: 12px; color: #9ca3af;">${p.descricao}</div>` : ""}
          `;
          marker.bindPopup(popup);
          marker.addTo(layer);
        });
      })
      .catch(() => {
        // camada é um extra — nunca deve derrubar o resto do mapa
      });
  }, []);

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

  // Sincroniza o ref pro click handler (registrado uma vez só) ver o modo atual.
  useEffect(() => {
    isTracingModeRef.current = isTracingMode;
  }, [isTracingMode]);

  // Nominatim de graça pede uso moderado — clique manual já pauta o ritmo
  // sozinho (uma chamada por clique humano, nunca em loop automático).
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.address || {};
      const cidade = addr.city || addr.town || addr.village || addr.municipality || data.name;
      const uf = addr.state_code || addr.state;
      return cidade ? `${cidade}${uf ? " / " + uf : ""}` : `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    } catch {
      return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    }
  };

  const addWaypoint = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    const numero = waypointMarkersRef.current.length + 1;
    const icon = L.divIcon({
      className: "waypoint-marker",
      html: `<div style="
        width: 26px; height: 26px; border-radius: 50%;
        background: #fbbf24; border: 3px solid #78350f;
        color: #1c1005; font-weight: 900; font-size: 12px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 10px rgba(251,191,36,0.6);
      ">${numero}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    waypointMarkersRef.current.push(marker);

    setWaypoints((prev) => [...prev, { lat, lng, nome: "Resolvendo endereço…" }]);

    reverseGeocode(lat, lng).then((nome) => {
      setWaypoints((prev) => {
        const idx = numero - 1;
        if (!prev[idx]) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], nome };
        marker.bindTooltip(`${numero}. ${nome}`, { permanent: false });
        return next;
      });
    });
  };

  const limparTracado = () => {
    const map = mapRef.current;
    waypointMarkersRef.current.forEach((m) => map?.removeLayer(m));
    waypointMarkersRef.current = [];
    if (tracedRouteRef.current && map) {
      map.removeLayer(tracedRouteRef.current);
      tracedRouteRef.current = null;
    }
    setWaypoints([]);
    setTracedRouteInfo(null);
  };

  const calcularRotaTracada = async () => {
    const map = mapRef.current;
    if (!map || waypoints.length < 2) return;
    setIsResolvingRoute(true);
    try {
      const coordsStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

        if (tracedRouteRef.current) map.removeLayer(tracedRouteRef.current);

        const polyline = L.polyline(coordinates as [number, number][], {
          color: "#fbbf24",
          weight: 5,
          opacity: 0.85,
          dashArray: "1, 8",
          lineCap: "round",
        }).addTo(map);

        tracedRouteRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        setTracedRouteInfo({
          distanceKm: (route.distance / 1000).toFixed(0) + " km",
          durationMin: Math.round(route.duration / 60) + " min",
        });
      }
    } catch (e) {
      console.error("Erro ao calcular rota traçada:", e);
    } finally {
      setIsResolvingRoute(false);
    }
  };

  const copiarListaCidades = () => {
    const lista = waypoints.map((w) => w.nome).join(", ");
    navigator.clipboard?.writeText(lista).catch(() => {});
  };

  const visiblePointsCount = points.length;

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/15 bg-[#0a0c14] shadow-2xl">
      <div
        ref={mapContainerRef}
        className="w-full h-full [&_.leaflet-tile-pane]:[filter:saturate(1.35)_contrast(1.2)_brightness(0.85)]"
      />

      {/* A permissao de localizacao so e pedida daqui, por acao do usuario.
          Pedir no carregamento da pagina e dark pattern e reprova no Lighthouse. */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => localizarRef.current?.()}
          className="min-h-[44px] px-4 rounded-2xl bg-[#08080c]/90 backdrop-blur-md border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:border-emerald-400 transition-colors"
        >
          Minha posição
        </button>
        <button
          type="button"
          onClick={() => {
            if (isTracingMode) limparTracado();
            setIsRoutePanelHidden(false);
            setIsTracingMode((v) => !v);
          }}
          className={`min-h-[44px] px-4 rounded-2xl backdrop-blur-md border text-xs font-bold transition-colors ${
            isTracingMode
              ? "bg-amber-500 border-amber-300 text-black"
              : "bg-[#08080c]/90 border-amber-500/30 text-amber-300 hover:border-amber-400"
          }`}
        >
          {isTracingMode ? "Sair do Modo Rota" : "Traçar Minha Rota"}
        </button>
      </div>

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
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="compass" width={30} height={30} /> Rota Ativa
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
              <span className="flex items-center gap-1"><Icon name="pin" width={28} height={28} /> {routeInfo.distanceKm}</span>
              <span className="flex items-center gap-1"><Icon name="clock" width={28} height={28} /> ~{routeInfo.durationMin}</span>
            </div>
          </div>
        )}

        {isTracingMode && isRoutePanelHidden && (
          <button
            type="button"
            onClick={() => setIsRoutePanelHidden(false)}
            className="bg-[#0b121c]/95 backdrop-blur-lg border border-amber-500/40 rounded-2xl px-4 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider hover:border-amber-400 transition-colors"
          >
            <Icon name="pin" width={22} height={22} />
            {waypoints.length > 0 ? `${waypoints.length} ponto${waypoints.length === 1 ? "" : "s"}` : "Traçando rota"}
            <span className="text-amber-400/70 normal-case font-bold">— ver painel</span>
          </button>
        )}

        {isTracingMode && !isRoutePanelHidden && (
          <div className="bg-[#0b121c]/95 backdrop-blur-lg border border-amber-500/40 rounded-2xl p-4 shadow-2xl pointer-events-auto max-w-xs animate-in fade-in">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="pin" width={30} height={30} /> Clique no mapa pra marcar pontos
              </span>
              <button
                type="button"
                onClick={() => setIsRoutePanelHidden(true)}
                aria-label="Esconder painel de rota"
                title="Esconder painel pra ver a rota"
                className="shrink-0 text-zinc-400 hover:text-white text-sm font-black px-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                −
              </button>
            </div>

            {waypoints.length > 0 && (
              <ol className="mt-3 flex flex-col gap-1 max-h-32 overflow-y-auto text-xs text-slate-200">
                {waypoints.map((w, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-black">{i + 1}.</span> {w.nome}
                  </li>
                ))}
              </ol>
            )}

            {tracedRouteInfo && (
              <div className="flex items-center gap-4 mt-3 text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1"><Icon name="pin" width={28} height={28} /> {tracedRouteInfo.distanceKm}</span>
                <span className="flex items-center gap-1"><Icon name="clock" width={28} height={28} /> ~{tracedRouteInfo.durationMin}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={calcularRotaTracada}
                disabled={waypoints.length < 2 || isResolvingRoute}
                className="text-xs font-black px-3 py-1.5 rounded-lg bg-amber-500 text-black disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isResolvingRoute ? "Calculando…" : "Calcular Rota"}
              </button>
              <button
                onClick={copiarListaCidades}
                disabled={waypoints.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Copiar Lista de Cidades
              </button>
              <button
                onClick={limparTracado}
                disabled={waypoints.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Limpar
              </button>
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
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Estrada & Cargas
        </div>
      </div>
    </div>
  );
}
