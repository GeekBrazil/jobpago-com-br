"use client";

import { useIdiomaContexto } from "@/components/IdiomaProvider";
import type { Idioma } from "@/lib/textosEstrada";

/* Idioma do site (pt/es/en), vindo do layout pelo IdiomaProvider. */
export function useIdioma(): [Idioma, (i: Idioma) => void] {
  return useIdiomaContexto();
}
