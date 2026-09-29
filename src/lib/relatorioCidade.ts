/* Relatório da cidade (/cidade/[ibge]) — dados públicos do mesmo motor do
   allancandido.com (API pncp-etl, endpoint /relatorio-cidade/{ibge}):
   Receita Federal (empresas abertas por setor), Novo CAGED (salário de
   admissão por setor) e PNCP (compras públicas abertas). Só servidor. */

const API = process.env.PNCP_API_URL || "http://l7o87txsftz6r3u97g1ra1j8.188.245.70.109.sslip.io";
const CHAVE = process.env.PNCP_API_KEY || "";

export interface Categoria {
  categoria: string;
  ativas: number | null;
  novas_12m: number | null;
  novas_90d: number | null;
  atualizado_em?: string;
}
export interface Setor {
  secao: string;
  setor: string;
  admissoes: number;
  desligamentos: number;
  saldo: number;
  salario_medio_adm: number | null;
}
export interface Compra {
  objeto: string;
  orgao_nome: string;
  valor_estimado: number;
  modalidade_nome: string | null;
  data_encerramento: string;
  url_pncp: string | null;
}
export interface Relatorio {
  municipio: { municipio_ibge: string; municipio_nome: string; uf: string; populacao: number | null };
  negocios_total: Categoria | null;
  categorias: Categoria[];
  emprego: {
    de: number; ate: number; admissoes: number; desligamentos: number; saldo: number;
    salario_medio_adm: number | null; setores: Setor[];
  } | null;
  compras_pequenas: Compra[];
  compras_abertas: number;
}

async function chama<T>(caminho: string, revalidate = 86400): Promise<T | null> {
  if (!CHAVE) return null;
  try {
    const r = await fetch(API + caminho, { headers: { "X-API-Key": CHAVE }, next: { revalidate } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const relatorioCidade = (ibge: string) =>
  /^\d{7}$/.test(ibge) ? chama<Relatorio>(`/relatorio-cidade/${ibge}`) : Promise.resolve(null);

export interface MunicipioBusca {
  municipio_ibge: string;
  municipio_nome: string;
  uf: string;
  populacao: number | null;
}
export const buscarMunicipios = (q: string) =>
  chama<MunicipioBusca[]>(`/municipios?q=${encodeURIComponent(q)}&limit=12`, 3600);

/* Rótulo de cada setor do mapa de empresas + o que esse tipo de negócio
   costuma precisar de fora (o trabalho que a JobPago conecta). */
export const SETORES: Record<string, { nome: string; tarefas: string }> = {
  transporte_frete: { nome: "Transporte e frete", tarefas: "cotação de frete, rota, atendimento no WhatsApp" },
  restaurante: { nome: "Restaurantes", tarefas: "cardápio digital, fotos dos pratos, perfil no Google" },
  loja_roupas: { nome: "Lojas de roupa", tarefas: "fotos de produto, Instagram, catálogo no WhatsApp" },
  salao_beleza: { nome: "Salões de beleza", tarefas: "agenda online, antes e depois, Instagram" },
  padaria: { nome: "Padarias", tarefas: "encomendas pelo WhatsApp, perfil no Google" },
  mercado_mercearia: { nome: "Mercados e mercearias", tarefas: "lista de ofertas, entrega, catálogo" },
  oficina_mecanica: { nome: "Oficinas mecânicas", tarefas: "orçamento por foto, Google Maps, avaliações" },
  agropecuaria: { nome: "Agropecuária", tarefas: "venda direta, logística, divulgação regional" },
  bar: { nome: "Bares", tarefas: "agenda de eventos, Instagram, cardápio" },
  imobiliaria: { nome: "Imobiliárias", tarefas: "fotos e vídeo de imóvel, anúncios, atendimento" },
  turismo_passeio: { nome: "Turismo e passeios", tarefas: "reservas, vídeos curtos, avaliações" },
  artesanato: { nome: "Artesanato", tarefas: "loja online, fotos, envio" },
  camping_estacionamento: { nome: "Campings e estacionamentos", tarefas: "reserva, mapa, avaliações de viajante" },
  pousada: { nome: "Pousadas", tarefas: "Booking e Google, fotos, resposta rápida a hóspede" },
  posto_combustivel: { nome: "Postos de combustível", tarefas: "perfil no Google, avaliações, conveniência no Instagram" },
};
export const nomeSetor = (c: string) => SETORES[c]?.nome ?? c.replace(/_/g, " ");

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const competencia = (c: number) => `${MESES[(c % 100) - 1]}/${Math.floor(c / 100)}`;

/* Paradas principais da Expedição JobPago (Paraty → Fortaleza, pelo litoral). */
export const CIDADES_DESTAQUE = [
  { ibge: "3303807", nome: "Paraty", uf: "RJ" },
  { ibge: "3300100", nome: "Angra dos Reis", uf: "RJ" },
  { ibge: "3304557", nome: "Rio de Janeiro", uf: "RJ" },
  { ibge: "3301009", nome: "Campos dos Goytacazes", uf: "RJ" },
  { ibge: "3205309", nome: "Vitória", uf: "ES" },
  { ibge: "2925501", nome: "Prado", uf: "BA" },
  { ibge: "2925303", nome: "Porto Seguro", uf: "BA" },
  { ibge: "2913606", nome: "Ilhéus", uf: "BA" },
  { ibge: "2927408", nome: "Salvador", uf: "BA" },
  { ibge: "2800308", nome: "Aracaju", uf: "SE" },
  { ibge: "2704302", nome: "Maceió", uf: "AL" },
  { ibge: "2611606", nome: "Recife", uf: "PE" },
  { ibge: "2507507", nome: "João Pessoa", uf: "PB" },
  { ibge: "2408102", nome: "Natal", uf: "RN" },
  { ibge: "2304400", nome: "Fortaleza", uf: "CE" },
];
