import { randomBytes } from "crypto";
import { getPool } from "@/lib/db";

/* Indicação com comissão (decisões do Allan, 29/09/2026):
   - vale só sobre planos da JobPago (Parceiro Local/Regional/Master, Honra);
   - plano mensal: 50% da PRIMEIRA mensalidade; anual ou taxa única: 15%;
   - comissão libera 30 dias depois do pagamento do comerciante (reembolso/estorno);
   - vale o PRIMEIRO link que o comerciante clicou, por 60 dias;
   - pagamento manual, mensal, por Pix ou Wise/PayPal (estrangeiro raramente tem Pix);
   - ninguém indica o próprio negócio; quem indica avisa que ganha comissão. */

export const REGRAS = { mensal: 0.5, anual: 0.15, unica: 0.15, carenciaDias: 30, janelaDias: 60, minimoPagamento: 50 } as const;
/** Vaga no Comboio da Expedição: gratuita, liberada neste nível. */
export const NIVEL_COMBOIO = 100;
export const PONTOS_INDICACAO = { verificado: 300, pagante: 800 } as const;

let pronto = false;
export async function garantirTabelasIndicacao() {
  const pool = getPool();
  if (!pool) return null;
  if (!pronto) {
    await pool.query(`CREATE TABLE IF NOT EXISTS indicadores (
      usuario_id INT PRIMARY KEY, codigo VARCHAR(12) UNIQUE NOT NULL, pagamento_tipo VARCHAR(10), pagamento_chave VARCHAR(200),
      pais VARCHAR(60), aceitou_regras BOOLEAN NOT NULL DEFAULT FALSE, criado_em TIMESTAMPTZ DEFAULT now(), atualizado_em TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS indicacao_cliques (
      id SERIAL PRIMARY KEY, codigo VARCHAR(12) NOT NULL, criado_em TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS indicacao_cliques_codigo ON indicacao_cliques (codigo)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS comissoes (
      id SERIAL PRIMARY KEY, codigo VARCHAR(12) NOT NULL, comerciante VARCHAR(160) NOT NULL, refugio_id INT,
      plano VARCHAR(20) NOT NULL, modalidade VARCHAR(10) NOT NULL, valor_pago NUMERIC(10,2) NOT NULL, percentual NUMERIC(5,4) NOT NULL,
      valor_comissao NUMERIC(10,2) NOT NULL, pago_em DATE NOT NULL, libera_em DATE NOT NULL,
      status VARCHAR(12) NOT NULL DEFAULT 'aguardando', paga_em DATE, notas TEXT, criado_em TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS comboio (
      usuario_id INT PRIMARY KEY, nivel_na_inscricao INT, trecho VARCHAR(120), como VARCHAR(40), status VARCHAR(12) NOT NULL DEFAULT 'inscrito',
      criado_em TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`ALTER TABLE refugios ADD COLUMN IF NOT EXISTS indicador_codigo VARCHAR(12)`).catch(() => {});
    pronto = true;
  }
  return pool;
}

/* Código curto, sem letras que se confundem (0/O, 1/I/L). */
export function novoCodigo() {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  return Array.from(b, (x) => a[x % a.length]).join("");
}

export const codigoValido = (c: unknown): c is string => typeof c === "string" && /^[A-Z2-9]{6}$/.test(c);
