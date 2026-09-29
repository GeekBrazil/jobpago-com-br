import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { OFERECE, TIPOS_REFUGIO, NIVEIS_HONRA } from "@/data/honra";
import { codigoValido } from "@/lib/indicacao";
import { msg } from "@/lib/traducoesCadastro";

export const runtime = "nodejs";

/* Refúgio da Estrada: candidatura do lugar (POST) e lista pública dos verificados (GET).
   A candidatura não aparece no site: vira "candidato" e o Allan decide a visita pela
   Central de Prospecção; só depois da visita o status vira "verificado". */

const TIPOS = new Set<string>(TIPOS_REFUGIO.map(([v]) => v));
const OFER = new Set<string>(OFERECE.map(([v]) => v));
const HONRAS = new Set<string>(NIVEIS_HONRA.map((n) => n.id));

let pronta = false;
async function tabela() {
  const pool = getPool();
  if (!pool || pronta) return pool;
  await pool.query(`CREATE TABLE IF NOT EXISTS refugios (
    id SERIAL PRIMARY KEY, nome VARCHAR(120) NOT NULL, tipo VARCHAR(20) NOT NULL, cidade VARCHAR(80) NOT NULL, uf CHAR(2) NOT NULL,
    responsavel VARCHAR(80), whatsapp VARCHAR(20) NOT NULL, email VARCHAR(200), site VARCHAR(200),
    oferece TEXT[] DEFAULT '{}', preco_noite VARCHAR(40), honra_desejada VARCHAR(20), mensagem TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'candidato', honra VARCHAR(20), verificado_em DATE, notas TEXT,
    lgpd_consent BOOLEAN NOT NULL, indicador_codigo VARCHAR(12), criado_em TIMESTAMPTZ DEFAULT now(), atualizado_em TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`ALTER TABLE refugios ADD COLUMN IF NOT EXISTS indicador_codigo VARCHAR(12)`);
  pronta = true;
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

export async function GET() {
  const pool = await tabela();
  if (!pool) return NextResponse.json({ refugios: [] });
  // ordem: Honra Ouro, Prata, Bronze, depois só verificados; dentro do nível, visita mais recente
  const { rows } = await pool.query(`SELECT id, nome, tipo, cidade, uf, oferece, preco_noite, honra, to_char(verificado_em, 'DD/MM/YYYY') verificado_em
    FROM refugios WHERE status = 'verificado'
    ORDER BY array_position(ARRAY['ouro','prata','bronze','verificado']::text[], COALESCE(honra, 'verificado')), verificado_em DESC NULLS LAST`);
  return NextResponse.json({ refugios: rows }, { headers: { "Cache-Control": "public, max-age=300" } });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (limitado(ip)) return NextResponse.json({ ok: false, erro: "Muitas tentativas. Tente em alguns minutos. / Demasiados intentos. / Too many attempts." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const m = (pt: string, es: string, en: string) => msg(b.idioma, pt, es, en);
  const txt = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const nome = txt(b.nome, 120), cidade = txt(b.cidade, 80), uf = txt(b.uf, 2).toUpperCase();
  const whatsapp = txt(b.whatsapp, 20).replace(/\D/g, "");
  const email = txt(b.email, 200);
  if (!nome) return NextResponse.json({ ok: false, erro: m("Diga o nome do lugar.", "Decí el nombre del lugar.", "Enter the name of the place.") }, { status: 400 });
  if (!TIPOS.has(b.tipo)) return NextResponse.json({ ok: false, erro: m("Escolha o tipo de lugar.", "Elegí el tipo de lugar.", "Choose the type of place.") }, { status: 400 });
  if (!cidade || uf.length !== 2) return NextResponse.json({ ok: false, erro: m("Informe cidade e UF.", "Indicá ciudad y estado.", "Enter town and state.") }, { status: 400 });
  if (whatsapp.length < 10 || whatsapp.length > 13) return NextResponse.json({ ok: false, erro: m("WhatsApp com DDD, por favor.", "WhatsApp con código de área, por favor.", "WhatsApp with area code, please.") }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, erro: m("E-mail inválido.", "E-mail inválido.", "Invalid e-mail.") }, { status: 400 });
  if (b.lgpd !== true) return NextResponse.json({ ok: false, erro: m("É preciso autorizar o contato (LGPD).", "Tenés que autorizar el contacto (LGPD).", "Please authorise us to contact you (LGPD).") }, { status: 400 });
  const oferece = (Array.isArray(b.oferece) ? b.oferece : []).map(String).filter((o: string) => OFER.has(o));
  const pool = await tabela();
  if (!pool) return NextResponse.json({ ok: false, erro: m("Cadastro indisponível agora. Tente mais tarde.", "Registro no disponible ahora. Probá más tarde.", "Sign-up unavailable right now. Try later.") }, { status: 503 });
  // indicação: só guarda código que existe (a comissão depende dele)
  let indicador: string | null = null;
  if (codigoValido(b.indicador)) {
    const r = await pool.query(`SELECT 1 FROM indicadores WHERE codigo = $1`, [b.indicador]).catch(() => ({ rowCount: 0 }));
    if (r.rowCount) indicador = b.indicador;
  }
  await pool.query(
    `INSERT INTO refugios (nome, tipo, cidade, uf, responsavel, whatsapp, email, site, oferece, preco_noite, honra_desejada, mensagem, lgpd_consent, indicador_codigo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13)`,
    [nome, b.tipo, cidade, uf, txt(b.responsavel, 80) || null, whatsapp, email || null, txt(b.site, 200) || null, oferece,
     txt(b.precoNoite, 40) || null, HONRAS.has(b.honra) ? b.honra : null, txt(b.mensagem, 600) || null, indicador]
  );
  return NextResponse.json({ ok: true });
}
