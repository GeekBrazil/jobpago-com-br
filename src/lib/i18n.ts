import type { Idioma } from "@/lib/textosEstrada";

export type { Idioma };
/** Texto nas três línguas do site, escolhido pelo idioma atual. */
export const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);
