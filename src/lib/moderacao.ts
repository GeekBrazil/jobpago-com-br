import { TERMOS_REVISAO } from "@/config/termos-revisao";

/* Normaliza para comparar: sem acento, minúsculo e com as trocas de número por
   letra mais usadas para driblar filtro ("acomp4nhante"). */
function normalizar(txt: string): string {
  return txt
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/4|@/g, "a")
    .replace(/3/g, "e")
    .replace(/1|!/g, "i")
    .replace(/0/g, "o")
    .replace(/5|\$/g, "s")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PADROES = TERMOS_REVISAO.map((t) => {
  const n = normalizar(t).replace(/ /g, "\\s+");
  return { termo: t, re: new RegExp(`(^|\\s)${n}(\\s|$)`) };
});

/** Termos da lista encontrados nos textos (vazio = pode seguir normalmente). */
export function termosParaRevisao(...textos: (string | null | undefined)[]): string[] {
  const alvo = ` ${normalizar(textos.filter(Boolean).join(" "))} `;
  return PADROES.filter((p) => p.re.test(alvo)).map((p) => p.termo);
}
