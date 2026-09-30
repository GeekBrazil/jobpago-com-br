import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado } from "@/lib/viajante";
import { garantirTabelasExpedicoes, slugDe, MODOS, REDES, REPASSE } from "@/lib/expedicoes";

export const runtime = "nodejs";

const MODO_OK = new Set(MODOS.map(([m]) => m));
const txt = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/* A expedição do viajante logado: dados, diário e patrocínios (com o repasse de 85%). */
export async function GET() {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ erro: "login" }, { status: 401 });
  const pool = (await garantirTabelasExpedicoes())!;
  const { rows } = await pool.query(`SELECT * FROM expedicoes WHERE usuario_id = $1`, [u.id]);
  const e = rows[0];
  if (!e) return NextResponse.json({ expedicao: null, repasse: REPASSE });
  const [diario, patro] = await Promise.all([
    pool.query(`SELECT id, cidade, uf, texto, link, to_char(criado_em, 'DD/MM HH24:MI') quando,
      criado_em < now() - interval '24 hours' AS publico FROM expedicao_diario WHERE expedicao_id = $1 ORDER BY criado_em DESC`, [e.id]),
    pool.query(`SELECT patrocinador, status, valor, repasse, to_char(pago_em, 'DD/MM/YYYY') pago_em, to_char(repassado_em, 'DD/MM/YYYY') repassado_em
      FROM patrocinios WHERE expedicao_id = $1 AND status <> 'cancelado' ORDER BY criado_em DESC`, [e.id]),
  ]);
  return NextResponse.json({ expedicao: e, diario: diario.rows, patrocinios: patro.rows, repasse: REPASSE });
}

export async function POST(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!u.maior18) return NextResponse.json({ ok: false, erro: "maior18" }, { status: 403 }); // Termos, seção 7
  const b = await req.json().catch(() => ({}));
  const pool = (await garantirTabelasExpedicoes())!;

  if (b.acao === "diario") {
    const { rows } = await pool.query(`SELECT id FROM expedicoes WHERE usuario_id = $1`, [u.id]);
    if (!rows[0]) return NextResponse.json({ erro: "Crie a expedição primeiro." }, { status: 400 });
    const texto = txt(b.texto, 2000);
    if (texto.length < 3) return NextResponse.json({ erro: "Escreva algo." }, { status: 400 });
    const link = txt(b.link, 300);
    await pool.query(`INSERT INTO expedicao_diario (expedicao_id, cidade, uf, texto, link) VALUES ($1,$2,$3,$4,$5)`,
      [rows[0].id, txt(b.cidade, 80) || null, txt(b.uf, 40) || null, texto, /^https:\/\//.test(link) ? link : null]);
    return NextResponse.json({ ok: true });
  }

  // salvar a expedição (criar ou editar) — volta para análise do Allan
  const nome = txt(b.nome, 120), origem = txt(b.origem, 80), destino = txt(b.destino, 80);
  if (!nome || !origem || !destino) return NextResponse.json({ erro: "Nome, origem e destino são obrigatórios." }, { status: 400 });
  if (!MODO_OK.has(b.modo)) return NextResponse.json({ erro: "Escolha como você vai." }, { status: 400 });
  const paradas = (Array.isArray(b.paradas) ? b.paradas : []).map((p: unknown) => txt(p, 80)).filter(Boolean).slice(0, 40);
  const redes = (Array.isArray(b.redes) ? b.redes : [])
    .filter((r: { rede?: string; url?: string }) => REDES.includes(r?.rede as (typeof REDES)[number]) && typeof r.url === "string" && /^https:\/\//.test(r.url))
    .map((r: { rede: string; url: string; seguidores?: unknown }) => ({ rede: r.rede, url: r.url.slice(0, 200), seguidores: Math.max(0, Math.min(1e9, Math.round(Number(r.seguidores) || 0))) }))
    .slice(0, 5);
  const mes = /^\d{4}-\d{2}$/.test(b.mesInicio) ? b.mesInicio : null;
  const pagTipo = ["pix", "wise", "paypal"].includes(b.pagamentoTipo) ? b.pagamentoTipo : null;
  const campos = [nome, txt(b.tema, 1500) || null, origem, destino, paradas, mes, b.modo, txt(b.veiculo, 120) || null, b.sozinho === true,
    b.mostrarRoteiro !== false, JSON.stringify(redes), pagTipo, txt(b.pagamentoChave, 200) || null, ["pt", "es", "en"].includes(b.idioma) ? b.idioma : "pt"];
  const { rows } = await pool.query(`SELECT id FROM expedicoes WHERE usuario_id = $1`, [u.id]);
  if (rows[0]) {
    await pool.query(`UPDATE expedicoes SET nome=$1, tema=$2, origem=$3, destino=$4, paradas=$5, mes_inicio=$6, modo=$7, veiculo=$8, sozinho=$9,
      mostrar_roteiro=$10, redes=$11, pagamento_tipo=$12, pagamento_chave=$13, idioma=$14, status='em_analise', atualizado_em=now() WHERE usuario_id=$15`, [...campos, u.id]);
  } else {
    let slug = slugDe(nome);
    const existe = await pool.query(`SELECT 1 FROM expedicoes WHERE slug = $1`, [slug]);
    if (existe.rowCount) slug = `${slug}-${u.id}`;
    await pool.query(`INSERT INTO expedicoes (nome, tema, origem, destino, paradas, mes_inicio, modo, veiculo, sozinho, mostrar_roteiro, redes, pagamento_tipo, pagamento_chave, idioma, usuario_id, slug)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [...campos, u.id, slug]);
  }
  return NextResponse.json({ ok: true });
}
