import { NextRequest, NextResponse } from "next/server";
import { buscarMunicipios } from "@/lib/relatorioCidade";

/* Busca de cidade para /cidade — repassa para a API de dados (a chave fica no servidor). */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json([]);
  const r = (await buscarMunicipios(q)) ?? [];
  return NextResponse.json(
    r.map((m) => ({ ibge: String(m.municipio_ibge), nome: m.municipio_nome, uf: m.uf })),
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
