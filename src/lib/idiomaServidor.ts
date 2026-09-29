import { cookies, headers } from "next/headers";
import type { Idioma } from "@/lib/textosEstrada";

/* Idioma da renderização no servidor: ?lang= (via proxy) > escolha salva > idioma do navegador > português. */
export async function idiomaServidor(): Promise<Idioma> {
  const h = await headers();
  const forcado = h.get("x-jp-lang");
  if (forcado === "pt" || forcado === "es" || forcado === "en") return forcado;
  const c = (await cookies()).get("jp_lang")?.value;
  if (c === "pt" || c === "es" || c === "en") return c;
  const nav = (h.get("accept-language") || "").slice(0, 2).toLowerCase();
  return nav === "es" || nav === "en" ? nav : "pt";
}
