/**
 * Alta Honra (29/09/2026, ideia do Allan): mede COMO o estabelecimento apoia a
 * Expedição — dinheiro + permuta no topo, depois só dinheiro, depois só permuta.
 * Complementa os planos de parceiro (planos-parceiro.ts), que dizem O QUE ele recebe.
 *
 * Regra que não pode ser quebrada: o registro de visita nunca é vendido. Quem paga
 * (dinheiro ou permuta) aparece SEMPRE identificado como Parceiro — publicidade
 * tem de ser identificável (CDC art. 36). Os ids ficam iguais: estão no banco.
 */
export interface NivelHonra {
  id: "ouro" | "prata" | "bronze" | "verificado";
  nome: string;
  como: string;
  desc: string;
  ganha: string;
  cor: string; // classes do selo
}

export const NIVEIS_HONRA: NivelHonra[] = [
  {
    id: "ouro",
    nome: "Parceiro · Honra Ouro",
    como: "Dinheiro + permuta",
    desc: "Fecha um plano de parceiro e ainda recebe a expedição: pernoite, refeição ou estrutura.",
    ganha: "Primeiro na lista da cidade e no mapa, identificado como Parceiro, com a medalha ouro, e menção em todo conteúdo gravado no trecho.",
    cor: "bg-amber-400 text-black border-amber-300",
  },
  {
    id: "prata",
    nome: "Parceiro · Honra Prata",
    como: "Dinheiro",
    desc: "Fecha um plano de parceiro (Local, Regional ou Master).",
    ganha: "Aparece antes dos lugares só visitados, identificado como Parceiro, com a medalha prata, e menção quando a expedição passar.",
    cor: "bg-slate-200 text-slate-900 border-slate-100",
  },
  {
    id: "bronze",
    nome: "Parceiro (permuta) · Honra Bronze",
    como: "Permuta",
    desc: "Recebe a expedição em troca de visibilidade: uma noite, uma refeição ou a estrutura para gravar.",
    ganha: "Medalha bronze, identificado como Parceiro (permuta), e menção nas redes durante a passagem.",
    cor: "bg-orange-700 text-orange-50 border-orange-500",
  },
  {
    id: "verificado",
    nome: "Visitado",
    como: "Só a visita",
    desc: "Foi visitado pela expedição, sem contrapartida.",
    ganha: "Registro de visita com a data, no mapa e na lista.",
    cor: "bg-white/5 text-amber-300 border-white/15",
  },
];

export const honra = (id: string | null | undefined) => NIVEIS_HONRA.find((n) => n.id === id) ?? NIVEIS_HONRA[3];

export const TIPOS_REFUGIO = [
  ["camping", "Camping"],
  ["hostel", "Hostel"],
  ["pousada", "Pousada"],
  ["hotel", "Hotel"],
  ["patio", "Pátio de posto / área de motorhome"],
] as const;

export const OFERECE = [
  ["seguro", "Portão, recepção ou vigia no dia da visita"],
  ["banho", "Banho quente"],
  ["energia", "Tomada para celular e notebook"],
  ["220v", "Ponto 220V para motorhome e van"],
  ["internet", "Internet"],
  ["cozinha", "Cozinha ou refeição no local"],
  ["agua", "Água potável / descarte para motorhome"],
] as const;
