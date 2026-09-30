import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado, garantirTabelasViajante } from "@/lib/viajante";
import { declarouMaioridade } from "@/lib/maioridade";

export const runtime = "nodejs";

/* Conta criada antes da regra de 18+ (ou pelo Google) declara aqui, uma vez. */
export async function POST(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ ok: false, erro: "login" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!declarouMaioridade(b)) return NextResponse.json({ ok: false, erro: "maior18" }, { status: 400 });
  const pool = await garantirTabelasViajante();
  if (!pool) return NextResponse.json({ ok: false }, { status: 503 });
  await pool.query(`UPDATE usuarios SET maior_18_em = COALESCE(maior_18_em, now()) WHERE id = $1`, [u.id]);
  return NextResponse.json({ ok: true });
}
