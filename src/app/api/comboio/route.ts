import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado, perfilViajante } from "@/lib/viajante";
import { garantirTabelasIndicacao, NIVEL_COMBOIO } from "@/lib/indicacao";

export const runtime = "nodejs";

/* Vaga no Comboio da Expedição: gratuita, liberada no nível 100. */

export async function GET() {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ erro: "login" }, { status: 401 });
  const pool = (await garantirTabelasIndicacao())!;
  const { rows } = await pool.query(`SELECT status, trecho, como FROM comboio WHERE usuario_id = $1`, [u.id]);
  return NextResponse.json({ inscrito: rows[0] ?? null });
}

export async function POST(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!u.maior18) return NextResponse.json({ ok: false, erro: "maior18" }, { status: 403 }); // Termos, seção 7
  const p = await perfilViajante(u.id);
  if (p.nivel < NIVEL_COMBOIO) return NextResponse.json({ erro: `A vaga no comboio libera no nível ${NIVEL_COMBOIO}.` }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const pool = (await garantirTabelasIndicacao())!;
  await pool.query(`INSERT INTO comboio (usuario_id, nivel_na_inscricao, trecho, como) VALUES ($1, $2, $3, $4)
    ON CONFLICT (usuario_id) DO UPDATE SET trecho = EXCLUDED.trecho, como = EXCLUDED.como`,
    [u.id, p.nivel, typeof b.trecho === "string" ? b.trecho.slice(0, 120) : null, typeof b.como === "string" ? b.como.slice(0, 40) : null]);
  return NextResponse.json({ ok: true });
}
