import { NextRequest } from "next/server";
import { relatorioCidade, nomeSetor } from "@/lib/relatorioCidade";
import { card, formatoDe } from "@/lib/cards";

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* Card da cidade: negócios abertos em 90 dias + setores + salário de entrada. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ ibge: string }> }) {
  const { ibge } = await params;
  const r = await relatorioCidade(ibge);
  if (!r) return new Response("cidade não encontrada", { status: 404 });
  const linhas = r.categorias.filter((c) => (c.novas_90d ?? 0) > 0).slice(0, 4).map((c) => `${nomeSetor(c.categoria)}: ${nf.format(c.novas_90d ?? 0)} novos`);
  if (r.emprego?.salario_medio_adm) linhas.push(`Salário de entrada: ${brl.format(r.emprego.salario_medio_adm)}`);
  return card(formatoDe(req.nextUrl.searchParams.get("formato")), {
    selo: "Relatório da cidade",
    titulo: `${r.municipio.municipio_nome} · ${r.municipio.uf}`,
    destaque: r.negocios_total?.novas_90d != null ? nf.format(r.negocios_total.novas_90d) : undefined,
    subtitulo: "negócios abertos nos últimos 90 dias",
    linhas,
    rodape: `jobpago.com.br/cidade/${ibge} · Receita Federal e CAGED`,
  });
}
