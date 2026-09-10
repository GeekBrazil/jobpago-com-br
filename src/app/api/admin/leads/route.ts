import { NextResponse } from "next/server";
import { autorizadoAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET(req: Request) {
  if (!autorizadoAdmin(req)) {
    return NextResponse.json({ erro: "nao-autorizado" }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ erro: "sem-banco" }, { status: 503 });
  }

  const { rows } = await pool.query(
    `SELECT id, tipo, nome_contratado AS "nomeContratado", whatsapp_contratado AS "whatsappContratado",
            email_contratado AS "emailContratado", nome_contratante AS "nomeOuPerfilContratante",
            email_contratante AS "emailContratante", whatsapp_contratante AS "whatsappContratante",
            titulo_servico AS "tituloServico", categoria, modalidade, cidade, valor,
            is_cortesia AS "isCortesia", descricao, status, criado_em AS "createdAt"
       FROM leads ORDER BY criado_em DESC LIMIT 500`
  );

  return NextResponse.json({ ok: true, count: rows.length, leads: rows });
}
