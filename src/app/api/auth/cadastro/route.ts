import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

async function ensureUsuariosTable() {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      telefone VARCHAR(20),
      senha_hash TEXT,
      provider VARCHAR(20) NOT NULL DEFAULT 'credentials',
      criado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }

  const nome = String(body.nome ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);
  const telefone = String(body.telefone ?? "").replace(/\D/g, "").slice(0, 15);
  const senha = String(body.senha ?? "");

  if (nome.length < 2) return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  if (telefone.length < 10 || telefone.length > 11) return NextResponse.json({ error: "Telefone inválido. Informe DDD + número." }, { status: 400 });
  if (senha.length < 8) return NextResponse.json({ error: "Senha precisa ter no mínimo 8 caracteres." }, { status: 400 });

  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "Cadastro indisponível no momento." }, { status: 503 });

  await ensureUsuariosTable();

  const { rows: existentes } = await pool.query(`SELECT id FROM usuarios WHERE email = $1`, [email]);
  if (existentes.length > 0) {
    return NextResponse.json({ error: "Já existe conta com esse e-mail. Faça login." }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, 12);
  await pool.query(
    `INSERT INTO usuarios (nome, email, telefone, senha_hash, provider) VALUES ($1, $2, $3, $4, 'credentials')`,
    [nome, email, telefone, senhaHash],
  );

  return NextResponse.json({ ok: true });
}
