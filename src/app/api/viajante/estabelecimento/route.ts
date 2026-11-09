import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado } from "@/lib/viajante";
import { getPool } from "@/lib/db";
import { TIPOS_REFUGIO, OFERECE } from "@/data/honra";
import { normalizarTelefone } from "@/lib/telefone";

export const runtime = "nodejs";

const TIPOS_VALIDOS = new Set(TIPOS_REFUGIO.map(([id]) => id));
const OFERECE_VALIDOS = new Set(OFERECE.map(([id]) => id));

export async function PUT(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = parseInt(b.id, 10);
  if (!id || isNaN(id)) {
    return NextResponse.json({ ok: false, erro: "ID do estabelecimento inválido." }, { status: 400 });
  }

  const txt = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const nome = txt(b.nome, 120);
  if (!nome) return NextResponse.json({ ok: false, erro: "Nome do estabelecimento é obrigatório." }, { status: 400 });

  const tipo = TIPOS_VALIDOS.has(b.tipo) ? b.tipo : "pousada";
  const cidade = txt(b.cidade, 80);
  const uf = txt(b.uf, 2).toUpperCase();
  if (!cidade || !uf) return NextResponse.json({ ok: false, erro: "Cidade e UF são obrigatórios." }, { status: 400 });

  const responsavel = txt(b.responsavel, 80) || null;
  const whatsapp = normalizarTelefone(txt(b.whatsapp, 24));
  if (!whatsapp) return NextResponse.json({ ok: false, erro: "WhatsApp válido é obrigatório." }, { status: 400 });

  const site = txt(b.site, 200) || null;
  const precoNoite = txt(b.preco_noite, 40) || null;
  const mensagem = txt(b.mensagem, 1000) || null;

  const oferece = (Array.isArray(b.oferece) ? b.oferece : [])
    .map(String)
    .filter((o: string) => OFERECE_VALIDOS.has(o as any));

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, erro: "Banco de dados indisponível." }, { status: 503 });

  const telDigitos = (u.telefone || "").replace(/\D/g, "");

  // Atualiza garantindo que o estabelecimento pertença ao usuário logado
  const { rows } = await pool.query(
    `UPDATE refugios
     SET nome = $1, tipo = $2, cidade = $3, uf = $4, responsavel = $5,
         whatsapp = $6, site = $7, oferece = $8, preco_noite = $9, mensagem = $10,
         atualizado_em = now()
     WHERE id = $11
       AND (
         lower(email) = lower($12)
         OR ($12 <> '' AND lower(email) LIKE '%' || split_part(lower($12), '@', 1) || '%')
         OR ($13 <> '' AND replace(replace(replace(whatsapp, '-', ''), ' ', ''), '+', '') LIKE '%' || $13 || '%')
       )
     RETURNING id, nome, tipo, cidade, uf, responsavel, whatsapp, site, oferece, preco_noite, mensagem, status, to_char(criado_em, 'DD/MM/YYYY') AS quando_cadastrado`,
    [nome, tipo, cidade, uf, responsavel, whatsapp, site, oferece, precoNoite, mensagem, id, u.email, telDigitos]
  );

  if (!rows.length) {
    return NextResponse.json({ ok: false, erro: "Estabelecimento não encontrado ou você não tem permissão para editá-lo." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, estabelecimento: rows[0] });
}

