import { getPool } from "@/lib/db";

/* Expedições dos viajantes (fase 3, 29/09/2026).
   - O viajante cria a própria expedição; o Allan aprova antes de ficar pública.
   - Patrocínio passa pela JobPago: o patrocinador paga a JobPago, que repassa
     85% ao viajante (decisão do Allan). Contrato simples antes do 1º repasse.
   - SEGURANÇA (inegociável): a página pública nunca mostra onde a pessoa está
     agora — sem datas exatas, diário só aparece 24 h depois de escrito, e quem
     viaja sozinho pode esconder o roteiro planejado. */

export const REPASSE = 0.85;
export const ATRASO_DIARIO_HORAS = 24;

export { MODOS, REDES, nomeModo, type Idioma } from "@/lib/expedicoesListas";

export function slugDe(nome: string) {
  const base = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  return base || "expedicao";
}

let pronto = false;
export async function garantirTabelasExpedicoes() {
  const pool = getPool();
  if (!pool) return null;
  if (!pronto) {
    await pool.query(`CREATE TABLE IF NOT EXISTS expedicoes (
      id SERIAL PRIMARY KEY, usuario_id INT NOT NULL UNIQUE, slug VARCHAR(60) UNIQUE NOT NULL, nome VARCHAR(120) NOT NULL,
      tema TEXT, origem VARCHAR(80) NOT NULL, destino VARCHAR(80) NOT NULL, paradas TEXT[] DEFAULT '{}',
      mes_inicio VARCHAR(7), modo VARCHAR(20) NOT NULL, veiculo VARCHAR(120), sozinho BOOLEAN DEFAULT FALSE,
      mostrar_roteiro BOOLEAN DEFAULT TRUE, redes JSONB DEFAULT '[]', pagamento_tipo VARCHAR(10), pagamento_chave VARCHAR(200),
      idioma CHAR(2) DEFAULT 'pt', status VARCHAR(12) NOT NULL DEFAULT 'em_analise', motivo TEXT,
      criado_em TIMESTAMPTZ DEFAULT now(), atualizado_em TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS expedicao_diario (
      id SERIAL PRIMARY KEY, expedicao_id INT NOT NULL, cidade VARCHAR(80), uf VARCHAR(40), texto TEXT NOT NULL, link VARCHAR(300),
      criado_em TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS patrocinios (
      id SERIAL PRIMARY KEY, expedicao_id INT NOT NULL, patrocinador VARCHAR(160) NOT NULL, contato VARCHAR(160), email VARCHAR(200),
      proposta TEXT, valor NUMERIC(12,2), repasse NUMERIC(12,2), jobpago NUMERIC(12,2),
      status VARCHAR(12) NOT NULL DEFAULT 'proposta', pago_em DATE, repassado_em DATE, notas TEXT,
      criado_em TIMESTAMPTZ DEFAULT now())`);
    pronto = true;
  }
  return pool;
}
