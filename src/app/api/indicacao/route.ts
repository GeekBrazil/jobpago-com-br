import { NextRequest, NextResponse } from "next/server";
import { usuarioLogado } from "@/lib/viajante";
import { garantirTabelasIndicacao, novoCodigo, REGRAS } from "@/lib/indicacao";

export const runtime = "nodejs";

/* Painel de indicação do viajante logado: código, link, forma de receber,
   cliques, comerciantes indicados e comissões. */
export async function GET() {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ erro: "login" }, { status: 401 });
  const pool = (await garantirTabelasIndicacao())!;
  const { rows } = await pool.query(`SELECT codigo, pagamento_tipo, pagamento_chave, pais, aceitou_regras FROM indicadores WHERE usuario_id = $1`, [u.id]);
  const ind = rows[0];
  if (!ind) return NextResponse.json({ codigo: null, regras: REGRAS });
  const [cliques, indicados, comissoes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int n FROM indicacao_cliques WHERE codigo = $1`, [ind.codigo]),
    pool.query(`SELECT nome, cidade, uf, status, to_char(criado_em, 'DD/MM/YYYY') quando FROM refugios WHERE indicador_codigo = $1 ORDER BY criado_em DESC LIMIT 50`, [ind.codigo]).catch(() => ({ rows: [] })),
    pool.query(`SELECT comerciante, plano, modalidade, valor_comissao, status, to_char(libera_em, 'DD/MM/YYYY') libera_em, to_char(paga_em, 'DD/MM/YYYY') paga_em
                FROM comissoes WHERE codigo = $1 ORDER BY criado_em DESC`, [ind.codigo]),
  ]);
  const soma = (st: string[]) => comissoes.rows.filter((c) => st.includes(c.status)).reduce((a, c) => a + Number(c.valor_comissao), 0);
  return NextResponse.json({
    codigo: ind.codigo, link: `https://jobpago.com.br/i/${ind.codigo}`,
    pagamento_tipo: ind.pagamento_tipo, pagamento_chave: ind.pagamento_chave, pais: ind.pais,
    cliques: cliques.rows[0].n, indicados: indicados.rows, comissoes: comissoes.rows,
    totais: { aguardando: soma(["aguardando"]), liberada: soma(["liberada"]), paga: soma(["paga"]) }, regras: REGRAS,
  });
}

export async function POST(req: NextRequest) {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ erro: "login" }, { status: 401 });
  if (!u.maior18) return NextResponse.json({ ok: false, erro: "maior18" }, { status: 403 }); // Termos, seção 7
  const b = await req.json().catch(() => ({}));
  const pool = (await garantirTabelasIndicacao())!;
  if (b.acao === "criar") {
    if (b.aceito !== true) return NextResponse.json({ erro: "É preciso aceitar as regras." }, { status: 400 });
    for (let i = 0; i < 5; i++) {
      const r = await pool.query(`INSERT INTO indicadores (usuario_id, codigo, aceitou_regras) VALUES ($1, $2, true)
        ON CONFLICT DO NOTHING RETURNING codigo`, [u.id, novoCodigo()]);
      if (r.rowCount) return NextResponse.json({ ok: true, codigo: r.rows[0].codigo });
      const ja = await pool.query(`SELECT codigo FROM indicadores WHERE usuario_id = $1`, [u.id]);
      if (ja.rowCount) return NextResponse.json({ ok: true, codigo: ja.rows[0].codigo });
    }
    return NextResponse.json({ erro: "tente de novo" }, { status: 500 });
  }
  if (b.acao === "pagamento") {
    const tipo = ["pix", "wise", "paypal"].includes(b.tipo) ? b.tipo : null;
    const chave = typeof b.chave === "string" ? b.chave.trim().slice(0, 200) : "";
    if (!tipo || !chave) return NextResponse.json({ erro: "Escolha a forma e informe a chave ou o e-mail." }, { status: 400 });
    await pool.query(`UPDATE indicadores SET pagamento_tipo = $1, pagamento_chave = $2, pais = $3, atualizado_em = now() WHERE usuario_id = $4`,
      [tipo, chave, typeof b.pais === "string" ? b.pais.slice(0, 60) : null, u.id]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ erro: "ação inválida" }, { status: 400 });
}
