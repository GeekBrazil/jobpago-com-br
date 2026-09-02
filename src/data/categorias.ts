/**
 * Fonte única das categorias.
 *
 * Existiam três listas independentes com nomes diferentes para a mesma coisa:
 * TRIBOS_CANONICAS e CATEGORIES (page.tsx) e CATEGORIAS_SERVICOS (formulário).
 * "Fotografia & Eventos" numa, "Fotografia & Mídia" nas outras.
 *
 * `nome` é a chave real do sistema: o filtro da home compara
 * `job.category === selectedCategory` por string exata, e é esse valor que fica
 * gravado no dado da vaga. Renomear quebra o filtro das vagas já publicadas.
 */
export interface Categoria {
  id: string;
  /** Chave usada no dado das vagas — não renomear. */
  nome: string;
  icone: string;
  /** Texto dos cards de tribo na home. */
  descricao: string;
}

export const CATEGORIAS: Categoria[] = [
  { id: "vanlife", nome: "Nômade & Infra", icone: "🚐", descricao: "Motorhomes, 220V & Camping" },
  { id: "estrada", nome: "Estrada & Cargas", icone: "🚛", descricao: "Chapa, socorro mecânico, frete de retorno e guincho" },
  { id: "devs", nome: "Tecnologia & TI", icone: "💻", descricao: "Full-Stack, Automação & IA" },
  { id: "reformas", nome: "Reformas & Reparos", icone: "🛠️", descricao: "Eletricistas & Manutenção" },
  { id: "transporte", nome: "Transporte & Fretes", icone: "🚚", descricao: "Carretos & Mudanças" },
  { id: "foto", nome: "Fotografia & Eventos", icone: "📸", descricao: "Vídeo, Drone & Design" },
  { id: "aulas", nome: "Aulas & Consultoria", icone: "📚", descricao: "Mentorias & Consultorias" },
  { id: "design", nome: "Design & Mídia", icone: "🎨", descricao: "Identidade, social e edição" },
];

/** Chips de filtro da home. "Todas" não é categoria, é ausência de filtro. */
export const FILTROS: { name: string; icon: string }[] = [
  { name: "Todas", icon: "🔥" },
  ...CATEGORIAS.map((c) => ({ name: c.nome, icon: c.icone })),
];
