import { NextRequest } from "next/server";
import { garantirTabelasExpedicoes, nomeModo } from "@/lib/expedicoes";
import { card, formatoDe } from "@/lib/cards";

/* Card da expedição de um viajante (só publicadas). Mostra plano e modo — nunca posição atual. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pool = await garantirTabelasExpedicoes();
  if (!pool) return new Response("indisponível", { status: 503 });
  const { rows } = await pool.query(`SELECT e.nome, e.origem, e.destino, e.modo, e.veiculo, split_part(u.nome, ' ', 1) viajante,
    (SELECT COUNT(*) FROM expedicao_diario d WHERE d.expedicao_id = e.id AND d.criado_em < now() - interval '24 hours')::int registros
    FROM expedicoes e JOIN usuarios u ON u.id = e.usuario_id WHERE e.slug = $1 AND e.status = 'publicada'`, [slug]);
  const e = rows[0];
  if (!e) return new Response("não encontrada", { status: 404 });
  return card(formatoDe(req.nextUrl.searchParams.get("formato")), {
    selo: "Expedição",
    titulo: e.nome,
    subtitulo: `${e.origem} → ${e.destino}`,
    linhas: [`${nomeModo(e.modo)}${e.veiculo ? ` · ${e.veiculo}` : ""}`, `por ${e.viajante}`, e.registros ? `${e.registros} registros no diário` : ""].filter(Boolean),
    rodape: `jobpago.com.br/expedicoes/${slug} · patrocine: 85% vão para o viajante`,
  });
}
