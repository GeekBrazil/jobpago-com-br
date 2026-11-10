import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { OFERECE, TIPOS_REFUGIO, NIVEIS_HONRA } from "@/data/honra";
import { codigoValido } from "@/lib/indicacao";
import { msg } from "@/lib/traducoesCadastro";
import { normalizarTelefone } from "@/lib/telefone";
import { verificarDominioMxServidor } from "@/lib/validacaoEmailServidor";
import { enviarEmailConfirmacaoRefugio } from "@/lib/email";
import { notificarAdminNovoCadastro } from "@/lib/notificacaoAdmin";

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
    id SERIAL PRIMARY KEY, nome VARCHAR(120) NOT NULL, tipo VARCHAR(30) NOT NULL, cidade VARCHAR(80) NOT NULL, uf CHAR(2) NOT NULL,
    responsavel VARCHAR(80), whatsapp VARCHAR(20) NOT NULL, email VARCHAR(200), site VARCHAR(200), sites_links TEXT[] DEFAULT '{}',
    oferece TEXT[] DEFAULT '{}', preco_noite VARCHAR(40), honra_desejada VARCHAR(20), mensagem TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'candidato', honra VARCHAR(20), verificado_em DATE, notas TEXT,
    lgpd_consent BOOLEAN NOT NULL, indicador_codigo VARCHAR(12), criado_em TIMESTAMPTZ DEFAULT now(), atualizado_em TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`ALTER TABLE refugios ADD COLUMN IF NOT EXISTS indicador_codigo VARCHAR(12)`);
  await pool.query(`ALTER TABLE refugios ADD COLUMN IF NOT EXISTS sites_links TEXT[] DEFAULT '{}'`);
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
  const whatsapp = normalizarTelefone(txt(b.whatsapp, 24));
  const emailBruto = txt(b.email, 200);
  if (!emailBruto) {
    return NextResponse.json({ ok: false, erro: m("E-mail é obrigatório.", "El e-mail es obligatorio.", "E-mail is required.") }, { status: 400 });
  }
  const checagem = await verificarDominioMxServidor(emailBruto, b.idioma);
  if (!checagem.valido) return NextResponse.json({ ok: false, erro: checagem.erro || m("E-mail inválido.", "E-mail inválido.", "Invalid e-mail.") }, { status: 400 });
  const emailFinal = checagem.emailLimpo;
  if (!nome) return NextResponse.json({ ok: false, erro: m("Diga o nome do lugar.", "Decí el nombre del lugar.", "Enter the name of the place.") }, { status: 400 });
  if (!TIPOS.has(b.tipo)) return NextResponse.json({ ok: false, erro: m("Escolha o tipo de lugar.", "Elegí el tipo de lugar.", "Choose the type of place.") }, { status: 400 });
  if (!cidade || uf.length !== 2) return NextResponse.json({ ok: false, erro: m("Informe cidade e UF.", "Indicá ciudad y estado.", "Enter town and state.") }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ ok: false, erro: m("WhatsApp com DDD, por favor.", "WhatsApp con código de país y de área, por favor.", "WhatsApp with country and area code, please.") }, { status: 400 });
  if (b.lgpd !== true) return NextResponse.json({ ok: false, erro: m("É preciso autorizar o contato (LGPD).", "Tenés que autorizar el contacto (LGPD).", "Please authorise us to contact you (LGPD).") }, { status: 400 });
  const oferece = (Array.isArray(b.oferece) ? b.oferece : []).map(String).filter((o: string) => OFER.has(o));
  const pool = await tabela();
  if (!pool) return NextResponse.json({ ok: false, erro: m("Cadastro indisponível agora. Tente mais tarde.", "Registro no disponible agora. Probá más tarde.", "Sign-up unavailable right now. Try later.") }, { status: 503 });
  // indicação: só guarda código que existe (a comissão depende dele)
  let indicador: string | null = null;
  if (codigoValido(b.indicador)) {
    const r = await pool.query(`SELECT 1 FROM indicadores WHERE codigo = $1`, [b.indicador]).catch(() => ({ rowCount: 0 }));
    if (r.rowCount) indicador = b.indicador;
  }
  const sitesLinks = (Array.isArray(b.sitesLinks) ? b.sitesLinks : [])
    .map((s: unknown) => txt(s, 200))
    .filter(Boolean)
    .slice(0, 9);
  const sitePrincipal = txt(b.site, 200) || sitesLinks[0] || null;
  await pool.query(
    `INSERT INTO refugios (nome, tipo, cidade, uf, responsavel, whatsapp, email, site, sites_links, oferece, preco_noite, honra_desejada, mensagem, lgpd_consent, indicador_codigo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,$14)`,
    [nome, b.tipo, cidade, uf, txt(b.responsavel, 80) || null, whatsapp, emailFinal, sitePrincipal, sitesLinks, oferece,
     txt(b.precoNoite, 40) || null, HONRAS.has(b.honra) ? b.honra : null, txt(b.mensagem, 600) || null, indicador]
  );

  if (emailFinal) {
    enviarEmailConfirmacaoRefugio({
      nomeLugar: nome,
      responsavel: txt(b.responsavel, 80) || undefined,
      email: emailFinal,
      cidade,
      uf,
    }).catch((err) => console.error("[api/refugios] Erro ao enviar confirmação de refúgio:", err));
  }

  // Notifica o Allan no Telegram e E-mail com o nome do formulário
  notificarAdminNovoCadastro({
    formulario: "Pedido de Visita (Estabelecimento / Refúgio)",
    nome: `${nome}${txt(b.responsavel, 80) ? ` (Resp: ${txt(b.responsavel, 80)})` : ""}`,
    whatsapp,
    email: emailFinal,
    cidade,
    uf,
    tipo: b.tipo,
    detalhes: `Preço/Noite: ${txt(b.precoNoite, 40) || "N/A"} | Honra: ${b.honra || "N/A"} | Oferece: ${oferece.join(", ")} | Msg: ${txt(b.mensagem, 300) || "Sem mensagem"}`,
  }).catch((err) => console.error("[api/refugios] Erro ao notificar admin:", err));

  return NextResponse.json({ ok: true });
}
