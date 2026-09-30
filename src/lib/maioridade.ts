import type { Pool } from "pg";

/* Declaração de maioridade (Termos, seção 7): quem cadastra serviço, tarefa,
   disponibilidade ou conta declara ter 18 anos ou mais. Guardamos QUANDO a
   pessoa declarou — é a prova do aceite. Colunas novas, anuláveis, criadas
   aqui de forma idempotente (ADD COLUMN IF NOT EXISTS): não mexe em dado
   existente. Conta antiga fica com NULL até declarar no próximo acesso. */
let pronto = false;
export async function garantirColunasMaioridade(pool: Pool) {
  if (pronto) return;
  for (const tabela of ["usuarios", "leads", "disponibilidades"]) {
    await pool.query(`ALTER TABLE IF EXISTS ${tabela} ADD COLUMN IF NOT EXISTS maior_18_em TIMESTAMPTZ`);
  }
  pronto = true;
}

/** O corpo da requisição trouxe a declaração marcada? */
export const declarouMaioridade = (body: unknown) =>
  typeof body === "object" && body !== null && (body as { maior18?: unknown }).maior18 === true;

export const ERRO_MAIORIDADE = {
  pt: "A JobPago é só para maiores de 18 anos. Marque a declaração para continuar.",
  es: "JobPago es solo para mayores de 18 años. Marcá la declaración para continuar.",
  en: "JobPago is for people aged 18 or over. Tick the declaration to continue.",
};
