import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  const url = normalizarUrl(raw);
  if (!url) {
    return NextResponse.json({ ok: false, erro: "URL inválida" }, { status: 400 });
  }

  const parsed = new URL(url);
  const dominio = parsed.hostname.replace(/^www\./, "") + (parsed.pathname !== "/" ? parsed.pathname.replace(/\/$/, "") : "");
  let titulo = parsed.hostname.replace(/^www\./, "");
  let descricao = "Site verificado e publicado na vitrine do JobPago.";

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobPagoPreview/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(4500),
    });
    if (r.ok) {
      const html = (await r.text()).slice(0, 65000);
      const titleMatch =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) {
        titulo = titleMatch[1].replace(/\s+/g, " ").trim().slice(0, 90);
      }
      const descMatch =
        html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      if (descMatch?.[1]) {
        descricao = descMatch[1].replace(/\s+/g, " ").trim().slice(0, 180);
      }
    }
  } catch {
    // usa fallback limpo pelo domínio
  }

  return NextResponse.json(
    {
      ok: true,
      url,
      dominio,
      titulo,
      descricao,
      screenshotUrl: `/api/screenshot?url=${encodeURIComponent(url)}`,
    },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
