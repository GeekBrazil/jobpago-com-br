import { NextResponse } from "next/server";
import { usuarioLogado, perfilViajante } from "@/lib/viajante";

export const runtime = "nodejs";

/* Perfil de reputação do viajante logado (nível, pontos, contribuições recentes). */
export async function GET() {
  const u = await usuarioLogado();
  if (!u) return NextResponse.json({ logado: false }, { status: 401 });
  return NextResponse.json({ logado: true, nome: u.nome, maior18: u.maior18, ...(await perfilViajante(u.id)) });
}
