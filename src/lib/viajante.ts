import { auth } from "@/lib/authOptions";
import { getPool } from "@/lib/db";
import { nivelDe, tituloDe } from "@/lib/reputacao";
import { garantirColunasMaioridade } from "@/lib/maioridade";

/* Viajante = usuário logado da JobPago (tabela usuarios). Contribuições e
   questionário ficam em `contribuicoes`; pontos = soma das confirmadas. */

let pronto = false;
export async function garantirTabelasViajante() {
  const pool = getPool();
  if (!pool) return null;
  if (!pronto) {
    await pool.query(`CREATE TABLE IF NOT EXISTS contribuicoes (
      id SERIAL PRIMARY KEY, usuario_id INT NOT NULL, tipo VARCHAR(20) NOT NULL, dados JSONB NOT NULL DEFAULT '{}',
      lat DOUBLE PRECISION, lng DOUBLE PRECISION, precisao_m INT, foto_url TEXT, foto_ponto_id INT,
      cidade VARCHAR(80), uf CHAR(2), idioma CHAR(2), status VARCHAR(12) NOT NULL DEFAULT 'pendente',
      pontos INT NOT NULL DEFAULT 0, motivo TEXT, criado_em TIMESTAMPTZ DEFAULT now(), revisado_em TIMESTAMPTZ)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS contribuicoes_usuario ON contribuicoes (usuario_id)`);
    // questionário conta uma vez por pessoa
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS contribuicoes_questionario ON contribuicoes (usuario_id) WHERE tipo = 'questionario'`);
    pronto = true;
  }
  return pool;
}

/** id e nome do usuário logado (a sessão JWT só traz e-mail e nome). */
export async function usuarioLogado(): Promise<{ id: number; nome: string; email: string; maior18: boolean } | null> {
  const s = await auth();
  const email = s?.user?.email?.toLowerCase();
  if (!email) return null;
  const pool = await garantirTabelasViajante();
  if (!pool) return null;
  await garantirColunasMaioridade(pool);
  const { rows } = await pool.query(
    `SELECT id, nome, email, maior_18_em IS NOT NULL AS "maior18" FROM usuarios WHERE lower(email) = $1`, [email]);
  return rows[0] ?? null;
}

export async function perfilViajante(usuarioId: number) {
  const pool = (await garantirTabelasViajante())!;
  const { rows: soma } = await pool.query(
    `SELECT COALESCE(SUM(pontos) FILTER (WHERE status = 'confirmada'), 0)::int pontos,
            COUNT(*) FILTER (WHERE status = 'confirmada')::int confirmadas,
            COUNT(*) FILTER (WHERE status = 'pendente')::int pendentes,
            BOOL_OR(tipo = 'questionario') questionario
     FROM contribuicoes WHERE usuario_id = $1`, [usuarioId]);
  const { rows: recentes } = await pool.query(
    `SELECT id, tipo, status, pontos, dados->>'nome' nome, cidade, uf, to_char(criado_em, 'DD/MM') quando
     FROM contribuicoes WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 20`, [usuarioId]);
  const pontos = soma[0].pontos as number;
  const n = nivelDe(pontos);
  return { pontos, ...n, titulo: tituloDe(n.nivel), confirmadas: soma[0].confirmadas, pendentes: soma[0].pendentes, questionario: !!soma[0].questionario, recentes };
}
