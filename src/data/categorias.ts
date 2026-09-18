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
 *
 * `icone` era emoji — trocado por chave de IconName (ver components/Icons.tsx)
 * pra não depender da fonte de emoji do sistema operacional do visitante.
 */
import type { IconName } from "@/components/Icons";

export interface Categoria {
  id: string;
  /** Chave usada no dado das vagas — não renomear. */
  nome: string;
  icone: IconName;
  /** Texto dos cards de tribo na home. */
  descricao: string;
}

export const CATEGORIAS: Categoria[] = [
  { id: "vanlife", nome: "Nômade & Infra", icone: "van", descricao: "Motorhomes, 220V & Camping" },
  { id: "estrada", nome: "Estrada & Cargas", icone: "truck", descricao: "Chapa, socorro mecânico, frete de retorno e guincho" },
  { id: "devs", nome: "Tecnologia & TI", icone: "code", descricao: "Full-Stack, Automação & IA" },
  { id: "reformas", nome: "Reformas & Reparos", icone: "wrench", descricao: "Eletricistas & Manutenção" },
  { id: "transporte", nome: "Transporte & Fretes", icone: "delivery", descricao: "Carretos & Mudanças" },
  { id: "foto", nome: "Vídeo & Conteúdo", icone: "camera", descricao: "Drone, Edição & Redes Sociais" },
  { id: "aulas", nome: "Aulas & Consultoria", icone: "book", descricao: "Mentorias & Consultorias" },
  { id: "design", nome: "Design & Mídia", icone: "palette", descricao: "Identidade Visual & Social" },
];

/** Chips de filtro da home. "Todas" não é categoria, é ausência de filtro. */
export const FILTROS: { name: string; icon: IconName }[] = [
  { name: "Todas", icon: "fire" },
  ...CATEGORIAS.map((c) => ({ name: c.nome, icon: c.icone })),
];
