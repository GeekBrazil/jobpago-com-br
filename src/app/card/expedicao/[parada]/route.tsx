import { NextRequest } from "next/server";
import rota from "@/data/expedicao-rota.json";
import { card, formatoDe } from "@/lib/cards";

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/* Card do diário da expedição: parada N (1 a 15) do roteiro Paraty → Fortaleza. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ parada: string }> }) {
  const { parada } = await params;
  const n = Number(parada);
  const p = rota.paradas[n - 1];
  if (!Number.isInteger(n) || !p) return new Response("parada inválida", { status: 404 });
  const km = rota.legs.slice(0, n - 1).reduce((a, l) => a + l.km, 0);
  const proxima = rota.paradas[n];
  return card(formatoDe(req.nextUrl.searchParams.get("formato")), {
    selo: "Expedição nº 01",
    titulo: `Parada ${String(n).padStart(2, "0")} · ${p.nome}`,
    destaque: `${nf.format(km)} km`,
    subtitulo: `de ${nf.format(rota.km_total)} · Paraty → Fortaleza, pelo litoral`,
    linhas: proxima ? [`Próxima: ${proxima.nome} · ${nf.format(rota.legs[n - 1].km)} km`] : ["Chegada em Fortaleza"],
    rodape: "jobpago.com.br/expedicao · travessia de reconhecimento",
  });
}
