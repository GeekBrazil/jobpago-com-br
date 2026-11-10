import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

const LOCAL_MAP: Array<{ match: string; file: string }> = [
  { match: "cassarosa", file: "public/vitrine/cassarosa-hero.webp" },
  { match: "campus", file: "public/vitrine/campus-cards.webp" },
  { match: "visiteprado", file: "public/vitrine/visiteprado-720.webp" },
  { match: "masterclass-3d", file: "public/vitrine/masterclass-3d.webp" },
  { match: "carbontrace", file: "public/vitrine/carbontrace-earthrise.webp" },
  { match: "shopee.com", file: "public/vitrine/ferramentas-720.webp" },
  { match: "jobpago.com.br", file: "public/vitrine/jobpago-720.webp" },
  { match: "allancandido.com/ferramentas", file: "public/vitrine/ferramentas-720.webp" },
  { match: "allancandido.com/insights", file: "public/vitrine/insights-720.webp" },
  { match: "allancandido.com/pro", file: "public/vitrine/pro-720.webp" },
];

function normalizarUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgFallback(hostname: string, titulo: string): string {
  const h = escapeXml(hostname.slice(0, 48));
  const t = escapeXml((titulo || hostname).slice(0, 56));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070b14"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#091526"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="50%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#10b981"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#bg)"/>
    <circle cx="1050" cy="120" r="240" fill="#06b6d4" fill-opacity="0.08"/>
    <circle cx="150" cy="560" r="260" fill="#f59e0b" fill-opacity="0.08"/>
    <rect x="70" y="70" width="1060" height="535" rx="24" fill="#0b1120" stroke="#1e293b" stroke-width="2"/>
    <rect x="70" y="70" width="1060" height="56" rx="24" fill="#060a12"/>
    <circle cx="108" cy="98" r="8" fill="#f43f5e"/>
    <circle cx="132" cy="98" r="8" fill="#f59e0b"/>
    <circle cx="156" cy="98" r="8" fill="#10b981"/>
    <text x="600" y="105" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="20" font-weight="bold">${h}</text>
    <rect x="130" y="210" width="220" height="38" rx="19" fill="#06b6d4" fill-opacity="0.15"/>
    <text x="240" y="235" text-anchor="middle" fill="#22d3ee" font-family="monospace" font-size="16" font-weight="bold">● SITE VERIFICADO</text>
    <text x="130" y="320" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="900">${t}</text>
    <text x="130" y="375" fill="#94a3b8" font-family="sans-serif" font-size="24">Vitrine Oficial JobPago · Clique para abrir o site ao vivo</text>
    <rect x="130" y="440" width="940" height="6" rx="3" fill="url(#accent)"/>
  </svg>`;
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") || "";
  const url = normalizarUrl(rawUrl);
  if (!url) {
    return new NextResponse("URL inválida", { status: 400 });
  }

  const lower = url.toLowerCase();
  for (const item of LOCAL_MAP) {
    if (lower.includes(item.match)) {
      try {
        const buf = readFileSync(join(process.cwd(), item.file));
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=604800",
          },
        });
      } catch {
        // continua para captura remota
      }
    }
  }

  // 1. Tenta capturar print real via Microlink Screenshot API (sem chave, retorna PNG direto da tela)
  try {
    const mlResp = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`,
      {
        headers: { "User-Agent": "Mozilla/5.0 JobPagoScreenshot/1.0" },
        signal: AbortSignal.timeout(6500),
      }
    );
    if (mlResp.ok && (mlResp.headers.get("content-type") || "").startsWith("image/")) {
      const imgBuf = await mlResp.arrayBuffer();
      return new NextResponse(imgBuf, {
        headers: {
          "Content-Type": mlResp.headers.get("content-type") || "image/png",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        },
      });
    }
  } catch {
    // fallback para mshots ou og:image
  }

  // 2. Tenta extrair og:image e <title> direto do HTML do site
  let pageTitle = "";
  try {
    const htmlResp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobPagoBot/1.0)" },
      signal: AbortSignal.timeout(4000),
    });
    if (htmlResp.ok) {
      const html = (await htmlResp.text()).slice(0, 60000);
      const tMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (tMatch?.[1]) pageTitle = tMatch[1].trim();

      const ogMatch =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogMatch?.[1]) {
        const ogUrl = new URL(ogMatch[1], url).toString();
        const imgResp = await fetch(ogUrl, { signal: AbortSignal.timeout(4000) });
        if (imgResp.ok && (imgResp.headers.get("content-type") || "").startsWith("image/")) {
          const buf = await imgResp.arrayBuffer();
          return new NextResponse(buf, {
            headers: {
              "Content-Type": imgResp.headers.get("content-type") || "image/jpeg",
              "Cache-Control": "public, max-age=604800",
            },
          });
        }
      }
    }
  } catch {
    // continua para SVG fallback
  }

  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const svg = svgFallback(hostname, pageTitle || hostname);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
