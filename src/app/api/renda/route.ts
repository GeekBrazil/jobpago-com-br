import { NextRequest, NextResponse } from "next/server";
import { relatorioCidade } from "@/lib/relatorioCidade";

/* Salário de entrada por setor numa cidade (Novo CAGED) — alimenta a pergunta
   "Quanto se ganha de verdade…" da home. Só números agregados e públicos. */
export async function GET(req: NextRequest) {
  const ibge = req.nextUrl.searchParams.get("ibge") || "";
  const r = await relatorioCidade(ibge);
  if (!r || !r.emprego) return NextResponse.json({ erro: "sem dados" }, { status: 404 });
  return NextResponse.json(
    {
      ibge,
      cidade: r.municipio.municipio_nome,
      uf: r.municipio.uf,
      de: r.emprego.de,
      ate: r.emprego.ate,
      media: r.emprego.salario_medio_adm,
      setores: r.emprego.setores
        .filter((s) => s.salario_medio_adm && s.admissoes >= 10)
        .map((s) => ({ secao: s.secao, setor: s.setor, salario: s.salario_medio_adm, admissoes: s.admissoes })),
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
