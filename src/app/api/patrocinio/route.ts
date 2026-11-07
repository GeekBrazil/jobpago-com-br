import { NextRequest, NextResponse } from "next/server";
import { garantirTabelasExpedicoes } from "@/lib/expedicoes";
import { msg } from "@/lib/traducoesCadastro";
import { verificarDominioMxServidor } from "@/lib/validacaoEmailServidor";
import { enviarEmail, molduraJobPago } from "@/lib/email";

export const runtime = "nodejs";

/* Proposta de patrocínio vinda da página pública da expedição. Vira "proposta"
   na Central; o Allan negocia, recebe e repassa 85% ao viajante. */
const hits = new Map<string, { n: number; t: number }>();
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const agora = Date.now();
  const h = hits.get(ip);
  if (!h || agora - h.t > 60 * 60_000) hits.set(ip, { n: 1, t: agora });
  else if (++h.n > 5) return NextResponse.json({ ok: false, erro: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const m = (pt: string, es: string, en: string) => msg(b.idioma, pt, es, en);
  const txt = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const slug = txt(b.slug, 60), patrocinador = txt(b.patrocinador, 160), contato = txt(b.contato, 160);
  const emailBruto = txt(b.email, 200);
  if (!emailBruto) {
    return NextResponse.json({ ok: false, erro: m("E-mail é obrigatório.", "El e-mail es obligatorio.", "E-mail is required.") }, { status: 400 });
  }
  const checagem = await verificarDominioMxServidor(emailBruto, b.idioma);
  if (!checagem.valido) return NextResponse.json({ ok: false, erro: checagem.erro || m("E-mail inválido.", "E-mail inválido.", "Invalid e-mail.") }, { status: 400 });
  const emailFinal = checagem.emailLimpo;

  if (!patrocinador || !contato) return NextResponse.json({ ok: false, erro: m("Informe a empresa e um contato.", "Indicá la empresa y un contacto.", "Enter the company and a contact.") }, { status: 400 });
  if (b.lgpd !== true) return NextResponse.json({ ok: false, erro: m("É preciso autorizar o contato.", "Tenés que autorizar el contacto.", "Please authorise us to contact you.") }, { status: 400 });
  const pool = await garantirTabelasExpedicoes();
  if (!pool) return NextResponse.json({ ok: false, erro: "indisponível" }, { status: 503 });
  const { rows } = await pool.query(`SELECT id, nome FROM expedicoes WHERE slug = $1 AND status = 'publicada'`, [slug]);
  if (!rows[0]) return NextResponse.json({ ok: false, erro: m("Expedição não encontrada.", "Expedición no encontrada.", "Expedition not found.") }, { status: 404 });
  const valor = Number(String(b.valor ?? "").replace(/\./g, "").replace(",", "."));
  await pool.query(`INSERT INTO patrocinios (expedicao_id, patrocinador, contato, email, proposta, valor) VALUES ($1,$2,$3,$4,$5,$6)`,
    [rows[0].id, patrocinador, contato, emailFinal, txt(b.proposta, 1500) || null, Number.isFinite(valor) && valor > 0 ? valor : null]);

  const nomeExpedicao = rows[0].nome || "Expedição";
  const assunto = `Proposta de patrocínio recebida: ${nomeExpedicao}`;
  const corpoHtml = `
    <p style="margin:0 0 16px 0">Olá, <strong>${patrocinador}</strong>.</p>
    <p style="margin:0 0 16px 0">Recebemos sua proposta de patrocínio para a <strong>${nomeExpedicao}</strong> na JobPago.</p>
    <p style="margin:0 0 16px 0">Nossa equipe entrará em contato pelo contato informado (${contato}) para alinhar os detalhes da cota e formato de menção.</p>
    <p style="margin:24px 0 0 0;color:#94a3b8">Atenciosamente,<br><strong style="color:#f8fafc">Allan Candido</strong><br>JobPago</p>
  `;
  enviarEmail(emailFinal, assunto, molduraJobPago(assunto, corpoHtml)).catch(() => {});

  return NextResponse.json({ ok: true });
}
