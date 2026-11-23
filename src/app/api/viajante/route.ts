import { NextResponse } from "next/server";
import { usuarioLogado, perfilViajante } from "@/lib/viajante";

export const runtime = "nodejs";

/* Perfil de reputação do viajante logado (nível, pontos, contribuições recentes). */
export async function GET(req: Request) {
  const u = await usuarioLogado();
  if (!u) {
    const optional = new URL(req.url).searchParams.get("optional") === "1";
    return NextResponse.json({ logado: false }, { status: optional ? 200 : 401 });
  }
  return NextResponse.json({ logado: true, nome: u.nome, email: u.email, maior18: u.maior18, ...(await perfilViajante(u.id, u.email, u.telefone)) });
}
