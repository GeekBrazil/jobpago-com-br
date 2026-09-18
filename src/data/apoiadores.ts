/**
 * Régua de contribuição PIX da Expedição — pra quem quer apoiar sem ter um
 * estabelecimento (isso já é coberto por planos-parceiro.ts). Valores e
 * nomes de insígnia são um primeiro rascunho: ajustar aqui, não tem lógica
 * espalhada em outro lugar.
 *
 * Contribuição em si continua fechada no WhatsApp, igual aos planos de
 * parceiro — não tem checkout de propósito. O que muda por faixa é a
 * recompensa: insígnia e/ou menção em /noticias-estrada.
 */
export interface FaixaContribuicao {
  id: string;
  valorMinimo: number;
  insignia: string;
  recompensa: string;
  /** Se true, o nome do apoiador entra em /noticias-estrada quando o Allan publicar. */
  publicacao: boolean;
  tom: "slate" | "emerald" | "amber" | "cyan";
}

export const FAIXAS_CONTRIBUICAO: FaixaContribuicao[] = [
  {
    id: "apoiador",
    valorMinimo: 30,
    insignia: "Apoiador da Estrada",
    recompensa: "Nome na lista de apoiadores da Expedição",
    publicacao: false,
    tom: "slate",
  },
  {
    id: "insignia",
    valorMinimo: 100,
    insignia: "Insígnia de Apoiador",
    recompensa: "Insígnia digital + menção em Notícias da Estrada",
    publicacao: true,
    tom: "emerald",
  },
  {
    id: "honra",
    valorMinimo: 250,
    insignia: "Apoiador de Honra",
    recompensa: "Insígnia de Honra + publicação em destaque com foto do trecho",
    publicacao: true,
    tom: "amber",
  },
  {
    id: "padrinho",
    valorMinimo: 500,
    insignia: "Padrinho da Expedição",
    recompensa: "Tudo do Apoiador de Honra + menção em vídeo/reel da viagem",
    publicacao: true,
    tom: "cyan",
  },
];

export const VALOR_MIN_SLIDER = 20;
export const VALOR_MAX_SLIDER = 500;

export function faixaAtual(valor: number): FaixaContribuicao | null {
  const elegiveis = FAIXAS_CONTRIBUICAO.filter((f) => valor >= f.valorMinimo);
  return elegiveis.length > 0 ? elegiveis[elegiveis.length - 1] : null;
}

/** Shoutouts publicados — o Allan adiciona manualmente aqui depois de confirmar o PIX. */
export interface PostNoticia {
  id: string;
  data: string;
  titulo: string;
  corpo: string;
  autor?: string;
  faixaId?: string;
}

export const NOTICIAS_ESTRADA: PostNoticia[] = [];
