import { NextRequest, NextResponse } from "next/server";
import { buscarMunicipios } from "@/lib/relatorioCidade";

export const runtime = "nodejs";

/**
 * Detecta a cidade do visitante por coordenadas GPS ou por cabeçalhos de rede / IP.
 * Se informado lat/lng: consulta Nominatim para obter o nome da cidade brasileira.
 * Se não informado: lê headers como cf-ipcity / x-vercel-ip-city.
 * Por fim, resolve o código IBGE oficial de 7 dígitos via buscarMunicipios().
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  let nomeCidade: string | null = null;
  let ufHint: string | null = null;
  let metodo: "gps" | "ip" = "ip";

  if (lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    metodo = "gps";
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${Number(lat).toFixed(5)}&lon=${Number(lng).toFixed(5)}&zoom=10&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "JobPago-Geo/1.0 (contato@jobpago.com.br)" },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        nomeCidade = addr.city || addr.town || addr.village || addr.municipality || data.name || null;
        ufHint = addr.state_code || addr["ISO3166-2-lvl4"]?.replace("BR-", "") || null;
      }
    } catch {
      // Nominatim indisponível: segue para fallback
    }
  }

  // Fallback para headers de IP (Cloudflare / proxies) se GPS não resolveu cidade
  if (!nomeCidade) {
    metodo = "ip";
    const headerCity = req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city");
    if (headerCity) {
      nomeCidade = decodeURIComponent(headerCity);
      ufHint = req.headers.get("cf-region-code") || req.headers.get("cf-region") || null;
    }
  }

  if (nomeCidade) {
    const limpo = nomeCidade.trim();
    const resultados = await buscarMunicipios(limpo);
    if (resultados && resultados.length > 0) {
      // Se tiver hint de UF, prioriza o município do estado certo
      const escolhido = (ufHint && resultados.find((m) => m.uf.toUpperCase() === ufHint?.toUpperCase())) || resultados[0];
      return NextResponse.json({
        ok: true,
        ibge: String(escolhido.municipio_ibge),
        cidade: escolhido.municipio_nome,
        uf: escolhido.uf,
        metodo,
      });
    }
  }

  return NextResponse.json({ ok: false });
}
