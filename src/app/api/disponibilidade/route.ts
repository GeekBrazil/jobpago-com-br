import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { CATEGORIAS } from "@/data/categorias";
import { msg } from "@/lib/traducoesCadastro";
import { normalizarTelefone } from "@/lib/telefone";

export const runtime = "nodejs";

/* Cadastro de disponibilidade de quem busca renda (substitui a vitrine de
   vagas). Fica no banco `jobpago`; o Allan chama quando um negócio da região
   (ou remoto) publica uma tarefa que combina. Não é exibido publicamente. */

const CATS = new Set(CATEGORIAS.map((c) => c.id));
const MODOS = new Set(["remoto", "presencial", "ambos"]);
const QUANDO = new Set(["agora", "meio-periodo", "fins-de-semana", "integral"]);

let tabelaPronta = false;
async function garantirTabela() {
  const pool = getPool();
  if (!pool || tabelaPronta) return pool;
  await pool.query(`CREATE TABLE IF NOT EXISTS disponibilidades (
    id SERIAL PRIMARY KEY, nome VARCHAR(80) NOT NULL, whatsapp VARCHAR(20) NOT NULL, email VARCHAR(200),
    cidade VARCHAR(80), uf CHAR(2), na_estrada BOOLEAN DEFAULT FALSE, categorias TEXT[] NOT NULL,
    faz TEXT, modo VARCHAR(12), quando VARCHAR(20), lgpd_consent BOOLEAN NOT NULL,
    status VARCHAR(20) DEFAULT 'nova', criado_em TIMESTAMPTZ DEFAULT now())`);
  tabelaPronta = true;
  return pool;
}

const hits = new Map<string, { n: number; t: number }>();
function limitado(ip: string) {
  const agora = Date.now();
  const h = hits.get(ip);
  if (!h || agora - h.t > 10 * 60_000) { hits.set(ip, { n: 1, t: agora }); return false; }
  h.n += 1;
  return h.n > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (limitado(ip)) return NextResponse.json({ ok: false, erro: "Muitas tentativas. Tente em alguns minutos." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const m = (pt: string, es: string, en: string) => msg(b.idioma, pt, es, en);
  const txt = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const nome = txt(b.nome, 80);
  const whatsapp = normalizarTelefone(txt(b.whatsapp, 24));
  const email = txt(b.email, 200);
  const categorias = (Array.isArray(b.categorias) ? b.categorias : []).map(String).filter((c: string) => CATS.has(c)).slice(0, 7);
  if (!nome) return NextResponse.json({ ok: false, erro: m("Diga seu nome.", "Decí tu nombre.", "Enter your name.") }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ ok: false, erro: m("WhatsApp com DDD, por favor.", "WhatsApp con código de país y de área, por favor.", "WhatsApp with country and area code, please.") }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, erro: m("E-mail inválido.", "E-mail inválido.", "Invalid e-mail.") }, { status: 400 });
  if (!categorias.length) return NextResponse.json({ ok: false, erro: m("Escolha pelo menos uma área.", "Elegí al menos un área.", "Choose at least one area.") }, { status: 400 });
  if (b.lgpd !== true) return NextResponse.json({ ok: false, erro: m("É preciso autorizar o contato (LGPD).", "Tenés que autorizar el contacto (LGPD).", "Please authorise us to contact you (LGPD).") }, { status: 400 });

  const pool = await garantirTabela();
  if (!pool) return NextResponse.json({ ok: false, erro: m("Cadastro indisponível agora. Tente mais tarde.", "Registro no disponible ahora. Probá más tarde.", "Sign-up unavailable right now. Try later.") }, { status: 503 });
  await pool.query(
    `INSERT INTO disponibilidades (nome, whatsapp, email, cidade, uf, na_estrada, categorias, faz, modo, quando, lgpd_consent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
    [nome, whatsapp, email || null, txt(b.cidade, 80) || null, txt(b.uf, 2).toUpperCase() || null, b.naEstrada === true,
     categorias, txt(b.faz, 500) || null, MODOS.has(b.modo) ? b.modo : null, QUANDO.has(b.quando) ? b.quando : null]
  );
  return NextResponse.json({ ok: true });
}
