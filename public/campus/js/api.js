// Cliente da API do Campus (/api/campus/*).
// Todo POST leva X-Campus: 1 e corpo JSON. Nada aqui envia mensagem pra ninguém:
// o servidor só devolve rascunhos e links; quem envia é o Allan, no app dele.

const BASE = '/api/campus';

let mock = null; // (rota, opcoes) => Promise<any> — só em modo de teste (?mock=1)

export function instalarMock(fn) { mock = fn; }

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, rede = false, dados = null } = {}) {
    super(mensagem);
    this.status = status;
    this.rede = rede;
    this.dados = dados;
  }
}

async function pedir(rota, { metodo = 'GET', corpo, timeout = 15000 } = {}) {
  if (mock) return mock(rota, { metodo, corpo });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const headers = { Accept: 'application/json' };
  const init = { method: metodo, headers, signal: ctrl.signal, cache: 'no-store', credentials: 'same-origin' };
  if (metodo !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['X-Campus'] = '1';
    init.body = JSON.stringify(corpo ?? {});
  }
  let resp;
  try {
    resp = await fetch(BASE + rota, init);
  } catch (e) {
    throw new ErroApi(e?.name === 'AbortError' ? 'Demorou demais pra responder' : 'Sem conexão com o PC', { rede: true });
  } finally {
    clearTimeout(timer);
  }
  let dados = null;
  try { dados = await resp.json(); } catch { /* corpo vazio ou não-JSON */ }
  if (!resp.ok) {
    const msg = (dados && (dados.mensagem || dados.erro || dados.motivo)) || `Erro ${resp.status}`;
    throw new ErroApi(String(msg), { status: resp.status, dados });
  }
  return dados;
}

export const api = {
  estado: () => pedir('/estado', { timeout: 12000 }),
  acordar: (slug) => pedir('/acordar', { metodo: 'POST', corpo: { slug }, timeout: 30000 }),
  dormir: (slug) => pedir('/dormir', { metodo: 'POST', corpo: { slug }, timeout: 30000 }),
  bomDia: () => pedir('/bom-dia', { metodo: 'POST', corpo: {}, timeout: 60000 }),
  conversar: (slug, mensagem, historico) =>
    pedir('/conversar', { metodo: 'POST', corpo: { slug, mensagem, historico }, timeout: 60000 }),
  acao: (slug, id) => pedir('/acao', { metodo: 'POST', corpo: { slug, id }, timeout: 15000 }),
  monetizacao: () => pedir('/monetizacao', { timeout: 10000 }),
  fila: (limite = 20, atualizar = false) =>
    pedir(`/prospeccao/fila?limite=${encodeURIComponent(limite)}${atualizar ? '&atualizar=1' : ''}`, { timeout: 60000 }),
  rascunho: ({ id, origem, canal, pedido }) =>
    pedir('/prospeccao/rascunho', { metodo: 'POST', corpo: { id, origem, canal, ...(pedido ? { pedido } : {}) }, timeout: 70000 }),
  registro: ({ cnpj, canal, acao, ref }) =>
    pedir('/prospeccao/registro', { metodo: 'POST', corpo: { cnpj, canal, acao, ref }, timeout: 15000 }),
  robo: () => pedir('/prospeccao/robo', { timeout: 10000 }),
};
