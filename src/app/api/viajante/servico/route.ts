import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado } from "@/lib/viajante";
import { getPool } from "@/lib/db";
import { CATEGORIAS } from "@/data/categorias";

export const runtime = "nodejs";

const CATS = new Set(CATEGORIAS.map((c) => c.id));
const MODOS = new Set(["remoto", "presencial", "ambos"]);
const QUANDO = new Set(["agora", "meio-periodo", "fins-de-semana", "integral"]);

export async function PUT(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = parseInt(b.id, 10);
  if (!id || isNaN(id)) {
    return NextResponse.json({ ok: false, erro: "ID do serviço inválido." }, { status: 400 });
  }

  const faz = typeof b.faz === "string" ? b.faz.trim().slice(0, 1200) : "";
  if (!faz) {
    return NextResponse.json({ ok: false, erro: "Descreva o que você sabe fazer." }, { status: 400 });
  }

  const categorias = (Array.isArray(b.categorias) ? b.categorias : [])
    .map(String)
    .filter((c: string) => CATS.has(c))
    .slice(0, 7);

  if (!categorias.length) {
    return NextResponse.json({ ok: false, erro: "Selecione ao menos uma categoria." }, { status: 400 });
  }

  const modo = MODOS.has(b.modo) ? b.modo : "ambos";
  const quando = QUANDO.has(b.quando) ? b.quando : "agora";

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, erro: "Banco de dados indisponível." }, { status: 503 });

  const telDigitos = (u.telefone || "").replace(/\D/g, "");

  // Atualiza garantindo que o registro pertença ao usuário logado
  const { rows } = await pool.query(
    `UPDATE disponibilidades
     SET faz = $1, categorias = $2, modo = $3, quando = $4
     WHERE id = $5
       AND (
         lower(email) = lower($6)
         OR ($6 <> '' AND lower(email) LIKE '%' || split_part(lower($6), '@', 1) || '%')
         OR ($7 <> '' AND replace(replace(replace(whatsapp, '-', ''), ' ', ''), '+', '') LIKE '%' || $7 || '%')
       )
     RETURNING id, faz, categorias, modo, quando, status, to_char(criado_em, 'DD/MM/YYYY') AS quando_cadastrado`,
    [faz, categorias, modo, quando, id, u.email, telDigitos]
  );

  if (!rows.length) {
    return NextResponse.json({ ok: false, erro: "Serviço não encontrado ou você não tem permissão para editá-lo." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, servico: rows[0] });
}

