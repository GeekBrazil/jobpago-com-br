import { NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { honra, OFERECE, TIPOS_REFUGIO } from "@/data/honra";
import { card, formatoDe } from "@/lib/cards";

const NOME_TIPO = Object.fromEntries(TIPOS_REFUGIO) as Record<string, string>;
const NOME_OFERECE = Object.fromEntries(OFERECE) as Record<string, string>;
const MEDALHA: Record<string, { fundo: string; cor: string }> = {
  ouro: { fundo: "#fbbf24", cor: "#000" }, prata: { fundo: "#e2e8f0", cor: "#0f172a" }, bronze: { fundo: "#c2410c", cor: "#fff7ed" }, verificado: { fundo: "#1e293b", cor: "#fbbf24" },
};

/* Card do Refúgio verificado — só existe para status "verificado". */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pool = getPool();
  if (!pool || !/^\d+$/.test(id)) return new Response("não encontrado", { status: 404 });
  const { rows } = await pool.query(`SELECT nome, tipo, cidade, uf, oferece, honra, to_char(verificado_em, 'DD/MM/YYYY') verificado_em FROM refugios WHERE id = $1 AND status = 'verificado'`, [id]);
  const r = rows[0];
  if (!r) return new Response("não encontrado", { status: 404 });
  const h = honra(r.honra);
  return card(formatoDe(req.nextUrl.searchParams.get("formato")), {
    selo: "Refúgio da Estrada",
    medalha: { texto: h.nome, ...MEDALHA[h.id] },
    titulo: r.nome,
    subtitulo: `${NOME_TIPO[r.tipo] ?? r.tipo} · ${r.cidade}/${r.uf}`,
    linhas: [...(r.oferece ?? []).map((o: string) => `✓ ${NOME_OFERECE[o] ?? o}`), r.verificado_em ? `Visitado em ${r.verificado_em}` : ""].filter(Boolean),
    rodape: "jobpago.com.br/certificados · verificado pessoalmente na Expedição",
  });
}
