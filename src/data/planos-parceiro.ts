/**
 * Níveis de parceria da Expedição JobPago (Angra dos Reis → Fortaleza).
 *
 * Conteúdo informativo: não há checkout aqui, e é de propósito. Cada acordo é
 * fechado por conversa, porque o que define o nível é o que o estabelecimento
 * tem para oferecer em campo, não um botão.
 *
 * Regra que não pode ser quebrada: patrocínio é acordo comercial de divulgação
 * entre o estabelecimento e o JobPago. Não tem relação com os serviços
 * anunciados na plataforma, onde o PIX segue combinado direto entre as partes.
 */
export interface PlanoParceiro {
  id: string;
  nivel: number;
  nome: string;
  /** `null` = sob consulta. Nível 4 não expõe faixa até haver métrica de audiência real. */
  valor: string | null;
  resumo: string;
  entregaveis: string[];
  destaque?: boolean;
  /** Acento visual, seguindo as classes que já existem no site. */
  tom: "emerald" | "amber" | "cyan" | "slate";
}

export const PLANOS: PlanoParceiro[] = [
  {
    id: "permuta",
    nivel: 1,
    nome: "Permuta",
    valor: "R$ 0 em dinheiro",
    resumo:
      "Você oferece estrutura, eu ofereço visibilidade. Nenhum dos dois tira do bolso.",
    entregaveis: [
      "Selo JobPago Verificado, com data da visita",
      "Minisite básico no mapa da rede",
      "Menção nas redes durante a passagem pelo trecho",
    ],
    tom: "emerald",
  },
  {
    id: "local",
    nivel: 2,
    nome: "Parceiro Local",
    valor: "R$ 180 a 450 (taxa única) ou R$ 49/mês",
    resumo:
      "Para quem quer aparecer para quem está na estrada agora, não só para quem já conhece.",
    entregaveis: [
      "Minisite completo, com fotos, tags de infraestrutura e contato direto",
      "Otimização do seu perfil no Google Maps",
      "Um vídeo ou reel colaborativo, gravado no local",
      "Selo JobPago Verificado, com data da visita",
    ],
    destaque: true,
    tom: "amber",
  },
  {
    id: "regional",
    nivel: 3,
    nome: "Patrocínio Regional",
    valor: "R$ 600 a 1.500 por trecho ou estado",
    resumo:
      "Sua marca associada a um trecho inteiro da rota, não a um ponto no mapa.",
    entregaveis: [
      "Logo nas lives e vídeos daquele estado",
      "Banner na categoria regional do site",
      "Tudo que o Parceiro Local inclui",
    ],
    tom: "cyan",
  },
  {
    id: "master",
    nivel: 4,
    nome: "Master da Expedição",
    valor: null,
    resumo:
      "Nomeação oficial da expedição e marca aplicada em toda a comunicação. Conversa, não pacote.",
    entregaveis: [
      "Nome da marca no nome da expedição",
      "Presença em toda a comunicação do percurso",
      "Escopo e contrapartidas definidos caso a caso",
    ],
    tom: "slate",
  },
];

/** WhatsApp do Allan — o mesmo que a API de leads já usa. */
export const WHATSAPP = "5524993326966";

export function linkWhatsapp(plano: PlanoParceiro) {
  const texto =
    plano.valor === null
      ? `Olá Allan! Quero conversar sobre o patrocínio Master da Expedição JobPago.`
      : `Olá Allan! Tenho interesse no nível ${plano.nivel} (${plano.nome}) da Expedição JobPago.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}
