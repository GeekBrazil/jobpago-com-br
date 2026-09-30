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
import type { Idioma } from "@/lib/textosEstrada";

export interface Categoria {
  id: string;
  /** Chave usada no dado das vagas — não renomear. */
  nome: string;
  icone: IconName;
  /** Texto dos cards de tribo na home. */
  descricao: string;
  /** Exigência legal da atividade — aparece no cadastro e em Como Funciona. */
  aviso?: Record<Idioma, string>;
}

const AVISO_FRETE: Record<Idioma, string> = {
  pt: "Frete remunerado de cargas exige registro do transportador na ANTT (RNTRC). A regularidade é responsabilidade do prestador.",
  es: "El flete remunerado de cargas exige el registro del transportista en la ANTT (RNTRC). La regularidad es responsabilidad del prestador.",
  en: "Paid freight requires the carrier to be registered with ANTT (RNTRC). Compliance is the provider's responsibility.",
};

const AVISO_DRONE: Record<Idioma, string> = {
  pt: "Voo de drone para fins comerciais exige cadastro no SISANT (ANAC) e autorização no SARPAS (DECEA). A regularidade é responsabilidade do prestador.",
  es: "El vuelo de dron con fines comerciales exige registro en el SISANT (ANAC) y autorización en el SARPAS (DECEA). La regularidad es responsabilidad del prestador.",
  en: "Commercial drone flights require SISANT registration (ANAC) and SARPAS authorization (DECEA). Compliance is the provider's responsibility.",
};

export const CATEGORIAS: Categoria[] = [
  { id: "vanlife", nome: "Nômade & Infra", icone: "van", descricao: "Motorhomes, 220V & Camping" },
  { id: "estrada", nome: "Estrada & Cargas", icone: "truck", descricao: "Chapa, socorro mecânico, frete de retorno e guincho", aviso: AVISO_FRETE },
  { id: "devs", nome: "Tecnologia & TI", icone: "code", descricao: "Full-Stack, Automação & IA" },
  { id: "transporte", nome: "Transporte & Fretes", icone: "delivery", descricao: "Carretos & Mudanças", aviso: AVISO_FRETE },
  { id: "foto", nome: "Vídeo & Conteúdo", icone: "camera", descricao: "Drone, Edição & Redes Sociais", aviso: AVISO_DRONE },
  { id: "aulas", nome: "Aulas & Consultoria", icone: "book", descricao: "Mentorias & Consultorias" },
  { id: "design", nome: "Design & Mídia", icone: "palette", descricao: "Identidade Visual & Social" },
];

/** Chips de filtro da home. "Todas" não é categoria, é ausência de filtro. */
export const FILTROS: { id: string; name: string; icon: IconName }[] = [
  { id: "todas", name: "Todas", icon: "fire" },
  ...CATEGORIAS.map((c) => ({ id: c.id, name: c.nome, icon: c.icone })),
];

/** Aviso legal da categoria (por id ou pelo nome gravado nas vagas). */
export const avisoCategoria = (i: Idioma, idOuNome: string) =>
  CATEGORIAS.find((c) => c.id === idOuNome || c.nome === idOuNome)?.aviso?.[i] ?? null;
