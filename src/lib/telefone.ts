/* Telefone/WhatsApp com código do país — sem banco, serve ao navegador e às APIs.
   Formato gravado: número brasileiro continua como sempre (DDD + número, 10–11 dígitos,
   sem o 55); estrangeiro vai com "+" e o código do país (ex.: +5491122334455). */

/** [código ISO, DDI] — Brasil primeiro, depois vizinhos e quem mais viaja pelo litoral. */
export const PAISES: [string, string][] = [
  ["BR", "55"], ["AR", "54"], ["UY", "598"], ["PY", "595"], ["CL", "56"], ["BO", "591"], ["PE", "51"],
  ["CO", "57"], ["VE", "58"], ["EC", "593"], ["MX", "52"], ["US", "1"], ["CA", "1"], ["PT", "351"],
  ["ES", "34"], ["FR", "33"], ["DE", "49"], ["IT", "39"], ["GB", "44"], ["IE", "353"], ["NL", "31"],
  ["BE", "32"], ["CH", "41"], ["AT", "43"], ["SE", "46"], ["NO", "47"], ["DK", "45"], ["PL", "48"],
  ["IL", "972"], ["ZA", "27"], ["AU", "61"], ["NZ", "64"], ["JP", "81"], ["CN", "86"],
];

export const bandeira = (iso: string) => String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/** Máscara brasileira (24) 99999-9999. */
export function mascaraBR(bruto: string) {
  const v = bruto.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
  if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
  return v ? `(${v}` : "";
}

/** Valor que o campo entrega ao formulário: BR mascarado; estrangeiro "+DDI número". */
export function montarTelefone(ddi: string, numero: string) {
  const d = numero.replace(/\D/g, "");
  if (!d) return "";
  return ddi === "55" ? mascaraBR(d) : `+${ddi} ${d}`;
}

/** Normaliza o que chegou na API; `null` = inválido. */
export function normalizarTelefone(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const s = bruto.trim();
  const d = s.replace(/\D/g, "");
  if (s.startsWith("+") || (d.startsWith("55") && d.length >= 12)) {
    if (d.startsWith("55")) {
      const br = d.slice(2);
      return br.length === 10 || br.length === 11 ? br : null;
    }
    return s.startsWith("+") && d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  }
  return d.length === 10 || d.length === 11 ? d : null;
}
