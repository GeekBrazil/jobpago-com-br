import { NextResponse, type NextRequest } from "next/server";

/* Idioma do site (pt/es/en): ?lang= na URL grava a escolha num cookie e já vale
   para esta renderização (cabeçalho x-jp-lang), para o link compartilhado abrir
   direto no idioma certo. */
export function proxy(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  if (lang !== "pt" && lang !== "es" && lang !== "en") return NextResponse.next();
  const headers = new Headers(req.headers);
  headers.set("x-jp-lang", lang);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("jp_lang", lang, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
  return res;
}

export const config = { matcher: ["/((?!api|_next|card|speedtest|.*\\..*).*)"] };
