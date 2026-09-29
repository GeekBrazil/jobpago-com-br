import { NextRequest, NextResponse } from "next/server";
import { garantirTabelasIndicacao, codigoValido } from "@/lib/indicacao";

export const runtime = "nodejs";

/* Clique no link de indicação (a página /i/{código} chama uma vez por navegador). */
const hits = new Map<string, { n: number; t: number }>();
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const agora = Date.now();
  const h = hits.get(ip);
  if (h && agora - h.t < 60 * 60_000 && ++h.n > 10) return NextResponse.json({ ok: true });
  if (!h || agora - h.t >= 60 * 60_000) hits.set(ip, { n: 1, t: agora });
  const b = await req.json().catch(() => ({}));
  if (!codigoValido(b.codigo)) return NextResponse.json({ ok: false }, { status: 400 });
  const pool = await garantirTabelasIndicacao();
  if (!pool) return NextResponse.json({ ok: false }, { status: 503 });
  await pool.query(`INSERT INTO indicacao_cliques (codigo) SELECT $1::varchar WHERE EXISTS (SELECT 1 FROM indicadores WHERE codigo = $1::varchar)`, [b.codigo]);
  return NextResponse.json({ ok: true });
}
