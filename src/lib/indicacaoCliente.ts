/* Indicação no navegador do comerciante: vale o PRIMEIRO link clicado, por 60 dias. */
const CHAVE = "jp_indicacao";
const JANELA_MS = 60 * 86400e3;

export function lerIndicacao(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) || "null") as { codigo: string; em: number } | null;
    if (v && /^[A-Z2-9]{6}$/.test(v.codigo) && Date.now() - v.em < JANELA_MS) return v.codigo;
  } catch { /* sem storage */ }
  return null;
}

/** Guarda o código se ainda não houver um válido. Devolve true se foi o primeiro. */
export function guardarIndicacao(codigo: string): boolean {
  if (lerIndicacao()) return false;
  try { localStorage.setItem(CHAVE, JSON.stringify({ codigo, em: Date.now() })); return true; } catch { return false; }
}
