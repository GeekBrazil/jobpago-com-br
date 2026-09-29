import { NextRequest, NextResponse } from "next/server";
import { garantirTabelasExpedicoes } from "@/lib/expedicoes";
import { msg } from "@/lib/traducoesCadastro";

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
  const slug = txt(b.slug, 60), patrocinador = txt(b.patrocinador, 160), contato = txt(b.contato, 160), email = txt(b.email, 200);
  if (!patrocinador || !contato) return NextResponse.json({ ok: false, erro: m("Informe a empresa e um contato.", "Indicá la empresa y un contacto.", "Enter the company and a contact.") }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, erro: m("E-mail inválido.", "E-mail inválido.", "Invalid e-mail.") }, { status: 400 });
  if (b.lgpd !== true) return NextResponse.json({ ok: false, erro: m("É preciso autorizar o contato.", "Tenés que autorizar el contacto.", "Please authorise us to contact you.") }, { status: 400 });
  const pool = await garantirTabelasExpedicoes();
  if (!pool) return NextResponse.json({ ok: false, erro: "indisponível" }, { status: 503 });
  const { rows } = await pool.query(`SELECT id FROM expedicoes WHERE slug = $1 AND status = 'publicada'`, [slug]);
  if (!rows[0]) return NextResponse.json({ ok: false, erro: m("Expedição não encontrada.", "Expedición no encontrada.", "Expedition not found.") }, { status: 404 });
  const valor = Number(String(b.valor ?? "").replace(/\./g, "").replace(",", "."));
  await pool.query(`INSERT INTO patrocinios (expedicao_id, patrocinador, contato, email, proposta, valor) VALUES ($1,$2,$3,$4,$5,$6)`,
    [rows[0].id, patrocinador, contato, email || null, txt(b.proposta, 1500) || null, Number.isFinite(valor) && valor > 0 ? valor : null]);
  return NextResponse.json({ ok: true });
}
