/* Reputação do viajante (29/09/2026). Pontos só entram quando a contribuição é
   CONFIRMADA (pelo Allan na Central ou, depois, por outro viajante de nível 10+);
   o questionário conta uma vez só, na hora. Fica no banco `jobpago`, ligado ao
   login — não mais no navegador. */

export type TipoContribuicao =
  | "fachada" | "dormi_aqui" | "internet" | "combustivel" | "estrada" | "indicar_lugar" | "questionario";

export const PONTOS: Record<TipoContribuicao, number> = {
  questionario: 150,
  dormi_aqui: 120,
  fachada: 60,
  indicar_lugar: 50, // +500 quando o lugar vira Refúgio verificado
  internet: 40,
  estrada: 40,
  combustivel: 30,
};
export const BONUS_REFUGIO_VERIFICADO = 500;

/* Curva: pontos acumulados para chegar ao nível n = 10 × n^1,5.
   Nível 10 ≈ 316 pontos (3–4 contribuições); 100 ≈ 10 mil; 1000 ≈ 316 mil.
   (A regra antiga, +40% por nível, tornava o nível 1000 impossível.) */
export const pontosParaNivel = (n: number) => (n <= 1 ? 0 : Math.round(10 * Math.pow(n, 1.5)));

export function nivelDe(pontos: number) {
  let n = Math.max(1, Math.floor(Math.pow(Math.max(pontos, 0) / 10, 2 / 3)));
  while (n < 1000 && pontosParaNivel(n + 1) <= pontos) n++;
  while (n > 1 && pontosParaNivel(n) > pontos) n--;
  n = Math.min(n, 1000);
  const base = pontosParaNivel(n);
  const proximo = n >= 1000 ? base : pontosParaNivel(n + 1);
  return { nivel: n, base, proximo, progresso: n >= 1000 ? 1 : (pontos - base) / Math.max(1, proximo - base) };
}

/* Título novo a cada 100 níveis. */
const TITULOS = [
  "Andarilho", "Olheiro da Rota", "Guia do Trecho", "Batedor", "Cartógrafo da Rota",
  "Mestre do Litoral", "Guardião do Pernoite", "Desbravador", "Sentinela da Rota", "Patrono da Rota", "Lenda da Rota",
];
export const tituloDe = (nivel: number) => TITULOS[Math.min(10, Math.floor(nivel / 100))];

/* O que cada faixa libera. Recompensa que depende de parceiro fica marcada — só
   vale quando houver Refúgios com Honra que ofereçam a cortesia. */
export const RECOMPENSAS = [
  { nivel: 10, titulo: "Confirma contribuições de outros viajantes", parceiro: false },
  { nivel: 50, titulo: "Prioridade quando um negócio publica tarefa na sua área", parceiro: false },
  { nivel: 100, titulo: "Vaga no Comboio da Expedição — gratuita", parceiro: false },
  { nivel: 200, titulo: "Pernoite ou desconto nos lugares parceiros", parceiro: true },
  { nivel: 300, titulo: "Tarefas pagas de atualização de lugares (fotos, estrutura, preço)", parceiro: true },
  { nivel: 500, titulo: "Selo público de Mestre do Litoral no perfil e nos cards", parceiro: false },
  { nivel: 1000, titulo: "Lenda da Rota: nome na página da expedição", parceiro: false },
];
