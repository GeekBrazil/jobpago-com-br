import { msg } from "@/lib/traducoesCadastro";
import { normalizarTelefone } from "@/lib/telefone";
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

  const m = (pt: string, es: string, en: string) => msg(body.idioma, pt, es, en);
  const nome = String(body.nome ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);
  const telefone = normalizarTelefone(String(body.telefone ?? "").slice(0, 24)) ?? "";
  const senha = String(body.senha ?? "");

  if (nome.length < 2) return NextResponse.json({ error: m("Nome inválido.", "Nombre inválido.", "Invalid name.") }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: m("E-mail inválido.", "E-mail inválido.", "Invalid e-mail.") }, { status: 400 });
  // Brasil: DDD + número; estrangeiro: +código do país (lib/telefone)
  if (!telefone) return NextResponse.json({ error: m("Telefone inválido. Informe DDD + número.", "Teléfono inválido. Incluí el código de país.", "Invalid phone. Include the country code.") }, { status: 400 });
  if (senha.length < 8) return NextResponse.json({ error: m("Senha precisa ter no mínimo 8 caracteres.", "La contraseña necesita al menos 8 caracteres.", "Password must be at least 8 characters.") }, { status: 400 });

  const pool = getPool();
  if (!pool) return NextResponse.json({ error: m("Cadastro indisponível no momento.", "Registro no disponible en este momento.", "Sign-up unavailable right now.") }, { status: 503 });

  await ensureUsuariosTable();

  const { rows: existentes } = await pool.query(`SELECT id FROM usuarios WHERE email = $1`, [email]);
  if (existentes.length > 0) {
    return NextResponse.json({ error: m("Já existe conta com esse e-mail. Faça login.", "Ya existe una cuenta con ese e-mail. Iniciá sesión.", "An account with this e-mail already exists. Please log in.") }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, 12);
  await pool.query(
    `INSERT INTO usuarios (nome, email, telefone, senha_hash, provider) VALUES ($1, $2, $3, $4, 'credentials')`,
    [nome, email, telefone, senhaHash],
  );

  return NextResponse.json({ ok: true });
}
