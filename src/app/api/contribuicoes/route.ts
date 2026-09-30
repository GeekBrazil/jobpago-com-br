import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado, garantirTabelasViajante } from "@/lib/viajante";
import { PONTOS, type TipoContribuicao } from "@/lib/reputacao";
import { QUESTIONARIO, idiomaValido } from "@/lib/textosEstrada";

export const runtime = "nodejs";

/* Contribuição do viajante logado. Tudo entra "pendente" e só pontua quando o
   Allan confirma na Central — exceto o questionário, que conta na hora e uma
   vez só. Foto de fachada: o navegador sobe a foto em allancandido.com/api/
   pontos-fotograficos (com a localização do celular) e manda aqui o id/url. */

const TIPOS = new Set<string>(["fachada", "dormi_aqui", "internet", "combustivel", "estrada", "indicar_lugar", "questionario"]);
const COM_LOCAL = new Set<string>(["fachada", "dormi_aqui", "internet", "combustivel", "estrada"]);

const hits = new Map<string, { n: number; t: number }>();
function limitado(chave: string) {
  const agora = Date.now();
  const h = hits.get(chave);
  if (!h || agora - h.t > 60 * 60_000) { hits.set(chave, { n: 1, t: agora }); return false; }
  h.n += 1;
  return h.n > 30; // 30 contribuições por hora por pessoa
}

/* Só guarda campos simples (texto curto, número, lista de textos) — nada de HTML. */
function limpa(dados: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!dados || typeof dados !== "object") return out;
  for (const [k, v] of Object.entries(dados as Record<string, unknown>).slice(0, 40)) {
    if (!/^[a-z_]{1,30}$/.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 800);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === "string").map((x) => (x as string).slice(0, 60)).slice(0, 20);
  }
  return out;
}

export async function POST(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ ok: false, erro: "login" }, { status: 401 });
  if (!u.maior18) return NextResponse.json({ ok: false, erro: "maior18" }, { status: 403 }); // Termos, seção 7
  if (limitado(String(u.id))) return NextResponse.json({ ok: false, erro: "Muitas contribuições nesta hora. Tente mais tarde." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const tipo = String(b.tipo || "") as TipoContribuicao;
  if (!TIPOS.has(tipo)) return NextResponse.json({ ok: false, erro: "tipo inválido" }, { status: 400 });
  const lat = Number(b.lat), lng = Number(b.lng);
  const temLocal = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
  if (COM_LOCAL.has(tipo) && !temLocal) return NextResponse.json({ ok: false, erro: "Sem a localização não dá para confirmar o lugar." }, { status: 400 });
  if (tipo === "fachada" && !(typeof b.fotoUrl === "string" && b.fotoUrl.startsWith("https://res.cloudinary.com/"))) {
    return NextResponse.json({ ok: false, erro: "Falta a foto." }, { status: 400 });
  }
  const dados = limpa(b.dados);
  if (tipo === "questionario") {
    const validas = new Set(QUESTIONARIO.map((q) => q.id));
    for (const k of Object.keys(dados)) if (!validas.has(k)) delete dados[k];
    if (Object.keys(dados).length < 5) return NextResponse.json({ ok: false, erro: "Responda pelo menos 5 perguntas." }, { status: 400 });
  }
  const pool = await garantirTabelasViajante();
  if (!pool) return NextResponse.json({ ok: false, erro: "indisponível" }, { status: 503 });
  const auto = tipo === "questionario";
  try {
    await pool.query(
      `INSERT INTO contribuicoes (usuario_id, tipo, dados, lat, lng, precisao_m, foto_url, foto_ponto_id, cidade, uf, idioma, status, pontos, revisado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [u.id, tipo, dados, temLocal ? lat : null, temLocal ? lng : null, Number.isFinite(Number(b.precisao)) ? Math.round(Number(b.precisao)) : null,
       tipo === "fachada" || (typeof b.fotoUrl === "string" && b.fotoUrl.startsWith("https://res.cloudinary.com/")) ? b.fotoUrl : null,
       Number.isInteger(b.fotoPontoId) ? b.fotoPontoId : null,
       typeof b.cidade === "string" ? b.cidade.slice(0, 80) : null, typeof b.uf === "string" ? b.uf.slice(0, 2).toUpperCase() : null,
       idiomaValido(b.idioma), auto ? "confirmada" : "pendente", auto ? PONTOS.questionario : 0, auto ? new Date() : null]
    );
  } catch (e) {
    if (String(e).includes("contribuicoes_questionario")) return NextResponse.json({ ok: false, erro: "Questionário já respondido." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true, pontos: auto ? PONTOS.questionario : 0, pendente: !auto });
}
