// Campus — backend das agentes (/api/campus/*). Dono: backend. Contrato: data/campus/CONTRATO.md (o ADENDO vale).
//
// Regras que este arquivo NUNCA quebra:
//  * nada aqui envia e-mail/WhatsApp/Telegram: só devolve rascunho + link que o Allan abre no app dele;
//  * não liga o prospeccao-robo.timer, não roda robo.py, não chama allancandido.com/api/prospeccao/enviar;
//  * systemctl só com argumentos fixos, unidades tiradas do roster (data/campus/agentes.json), nunca do cliente;
//  * nunca mexe em creative-lab, stack-control nem ollama (liga/desliga);
//  * e-mail/telefone de terceiros só saem dentro do `link` do /prospeccao/rascunho; nada disso vai pra log ou arquivo.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.dirname(AQUI);
const ROSTER = path.join(RAIZ, 'data', 'campus', 'agentes.json');
const MONETIZACAO = path.join(RAIZ, 'data', 'campus', 'monetizacao.json');
const AUTOMACOES = path.join(RAIZ, 'data', 'automacoes.json');
const SISTEMAS = path.join(RAIZ, 'sistemas');
const HOME = os.homedir();
const PORTA = parseInt(process.env.PORT || '7700', 10);
const LAB = `http://127.0.0.1:${PORTA}`;
const CENTRAL = 'http://127.0.0.1:3015';
const STACK = 'http://127.0.0.1:3009';
const OLLAMA = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(process.env.CAMPUS_OLLAMA_URL || '') ? process.env.CAMPUS_OLLAMA_URL : 'http://localhost:11434'; // env só pra teste do fallback
const MODELO = 'qwen3:8b';
const PY = '/home/allan/pncp-etl/pncpvenv/bin/python';
const CENTRAL_DIR = '/home/allan/central-prospeccao';
const FILA_PY = path.join(AQUI, 'servidor', 'fila_prospeccao.py');
const MONTAR_MJS = path.join(AQUI, 'servidor', 'montar-email.mjs');
const UA = 'CampusAllan/1.0 (+creative-lab)';
const TZ = 'America/Sao_Paulo';
const LIMITE_ROBO = 25;
const SAIDA_EXPEDICAO = new Date('2026-10-15T00:00:00-03:00'); // "15 de outubro" (prospeccao.ts, texto aprovado)
const RESERVA_RAM_MB = Number(process.env.CAMPUS_RESERVA_RAM_MB) || 1200; // folga mínima de RAM (env só pra teste)

const HOSTS_OK = new Set([`127.0.0.1:${PORTA}`, `localhost:${PORTA}`, `0.0.0.0:${PORTA}`, 'localhost', '127.0.0.1', 'rain.tailc995b.ts.net', 'rain.tailc995b.ts.net:443']);
const UNIT_RE = /^[a-z0-9][a-z0-9@._-]*\.(service|timer|path)$/;
const INTOCAVEIS_UNITS = new Set(['creative-lab.service', 'prospeccao-robo.timer', 'prospeccao-robo.service']);
const INTOCAVEIS_STACK = new Set(['ollama']);
const HOSTS_REMOTOS = new Set(['allancandido.com', 'previa.allancandido.com', 'jobpago.com.br', 'visiteprado.com.br', '127.0.0.1', 'localhost']);

/* ================================================================ utilidades */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nf = new Intl.NumberFormat('pt-BR');
const fmt = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : nf.format(Math.round(Number(n))));
const plural = (n, um, varios) => `${fmt(n)} ${Number(n) === 1 ? um : varios}`;
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const soma = (arr, f) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);
// campo do corpo JSON como texto: só aceita string (ou número finito); objeto/array/null viram '' (nada de String(obj))
const txt = (v) => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');

function partesData(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return p;
}
const dataCurta = (d) => { if (!d) return '—'; const p = partesData(new Date(d)); return `${p.day}/${p.month}`; };
const horaCurta = (d) => { if (!d) return '—'; const p = partesData(new Date(d)); return `${p.hour}:${p.minute}`; };
const diaSemana = (d) => partesData(new Date(d)).weekday.replace('.', '');
const mesmoDia = (a, b) => { const x = partesData(new Date(a)), y = partesData(new Date(b)); return x.day === y.day && x.month === y.month && x.year === y.year; };
function quando(d) {
  if (!d) return '—';
  const agora = Date.now();
  if (mesmoDia(d, agora)) return `hoje às ${horaCurta(d)}`;
  if (mesmoDia(d, agora - 86400000)) return `ontem às ${horaCurta(d)}`;
  if (new Date(d).getTime() > agora && mesmoDia(d, agora + 86400000)) return `amanhã às ${horaCurta(d)}`;
  return `${diaSemana(d)} ${dataCurta(d)} às ${horaCurta(d)}`;
}
function horaDecimal() { const p = partesData(new Date()); return Number(p.hour) + Number(p.minute) / 60; }
function diasEntre(a, b) { return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000); }

function mascararEmail(e) {
  const m = String(e || '').match(/^([^@\s]{1,64})@([^@\s]+)$/);
  if (!m) return e ? '•••' : '';
  return `${m[1][0]}•••@${m[2]}`;
}
function mascararTelefone(t) {
  const d = String(t || '').replace(/\D/g, '');
  return d.length >= 4 ? `•••${d.slice(-2)}` : (t ? '•••' : '');
}
function mascararTexto(s) {
  return String(s || '')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, (m) => mascararEmail(m))
    .replace(/\+?\d[\d ().-]{7,}\d/g, (m) => mascararTelefone(m));
}
function logErro(onde, e) {
  try { console.error(`[campus] ${onde}:`, mascararTexto(e && e.message ? e.message : String(e)).slice(0, 240)); } catch { /* nada */ }
}

// cache com dedupe de chamada em voo; erro não apaga o último valor bom
const memoMap = new Map();
function memo(chave, ttl, fn) {
  let e = memoMap.get(chave);
  if (!e) { e = {}; memoMap.set(chave, e); }
  if ('valor' in e && Date.now() - e.em < ttl) return Promise.resolve(e.valor);
  if (e.voando) return e.voando;
  const p = Promise.resolve().then(fn).then((v) => { e.valor = v; e.em = Date.now(); return v; }).finally(() => { if (e.voando === p) e.voando = null; });
  e.voando = p;
  return p;
}
// igual ao memo, mas devolve o valor vencido (até maxVelho) na hora e atualiza em segundo plano
function memoSWR(chave, ttl, maxVelho, fn) {
  const e = memoMap.get(chave);
  if (e && 'valor' in e) {
    const idade = Date.now() - e.em;
    if (idade >= ttl && idade < maxVelho) {
      if (!e.voando) memo(chave, 0, fn).catch(() => {});
      return Promise.resolve(e.valor);
    }
  }
  return memo(chave, ttl, fn);
}
function invalidar(...prefixos) { for (const k of memoMap.keys()) if (prefixos.some((p) => k.startsWith(p))) memoMap.delete(k); }

function rodar(cmd, args, { timeout = 5000, cwd, env, input, maxBuffer = 4 * 1024 * 1024 } = {}) {
  return new Promise((resolve) => {
    let filho;
    try {
      filho = execFile(cmd, args, { timeout, cwd, env, maxBuffer, windowsHide: true, killSignal: 'SIGKILL' }, (err, stdout, stderr) => {
        resolve({
          code: err ? (typeof err.code === 'number' ? err.code : -1) : 0,
          stdout: String(stdout || ''), stderr: String(stderr || ''), estourou: !!(err && err.killed),
        });
      });
    } catch (e) {
      resolve({ code: -1, stdout: '', stderr: String(e.message || e), estourou: false });
      return;
    }
    if (filho.stdin) {
      filho.stdin.on('error', () => {});
      if (input != null) filho.stdin.end(input); else filho.stdin.end();
    }
  });
}

async function getJSON(url, { timeout = 4000, headers = {} } = {}) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } });
  if (!r.ok) { r.body?.cancel().catch(() => {}); const e = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
  return r.json();
}
// a Central fica no PC mas lê o Postgres do VPS pelo túnel: no frio a 1ª consulta passa de 4 s.
// O /estado nunca espera mais que 4,5 s; o que chegar depois entra no cache.
const central = (p, timeout = 7000) => getJSON(CENTRAL + p, { timeout });

function segredo(arquivo) {
  try { return fs.readFileSync(path.join(HOME, '.config', arquivo), 'utf8').trim() || null; } catch { return null; }
}
async function adminAC(p, timeout = 4000) {
  const s = segredo('allancandido/admin_secret');
  if (!s) throw new Error('sem a senha do admin no PC');
  return getJSON('https://allancandido.com' + p, { timeout, headers: { 'x-admin-secret': s } });
}

async function memoriaLivreMB() {
  try {
    const t = await fsp.readFile('/proc/meminfo', 'utf8');
    const disp = Number((t.match(/MemAvailable:\s+(\d+)/) || [])[1]);
    const total = Number((t.match(/MemTotal:\s+(\d+)/) || [])[1]);
    return { livre: Math.round(disp / 1024), total: Math.round(total / 1024) };
  } catch { return { livre: null, total: null }; }
}
const gb = (mb) => `${(mb / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} GB`;

/* ================================================================ systemd (argumentos fixos) */

function parseTs(v) {
  if (!v || v === 'n/a' || v === '0') return null;
  if (v.startsWith('@')) { const n = Number(v.slice(1)); return n > 0 ? new Date(n * 1000) : null; }
  const m = v.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?: ([+-]\d{2})(\d{2})?| (UTC))?/);
  if (!m) return null;
  const tz = m[9] ? 'Z' : m[7] ? `${m[7]}:${m[8] || '00'}` : '-03:00';
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${tz}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function showUnits(units, props, { unix = true } = {}) {
  const lista = [...new Set(units)].filter((u) => UNIT_RE.test(u));
  if (!lista.length) return {};
  const args = ['--user', 'show', ...lista, '-p', 'Id', ...props.flatMap((p) => ['-p', p])];
  if (unix) args.push('--timestamp=unix');
  const r = await rodar('systemctl', args, { timeout: 4000 });
  const saida = {};
  for (const bloco of r.stdout.split(/\n\s*\n/)) {
    const o = {};
    for (const linha of bloco.split('\n')) { const i = linha.indexOf('='); if (i > 0) o[linha.slice(0, i)] = linha.slice(i + 1); }
    if (o.Id) saida[o.Id] = o;
  }
  return saida;
}

async function journal(unit, n) {
  if (!UNIT_RE.test(unit)) return [];
  const r = await rodar('journalctl', ['--user', '-u', unit, '-n', String(n), '-o', 'cat', '--no-pager'], { timeout: 4000 });
  return r.stdout.split('\n').filter(Boolean);
}

async function unidadesComFalha() {
  const r = await rodar('systemctl', ['--user', 'list-units', '--failed', '--no-legend', '--plain'], { timeout: 4000 });
  return r.stdout.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((u) => u && UNIT_RE.test(u) && !/^app-.*@autostart\.service$/.test(u));
}

/* ================================================================ roster */

let rosterCache = { mtime: -1, agentes: [], porSlug: new Map(), meta: new Map() };

function extrairUnits(a) {
  const txt = `${a.controle?.servico || ''} ${a.statusCheck?.alvo || ''}`;
  const achadas = [...new Set(txt.match(/\b[a-z0-9][a-z0-9@_-]*\.(?:service|timer|path)\b/g) || [])].filter((u) => UNIT_RE.test(u) && u !== 'creative-lab.service');
  return achadas;
}
function extrairUrl(a) {
  const m = String(a.statusCheck?.alvo || '').match(/https?:\/\/[^\s;,)]+/);
  if (!m) return null;
  try { const u = new URL(m[0]); return HOSTS_REMOTOS.has(u.hostname) ? u.href.replace(/\/$/, u.pathname === '/' ? '' : '/') : null; } catch { return null; }
}
function urlDoSistema(a) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(SISTEMAS, a.slug, 'sistema.json'), 'utf8'));
    if (j && j.url) return j.url;
  } catch { /* sem card */ }
  return a.sistemaJsonProposto?.url || null;
}

function roster() {
  let st;
  try { st = fs.statSync(ROSTER); } catch { return rosterCache; }
  if (st.mtimeMs === rosterCache.mtime) return rosterCache;
  try {
    const d = JSON.parse(fs.readFileSync(ROSTER, 'utf8'));
    const agentes = (Array.isArray(d.agentes) ? d.agentes : []).filter((a) => a && typeof a.slug === 'string' && /^[a-z0-9-]{2,60}$/.test(a.slug));
    const porSlug = new Map(agentes.map((a) => [a.slug, a]));
    const meta = new Map();
    for (const a of agentes) {
      const tipo = a.controle?.tipo || 'nenhum';
      const units = extrairUnits(a);
      const unidade = tipo === 'systemd' ? units.find((u) => u.endsWith('.service')) || null : null;
      const timers = tipo === 'timer' ? units.filter((u) => u.endsWith('.timer')) : [];
      const servicosDosTimers = timers.map((t) => t.replace(/\.timer$/, '.service')).filter((u) => UNIT_RE.test(u));
      meta.set(a.slug, {
        tipo, unidade, timers, servicosDosTimers,
        stackId: tipo === 'docker-proxy' && /^[a-z0-9-]+$/.test(a.controle?.stackControlId || '') ? a.controle.stackControlId : null,
        urlCheck: extrairUrl(a), url: urlDoSistema(a),
      });
    }
    rosterCache = { mtime: st.mtimeMs, agentes, porSlug, meta };
    invalidar('status', 'manchete:');
  } catch (e) { logErro('roster', e); }
  return rosterCache;
}

/* ================================================================ fontes compartilhadas (com cache) */

const httpUltimo = new Map();
function checkHttp(url, { json = false, ttl = 30000 } = {}) {
  return memoSWR(`http:${url}`, ttl, 5 * 60000, async () => {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html,*/*' } });
      let corpo = null;
      if (json) corpo = await r.json().catch(() => null); else r.body?.cancel().catch(() => {});
      const v = { ok: r.ok, status: r.status, ms: Date.now() - t0, corpo, em: Date.now() };
      httpUltimo.set(url, v);
      return v;
    } catch (e) {
      const ant = httpUltimo.get(url);
      if (ant && ant.ok && Date.now() - ant.em < 180000) return { ...ant, velho: true };
      return { ok: false, status: 0, erro: e && e.name === 'TimeoutError' ? 'timeout' : 'rede', ms: Date.now() - t0 };
    }
  });
}
const stackStatus = () => memo('stack', 5000, () => getJSON(`${STACK}/api/status`, { timeout: 4000 }));
const resumo1 = () => memo('central:resumo1', 60000, () => central('/api/resumo?dias=1'));
const rotaCentral = () => memo('central:rota', 600000, () => central('/api/rota'));
const dashLiveRJ = () => memo('dash:RJ', 120000, () => getJSON('https://allancandido.com/api/dashboard-live?uf=RJ', { timeout: 6000 }));
const robosAtivos = () => memo('robos', 5000, () => getJSON(`${LAB}/api/automacoes/ativos`, { timeout: 3000 }));

function nomesAutomacoes() {
  try {
    const d = JSON.parse(fs.readFileSync(AUTOMACOES, 'utf8'));
    const lista = Array.isArray(d) ? d : (d.automacoes || []);
    return new Map(lista.map((x) => [x.id, x.nome || x.titulo || x.id]));
  } catch { return new Map(); }
}

/* ================================================================ status das agentes */

const STATUS_TEXTO = {
  acordada: 'acordada (serviço ligado)', dormindo: 'dormindo (serviço desligado)', remota: 'no ar, rodando no VPS',
  'com-problema': 'com problema', 'sem-corpo': 'sem corpo (precisa ser reconstruída)', desconhecido: 'sem notícia agora',
};

function calcularStatus() {
  return memo('status', 5000, async () => {
    const { agentes, meta } = roster();
    const units = [];
    for (const a of agentes) { const m = meta.get(a.slug); if (m.unidade) units.push(m.unidade); units.push(...m.timers, ...m.servicosDosTimers); }
    const urls = [...new Set(agentes.map((a) => meta.get(a.slug)).filter((m) => (m.tipo === 'remoto' || m.tipo === 'nenhum') && m.urlCheck && !m.urlCheck.includes(':3009')).map((m) => m.urlCheck))];
    const [show, stack, robos, ...checks] = await Promise.all([
      showUnits(units, ['LoadState', 'ActiveState', 'SubState', 'UnitFileState', 'Result', 'MemoryCurrent', 'ExecMainExitTimestamp', 'ExecMainStartTimestamp']).catch(() => ({})),
      stackStatus().catch(() => null),
      robosAtivos().catch(() => null),
      ...urls.map((u) => checkHttp(u, { json: u.startsWith('http://127.0.0.1') })),
    ]);
    const http = new Map(urls.map((u, i) => [u, checks[i]]));
    const saida = new Map();
    for (const a of agentes) saida.set(a.slug, statusDe(a, meta.get(a.slug), { show, stack, http, robos }));
    return saida;
  });
}

function statusDe(a, m, { show, stack, http, robos }) {
  const base = { status: 'desconhecido', motivo: null, podeLigar: false, ramMB: Number(a.ramMB) || 0, trabalhandoFixo: false };
  if (a.slug === 'prospeccao-robo') {
    const t = show['prospeccao-robo.timer'] || {};
    const ligado = t.UnitFileState === 'enabled' && t.ActiveState === 'active';
    return { ...base, status: ligado ? 'acordada' : 'dormindo', motivo: ligado ? 'robô de e-mail ligado (pelo Claude)' : 'esperando seu ok — peça no Claude: liga o robô', podeLigar: false, trabalhandoFixo: ligado };
  }
  switch (m.tipo) {
    case 'systemd': {
      const u = show[m.unidade];
      if (!m.unidade || !u) return { ...base, motivo: 'não consegui ler o systemd' };
      if (u.LoadState === 'not-found') return { ...base, status: 'sem-corpo', motivo: 'o serviço não existe mais neste PC' };
      const mem = Number(u.MemoryCurrent);
      const ramMB = Number.isFinite(mem) && mem > 0 ? Math.round(mem / 1048576) : base.ramMB;
      const pode = !INTOCAVEIS_UNITS.has(m.unidade);
      if (u.ActiveState === 'active' || u.ActiveState === 'reloading') return { ...base, status: 'acordada', podeLigar: pode, ramMB };
      if (u.ActiveState === 'activating') return { ...base, status: 'acordada', motivo: 'acordando…', podeLigar: pode, ramMB };
      if (u.ActiveState === 'failed') return { ...base, status: 'com-problema', motivo: `o serviço caiu (${u.Result || 'falha'}) — dá pra tentar acordar de novo`, podeLigar: pode };
      return { ...base, status: 'dormindo', podeLigar: pode };
    }
    case 'timer': {
      const ts = m.timers.map((t) => show[t]).filter(Boolean);
      if (!ts.length || ts.some((t) => t.LoadState === 'not-found')) return { ...base, motivo: 'não achei o timer no systemd' };
      const falhos = m.servicosDosTimers.filter((s) => show[s]?.ActiveState === 'failed');
      if (falhos.length) {
        const s = show[falhos[0]];
        return { ...base, status: 'com-problema', motivo: `a última rodada de ${falhos[0].replace(/\.service$/, '')} falhou (${quando(parseTs(s.ExecMainExitTimestamp))})`, trabalhandoFixo: false };
      }
      // oneshot rodando = activating; simple rodando = active/running (active/exited de RemainAfterExit não conta)
      const rodando = m.servicosDosTimers.find((s) => show[s]?.ActiveState === 'activating' || (show[s]?.ActiveState === 'active' && show[s]?.SubState === 'running'));
      if (rodando) {
        const ini = parseTs(show[rodando].ExecMainStartTimestamp);
        return { ...base, status: 'acordada', motivo: `rodando ${rodando.replace(/\.service$/, '')} agora${ini ? ` (começou ${quando(ini)})` : ''}`, trabalhandoFixo: true };
      }
      if (ts.every((t) => t.ActiveState === 'active')) return { ...base, status: 'acordada', motivo: 'quem marca o horário é o systemd', trabalhandoFixo: true };
      return { ...base, status: 'dormindo', motivo: 'timer desligado no systemd' };
    }
    case 'remoto': {
      const h = http.get(m.urlCheck);
      if (!h) return { ...base, motivo: 'sem endereço pra conferir' };
      if (h.ok) return { ...base, status: 'remota', trabalhandoFixo: true };
      if (h.status) return { ...base, status: 'com-problema', motivo: `o site respondeu ${h.status}` };
      return { ...base, motivo: h.erro === 'timeout' ? 'não respondeu em 4 s' : 'sem rede até o site' };
    }
    case 'docker-proxy': {
      const s = stack?.stacks?.find((x) => x.id === m.stackId);
      if (!stack) return { ...base, motivo: 'o painel do Docker não respondeu' };
      if (!s || s.state === 'missing') return { ...base, status: 'sem-corpo', motivo: 'preciso ser reconstruída: meus containers não existem no Docker' };
      const pode = !INTOCAVEIS_STACK.has(m.stackId);
      if (s.state === 'on') return { ...base, status: 'acordada', podeLigar: pode, ramMB: Number(s.ram) || base.ramMB };
      return { ...base, status: 'dormindo', podeLigar: pode };
    }
    case 'nenhum': {
      if (m.urlCheck && m.urlCheck.includes(':3009')) {
        return stack ? { ...base, status: 'acordada', trabalhandoFixo: true } : { ...base, status: 'com-problema', motivo: 'o painel do Docker não respondeu' };
      }
      const h = m.urlCheck ? http.get(m.urlCheck) : null;
      if (!h) return { ...base, motivo: 'sem endereço pra conferir' };
      if (h.ok && h.corpo && h.corpo.ok === true && h.corpo.ollama === false) return { ...base, status: 'com-problema', motivo: 'a ponte está no ar, mas sem o Ollama' };
      if (h.ok) return { ...base, status: 'acordada' };
      return { ...base, status: 'com-problema', motivo: h.status ? `respondeu ${h.status}` : 'não respondeu' };
    }
    case 'sob-demanda': {
      const n = robos && typeof robos === 'object' ? Object.keys(robos).length : 0;
      return { ...base, status: 'acordada', motivo: n ? null : 'só trabalho quando você dispara um robô', ramMB: n ? base.ramMB : 0, trabalhandoFixo: n > 0 };
    }
    default:
      return base;
  }
}

/* ================================================================ manchetes (leitura real, nunca inventa) */

const SITE_CURTO = { allancandido: 'AC', jobpago: 'JobPago', visiteprado: 'VP' };
const leadsTxt = (n) => (Number(n) === 0 ? 'nenhum lead ainda' : plural(n, 'lead', 'leads'));
const siteDo = (r, s) => (r.sites || []).find((x) => x.site === s) || null;

async function pedidosSofia() {
  const base = '/home/allan/sofia-bot/data/em-andamento';
  let dirs = [];
  try { dirs = (await fsp.readdir(base, { withFileTypes: true })).filter((d) => d.isDirectory()).slice(0, 20); } catch { return []; }
  const out = [];
  for (const d of dirs) {
    try {
      const p = JSON.parse(await fsp.readFile(path.join(base, d.name, 'pedido.json'), 'utf8'));
      out.push({
        modo: p.modo || 'imovel', fotos: Array.isArray(p.fotos) ? p.fotos.length : 0, textos: Array.isArray(p.textos) ? p.textos.length : 0,
        criadoEm: p.criadoEm ? new Date(p.criadoEm) : null, gps: !!(p.localizacao && p.localizacao.lat != null),
      });
    } catch { /* pedido ilegível: ignora */ }
  }
  return out.sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
}

const NOME_TABELA = { sancoes: 'sanções', score_municipios: 'score dos municípios', naturezas: 'naturezas', placas_campo: 'placas de campo' };
async function brainAlertas() {
  const t = await fsp.readFile('/home/allan/brain-dados/Brain allancandido.md', 'utf8');
  const gerado = (t.match(/Gerado em (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/) || [])[1] || null;
  const bloco = (t.split('## Alertas')[1] || '').split('\n## ')[0];
  const paradas = [], vazias = [];
  for (const l of bloco.split('\n')) {
    const tab = (l.match(/\[\[([^\]]+?)\s*\(tabela\)\]\]/) || [])[1];
    if (!tab) continue;
    const dias = (l.match(/há (\d+) dias/) || [])[1];
    if (l.includes('⚠️') && dias) paradas.push({ tabela: tab, nome: NOME_TABELA[tab] || tab.replace(/_/g, ' '), dias: Number(dias) });
    else if (/vazia/.test(l)) vazias.push(NOME_TABELA[tab] || tab.replace(/_/g, ' '));
  }
  return { gerado, paradas, vazias };
}

const PASTAS_VIDEO = [HOME, path.join(HOME, 'Desktop'), path.join(HOME, 'Videos')];
const EXT_VIDEO = ['.mkv', '.mp4', '.mov', '.webm', '.avi'];
async function videosEsperando() {
  const out = [];
  for (const pasta of PASTAS_VIDEO) {
    let nomes = [];
    try { nomes = await fsp.readdir(pasta); } catch { continue; }
    for (const n of nomes) {
      if (!EXT_VIDEO.some((e) => n.toLowerCase().endsWith(e))) continue;
      try { const st = await fsp.stat(path.join(pasta, n)); if (st.isFile()) out.push({ nome: n, pasta: pasta === HOME ? 'Home' : path.basename(pasta), mb: Math.round(st.size / 1e6) }); } catch { /* sumiu */ }
    }
  }
  return out.sort((a, b) => b.mb - a.mb);
}
async function ultimaTranscricao() {
  const dir = '/home/allan/n8n-ollama/transcricao-video/saida';
  let melhor = null;
  try {
    for (const n of await fsp.readdir(dir)) {
      if (!n.endsWith('.md')) continue;
      const st = await fsp.stat(path.join(dir, n));
      if (!melhor || st.mtimeMs > melhor.mtimeMs) melhor = { nome: n, mtimeMs: st.mtimeMs };
    }
  } catch { return null; }
  return melhor ? new Date(melhor.mtimeMs) : null;
}

async function falhaLeiloesBancos() {
  const linhas = await journal('leiloes-privados.service', 30);
  let ini = 0;
  linhas.forEach((l, i) => { if (/^Starting leiloes-privados/.test(l)) ini = i; });
  const falhas = [];
  for (const l of linhas.slice(ini)) {
    const m = l.match(/✗\s*([a-zà-ú]+) falhou(?::\s*(.*))?/i);
    if (m) falhas.push({ banco: nomeBanco(m[1]), motivo: ((m[2] || '').match(/\b(\d{3})\b/) || [])[1] || 'erro' });
  }
  const ok = [];
  for (const l of linhas.slice(ini)) { const m = l.match(/^\s*([a-zà-ú]+): (\d+) de (\d+)/i); if (m) ok.push({ banco: nomeBanco(m[1]), n: Number(m[2]), de: Number(m[3]) }); }
  return { falhas, ok };
}

const BANCO = { bradesco: 'Bradesco', santander: 'Santander', itau: 'Itaú', 'itaú': 'Itaú' };
const nomeBanco = (b) => BANCO[String(b).toLowerCase()] || String(b)[0].toUpperCase() + String(b).slice(1);

const MANCHETES = {
  async 'central-prospeccao'() {
    const r = await resumo1();
    const s = r.sites || [];
    const vis = soma(s, (x) => x.visitantes), cli = soma(s, (x) => x.cliques), leads = soma(s, (x) => x.leads);
    if (vis === 0 && leads === 0) return { texto: 'Últimas 24h: placar zerado — nenhum visitante ainda, bora virar', atividade: false };
    const por = s.filter((x) => Number(x.visitantes) > 0).map((x) => `${SITE_CURTO[x.site] || x.site} ${fmt(x.visitantes)}`).join(' · ');
    return { texto: `Últimas 24h: ${plural(vis, 'visitante', 'visitantes')}${por ? ` (${por})` : ''}, ${plural(cli, 'clique', 'cliques')}, ${leadsTxt(leads)}`, atividade: true };
  },
  async 'prospeccao-robo'() {
    const [rob, funil, rota] = await Promise.all([estadoRobo(), central('/api/prospects/funil'), rotaCentral()]);
    const contatados = soma(funil.filter((x) => x.status !== 'a contatar'), (x) => x.n);
    const dias = diasEntre(Date.now(), SAIDA_EXPEDICAO) + 1;
    const partes = [
      rob.habilitado ? `Robô ligado · ${rob.enviadosHoje}/${LIMITE_ROBO} hoje` : 'Robô desligado esperando seu ok',
      contatados === 0 ? 'nenhum negócio contatado ainda' : plural(contatados, 'negócio contatado', 'negócios contatados'),
      `roteiro com ${fmt(rota.paradas.length)} paradas e ${fmt(rota.cidades.length)} cidades`,
    ];
    if (dias > 0) partes.push(`Expedição sai em ${plural(dias, 'dia', 'dias')}`);
    return { texto: partes.join(' · '), atividade: !!rob.habilitado };
  },
  async 'atendimento-lead'() {
    const [chat, leads] = await Promise.all([checkHttp('https://allancandido.com/api/chat', { json: true }), central('/api/leads?dias=1')]);
    const resp = chat.ok && chat.corpo && chat.corpo.respostas === true;
    const n = leads.filter((l) => l.segmento === 'chat').length;
    return {
      texto: `${resp ? 'Chat respondendo nos 3 sites' : 'Chat sem IA agora — o site manda o visitante pro WhatsApp'} · ${n === 0 ? 'nenhum contato novo pelo chat em 24h' : plural(n, 'contato novo pelo chat em 24h', 'contatos novos pelo chat em 24h')}`,
      atividade: resp,
    };
  },
  async 'sofia-bot'() {
    const ps = await pedidosSofia();
    if (!ps.length) return { texto: 'Nenhum anúncio parado esperando você — manda as fotos no Telegram quando tiver imóvel novo', atividade: false };
    const p = ps[0];
    const cab = ps.length === 1 ? 'Tem 1 imóvel esperando' : `Tem ${fmt(ps.length)} anúncios esperando`;
    return { texto: `${cab} desde ${dataCurta(p.criadoEm)}: ${plural(p.fotos, 'foto', 'fotos')}${p.gps ? ' com GPS' : ''}, ${p.textos === 0 ? 'falta o texto e o /pronto' : 'falta o /pronto e o Publicar'}`, atividade: true };
  },
  async 'motor-sites'() {
    const [noar, cad] = await Promise.all([
      checkHttp('https://previa.allancandido.com'),
      memo('ac:cadastur:RJ', 600000, () => adminAC('/api/admin/cadastur?uf=RJ&pagina=1')).catch(() => null),
    ]);
    const partes = [noar.ok ? 'Motor no ar' : `Motor sem resposta${noar.status ? ` (${noar.status})` : ''}`];
    if (cad && Number(cad.total) > 0) partes.push(`${fmt(cad.total)} negócios de turismo no RJ sem site pra oferecer`);
    return { texto: partes.join(' · '), atividade: noar.ok };
  },
  async 'avisos-leilao'() {
    const [dl, show, falha] = await Promise.all([
      dashLiveRJ().catch(() => null),
      showUnits(['leiloes-privados.service'], ['ActiveState', 'ExecMainExitTimestamp']),
      falhaLeiloesBancos().catch(() => ({ falhas: [] })),
    ]);
    const partes = [];
    const rj = dl?.por_uf?.find((x) => x.uf === 'RJ');
    if (rj) partes.push(`RJ: ${fmt(rj.leiloes_caixa)} leilões da Caixa (+${fmt(rj.vendas_caixa)} vendas), ${fmt(rj.leiloes_privados)} de bancos privados, ${fmt(rj.leiloes_judiciais)} judiciais, ${fmt(rj.leiloes_bb)} do BB`);
    const s = show['leiloes-privados.service'];
    if (s && s.ActiveState === 'activating') partes.push('coleta dos bancos rodando agora');
    else if (s && s.ActiveState === 'failed') {
      const q = quando(parseTs(s.ExecMainExitTimestamp));
      partes.push(falha.falhas.length ? `${falha.falhas.map((f) => `${f.banco} falhou (${f.motivo})`).join(', ')} ${q}` : `a coleta dos bancos falhou ${q}`);
    }
    if (!partes.length) return null;
    return { texto: partes.join(' · '), atividade: true };
  },
  async 'painel-pncp-cnpj'() {
    const b = await brainAlertas();
    if (!b.paradas.length) return { texto: `Nenhuma carga agendada parada no banco${b.gerado ? ` (conferi ${dataCurta(b.gerado.replace(' ', 'T') + ':00-03:00')})` : ''}`, atividade: true };
    const n = b.paradas.length;
    return { texto: `${n === 1 ? '1 carga parada' : `${fmt(n)} cargas paradas`}: ${b.paradas.map((p) => `${p.nome} há ${fmt(p.dias)} dias`).join(' e ')} (o cron roda e não carrega)`, atividade: true };
  },
  async 'mercado-imobiliario'() {
    const [stats, timers, jr] = await Promise.all([
      memo('ac:leads-stats', 600000, () => adminAC('/api/admin/leads?stats=1')).catch(() => null),
      showUnits(['portais-imob.timer'], ['NextElapseUSecRealtime']),
      journal('cnpj-imob.service', 6).catch(() => []),
    ]);
    const partes = [];
    if (Array.isArray(stats) && stats.length) {
      const total = soma(stats, (x) => x.total), novos = soma(stats, (x) => x.novos);
      partes.push(`${fmt(total)} imobiliárias no radar em ${fmt(stats.length)} cidades, ${novos === 0 ? 'nenhuma nova' : plural(novos, 'nova', 'novas')}`);
    } else if (jr.some((l) => /já processada/.test(l))) {
      partes.push('a Receita não publicou CNPJ novo desde a última pasta');
    }
    const prox = parseTs(timers['portais-imob.timer']?.NextElapseUSecRealtime);
    if (prox) partes.push(`próxima coleta OLX/Zap ${diaSemana(prox)} ${dataCurta(prox)}`);
    return partes.length ? { texto: partes.join(' · '), atividade: true } : null;
  },
  async 'jobpago'() {
    const [r, refugios, contrib, meta] = await Promise.all([
      resumo1(), central('/api/refugios').catch(() => null), central('/api/contribuicoes').catch(() => null), central('/api/meta').catch(() => null),
    ]);
    const s = siteDo(r, 'jobpago');
    const partes = [];
    if (s) partes.push(`JobPago 24h: ${plural(s.visitantes, 'visitante', 'visitantes')}${Number(s.novos) ? ` (${fmt(s.novos)} ${Number(s.novos) === 1 ? 'novo' : 'novos'})` : ''}, ${leadsTxt(s.leads)}`);
    if (Array.isArray(refugios) && Array.isArray(contrib)) {
      const cand = refugios.filter((x) => x.status === 'candidato').length, pend = contrib.length;
      if (cand + pend === 0) partes.push('nada esperando sua aprovação');
      else partes.push([cand && plural(cand, 'lugar pra dormir', 'lugares pra dormir'), pend && plural(pend, 'contribuição', 'contribuições')].filter(Boolean).join(' e ') + ' esperando você');
    }
    const m0 = Array.isArray(meta) ? meta.find((x) => x.site === 'jobpago') : null;
    if (m0) partes.push(`agente da Meta: último número em ${m0.dia.slice(8, 10)}/${m0.dia.slice(5, 7)}`);
    return partes.length ? { texto: partes.join(' · '), atividade: true } : null;
  },
  async 'allancandido-site'() {
    const [props, r] = await Promise.all([memo('ac:properties', 600000, () => adminAC('/api/admin/properties')).catch(() => null), resumo1()]);
    const s = siteDo(r, 'allancandido');
    const partes = [];
    if (Array.isArray(props)) partes.push(props.length === 1 ? 'Só 1 imóvel no site' : `${fmt(props.length)} imóveis no site`);
    if (s) partes.push(`24h: ${plural(s.visitantes, 'visitante', 'visitantes')}, ${plural(s.cliques, 'clique', 'cliques')}${Number(s.passo_abriu) ? `, ${fmt(s.passo_abriu)} abriu o WhatsApp` : ''}, ${leadsTxt(s.leads)}`);
    return partes.length ? { texto: partes.join(' · '), atividade: true } : null;
  },
  async 'visiteprado'() {
    const s = siteDo(await resumo1(), 'visiteprado');
    if (!s) return null;
    return { texto: `Visite Prado 24h: ${plural(s.visitantes, 'visitante', 'visitantes')}${Number(s.novos) ? ` (${fmt(s.novos)} ${Number(s.novos) === 1 ? 'novo' : 'novos'})` : ''}, ${leadsTxt(s.leads)}`, atividade: true };
  },
  async 'link-checker'(st) {
    if (st.status !== 'acordada') return null;
    const h = await checkHttp('http://127.0.0.1:3014/healthz', { ttl: 15000 });
    return h.ok ? { texto: 'Pronta pra varrer qualquer site — me passa a URL', atividade: false } : null;
  },
  async 'whatsapp-rag-jarvis'() {
    const s = await stackStatus();
    const ids = { whatsapp: 'WhatsApp RAG', qdrant: 'Qdrant', kokoro: 'Kokoro' };
    const faltam = Object.entries(ids).filter(([id]) => (s.stacks.find((x) => x.id === id) || { state: 'missing' }).state === 'missing').map(([, n]) => n);
    const wa = s.stacks.find((x) => x.id === 'whatsapp');
    if (faltam.length) return { texto: `Estou sem corpo: ${faltam.join(faltam.length > 2 ? ', ' : ' e ').replace(/, ([^,]+)$/, ' e $1')} não ${faltam.length === 1 ? 'existe' : 'existem'} no Docker — precisa reconstruir`, atividade: false };
    if (wa && wa.state === 'on') return { texto: 'WhatsApp RAG no ar — pode perguntar das suas conversas', atividade: true };
    return { texto: 'Desligada — me acorda quando quiser buscar nas suas conversas', atividade: false };
  },
  async 'offline-brain'() {
    const j = JSON.parse(await fsp.readFile(path.join(HOME, '.offline-brain', 'meta.json'), 'utf8'));
    if (!j.updated) return null;
    const d = new Date(Number(j.updated) * 1000);
    const dias = diasEntre(d, Date.now());
    return { texto: dias > 7 ? `Meu índice é de ${dataCurta(d)} — as notas dos últimos ${fmt(dias)} dias ainda não estão comigo` : `Índice do vault em dia (de ${dataCurta(d)})`, atividade: false };
  },
  async 'transcricao-video'(st) {
    const [v, ult] = await Promise.all([videosEsperando(), ultimaTranscricao()]);
    const partes = [v.length === 0 ? 'Nenhum vídeo esperando transcrição' : `${plural(v.length, 'vídeo esperando', 'vídeos esperando')} transcrição`];
    if (ult) partes.push(`a última foi em ${dataCurta(ult)}`);
    return { texto: partes.join('; '), atividade: st.status === 'acordada' && v.length > 0 };
  },
  async 'olho-do-investidor'(st) {
    return st.status === 'acordada' ? { texto: 'Globo no ar no PC (localhost:4180) — abre na tela grande', atividade: true } : null;
  },
  async 'holo-gestures'(st) {
    return st.status === 'acordada' ? { texto: 'HOLO no ar no PC (localhost:4890) — é só abrir com a webcam', atividade: true } : null;
  },
  async 'controle-de-servicos'() {
    const [s, mem, falhas, bk, tun] = await Promise.all([
      stackStatus().catch(() => null), memoriaLivreMB(), unidadesComFalha(),
      showUnits(['postgres-backup-pull.service'], ['Result', 'ExecMainExitTimestamp']),
      showUnits(['pncp-tunnel.service'], ['ActiveState']),
    ]);
    const partes = [];
    if (mem.livre != null) partes.push(`RAM livre ${gb(mem.livre)} de ${gb(mem.total)}`);
    if (s) { const on = s.stacks.filter((x) => x.state === 'on').map((x) => x.name); partes.push(on.length ? `ligados: ${on.join(', ')}` : 'nenhum grupo Docker ligado'); }
    partes.push(falhas.length === 0 ? 'nenhum robô com falha' : `${plural(falhas.length, 'robô com falha', 'robôs com falha')}: ${falhas.map((u) => u.replace(/\.(service|timer)$/, '')).join(', ')}`);
    const b = bk['postgres-backup-pull.service'];
    if (b) { const d = parseTs(b.ExecMainExitTimestamp); partes.push(b.Result === 'success' && d ? `backup ${mesmoDia(d, Date.now()) ? `de hoje ${horaCurta(d)}` : `de ${dataCurta(d)}`} ok` : 'backup com problema'); }
    const t = tun['pncp-tunnel.service'];
    if (t) partes.push(t.ActiveState === 'active' ? 'túnel do banco ok' : 'túnel do banco caído');
    return { texto: partes.join(' · '), atividade: true };
  },
  async 'robos-navegador'() {
    const a = await robosAtivos();
    const ids = Object.keys(a || {});
    if (!ids.length) return { texto: 'Nenhum robô rodando agora', atividade: false };
    const nomes = nomesAutomacoes();
    return { texto: `Rodando agora: ${ids.map((i) => nomes.get(i) || i).join(', ')}`, atividade: true };
  },
};

const mancheteBoa = new Map(); // slug -> {valor, em, status}
const avisoFalha = new Map(); // slug -> última vez que logou (no máx. 1 linha a cada 10 min)
function manchete(slug, st) {
  const fn = MANCHETES[slug];
  if (!fn) return Promise.resolve(null);
  const chave = `manchete:${slug}:${st.status}`;
  return memoSWR(chave, 60000, 30 * 60000, async () => {
    try {
      const v = await fn(st);
      if (v && v.texto) mancheteBoa.set(slug, { valor: v, em: Date.now(), status: st.status });
      return v || null;
    } catch (e) {
      if (Date.now() - (avisoFalha.get(slug) || 0) > 600000) { avisoFalha.set(slug, Date.now()); logErro(`manchete ${slug}`, e); }
      const ant = mancheteBoa.get(slug);
      if (ant && ant.status === st.status && Date.now() - ant.em < 30 * 60000) return ant.valor;
      throw e; // sem valor bom: não guarda o erro no cache, tenta de novo no próximo /estado
    }
  });
}

/* ================================================================ capacidades (tabela explícita, só leitura) */

async function estadoServico(unit, nome) {
  const s = (await showUnits([unit], ['ActiveState', 'SubState', 'UnitFileState', 'ActiveEnterTimestamp', 'MemoryCurrent', 'NRestarts', 'Result', 'ExecMainExitTimestamp']))[unit];
  if (!s || s.LoadState === 'not-found') return { titulo: nome, texto: 'Não achei esse serviço no systemd.' };
  const ativo = s.ActiveState === 'active';
  const mem = Number(s.MemoryCurrent);
  const itens = [
    { rotulo: 'Estado', valor: ativo ? 'ligado' : s.ActiveState === 'failed' ? `caiu (${s.Result})` : 'desligado' },
    { rotulo: ativo ? 'Ligado desde' : 'Última parada', valor: quando(parseTs(ativo ? s.ActiveEnterTimestamp : s.ExecMainExitTimestamp)) },
    { rotulo: 'Memória agora', valor: ativo && Number.isFinite(mem) ? `${fmt(mem / 1048576)} MB` : '—' },
    { rotulo: 'Liga sozinho no boot', valor: s.UnitFileState === 'enabled' ? 'sim' : 'não' },
  ];
  return { titulo: nome, texto: ativo ? 'Tô de pé e rodando.' : 'Tô dormindo agora — dá pra me acordar pelo botão.', itens };
}

const visitasSite = (site, titulo) => async () => {
  const r = await central('/api/resumo?dias=1', 8000);
  const s = siteDo(r, site);
  if (!s) return { titulo, texto: 'A Central não trouxe esse site.' };
  return {
    titulo, texto: Number(s.visitantes) ? `${plural(s.visitantes, 'visitante', 'visitantes')} nas últimas 24h (sem contar você).` : 'Ninguém passou nas últimas 24h (sem contar você).',
    itens: [
      { rotulo: 'Visitantes', valor: `${fmt(s.visitantes)} (${plural(s.novos, 'novo', 'novos')})` }, { rotulo: 'Páginas vistas', valor: fmt(s.paginas) },
      { rotulo: 'Tempo médio', valor: s.tempo_medio_s != null ? `${fmt(s.tempo_medio_s)} s` : '—' }, { rotulo: 'Rolagem média', valor: s.rolagem_media != null ? `${fmt(s.rolagem_media)}%` : '—' },
      { rotulo: 'Cliques', valor: fmt(s.cliques) }, { rotulo: 'Abriram o WhatsApp', valor: fmt(s.passo_abriu) }, { rotulo: 'Leads', valor: fmt(s.leads) },
    ],
  };
};
const noAr = (url, titulo) => async () => {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': UA } });
    r.body?.cancel().catch(() => {});
    return { titulo, texto: r.ok ? `No ar: respondeu ${r.status} em ${fmt(Date.now() - t0)} ms.` : `Opa, respondeu ${r.status}.`, itens: [{ rotulo: 'Endereço', valor: url.replace('https://', '') }, { rotulo: 'Resposta', valor: `${r.status} · ${fmt(Date.now() - t0)} ms` }] };
  } catch (e) {
    return { titulo, texto: e.name === 'TimeoutError' ? 'Não respondeu em 8 s.' : 'Não consegui chegar no site (rede?).' };
  }
};
async function acaoRota() {
  const r = await central('/api/rota', 8000);
  return {
    titulo: 'Roteiro da Expedição', texto: `${plural(r.paradas.length, 'parada', 'paradas')} e ${plural(r.cidades.length, 'cidade', 'cidades')} no caminho Paraty → Fortaleza.`,
    itens: r.paradas.slice(0, 15).map((p, i) => ({ rotulo: `Parada ${i + 1}`, valor: `${p.nome} · ${p.uf}` })),
  };
}

const ACOES = {
  'central-prospeccao': {
    'visitas-ontem': {
      rotulo: 'Como foram as visitas ontem?', descricao: 'Visitantes, cliques e leads dos 3 sites nas últimas 24h.', palavras: ['visita', 'visitante', 'ontem', 'placar', 'acesso', 'movimento', 'site'],
      async fn() {
        const r = await central('/api/resumo?dias=1', 8000);
        const s = r.sites || [];
        return {
          titulo: 'Placar das últimas 24h', texto: `${plural(soma(s, (x) => x.visitantes), 'visitante', 'visitantes')} e ${leadsTxt(soma(s, (x) => x.leads))} (sem contar você).`,
          itens: s.map((x) => ({ rotulo: x.site, valor: `${plural(x.visitantes, 'visitante', 'visitantes')} · ${plural(x.cliques, 'clique', 'cliques')} · ${plural(x.leads, 'lead', 'leads')}` })),
        };
      },
    },
    leads: {
      rotulo: 'Tem lead novo?', descricao: 'Leads com código dos últimos 7 dias (contato mascarado).', palavras: ['lead', 'contato', 'cliente', 'novo', 'codigo'],
      async fn() {
        const l = await central('/api/leads?dias=7', 8000);
        if (!l.length) return { titulo: 'Leads (7 dias)', texto: 'Nenhum lead nos últimos 7 dias. Placar zerado, mas o jogo tá rolando.' };
        return {
          titulo: 'Leads (7 dias)', texto: `${plural(l.length, 'lead', 'leads')} na semana.`,
          itens: l.slice(0, 10).map((x) => ({ rotulo: `${x.codigo || '—'} · ${x.site} · ${x.quando}`, valor: `${(x.nome || '').split(/\s+/)[0] || 'sem nome'} · ${x.segmento || '—'} · ${x.status} · ${mascararTexto(x.contato || '')}` })),
        };
      },
    },
    funil: {
      rotulo: 'Funil até o WhatsApp', descricao: 'Sessões → clicaram → quiseram contato → viraram lead (7 dias).', palavras: ['funil', 'whatsapp', 'conversao', 'sessao'],
      async fn() {
        const f = await central('/api/funil?dias=7', 8000);
        return { titulo: 'Funil (7 dias)', texto: 'Do clique ao lead, site por site.', itens: f.map((x) => ({ rotulo: x.site, valor: `${plural(x.sessoes, 'sessão', 'sessões')} → ${fmt(x.clicaram)} clicaram → ${fmt(x.quiseram_contato)} quiseram contato → ${plural(x.viraram_lead, 'lead', 'leads')}` })) };
      },
    },
    origens: {
      rotulo: 'De onde vem o público?', descricao: 'Origem das sessões por site (7 dias).', palavras: ['origem', 'google', 'instagram', 'utm', 'publico', 'vem', 'trafego'],
      async fn() {
        const o = await central('/api/origens?dias=7', 8000);
        if (!o.length) return { titulo: 'Origens (7 dias)', texto: 'Nenhuma sessão registrada na semana.' };
        return { titulo: 'Origens (7 dias)', texto: `${plural(soma(o, (x) => x.sessoes), 'sessão', 'sessões')} na semana.`, itens: o.slice(0, 10).map((x) => ({ rotulo: `${x.site} · ${x.origem}`, valor: plural(x.sessoes, 'sessão', 'sessões') })) };
      },
    },
  },
  'prospeccao-robo': {
    robo: {
      rotulo: 'Como tá o robô de e-mail?', descricao: 'Se o timer está ligado, quantos saíram hoje (limite 25) e o próximo disparo.', palavras: ['robo', 'email', 'timer', 'ligado', 'enviado', 'hoje'],
      async fn() {
        const r = await estadoRobo();
        return {
          titulo: 'Robô de e-mail', texto: r.habilitado ? `Ligado: ${r.enviadosHoje}/${LIMITE_ROBO} hoje.` : `Desligado de propósito, esperando seu ok (peça no Claude: liga o robô). ${r.enviadosHoje}/${LIMITE_ROBO} hoje.`,
          itens: [
            { rotulo: 'Timer', valor: `${r.unitFileState} · ${r.activeState}` }, { rotulo: 'Próximo disparo', valor: r.proximo ? quando(r.proximo) : 'nenhum' },
            { rotulo: 'Último envio', valor: r.ultimoEnvio ? `${r.ultimoEnvio.dia}: ${r.ultimoEnvio.enviados} de ${r.ultimoEnvio.candidatos}` : 'nunca rodou de verdade' },
          ],
        };
      },
    },
    contatados: {
      rotulo: 'Quantos já contatei?', descricao: 'Negócios por status na Central (a contatar, contatado, respondeu…).', palavras: ['contatado', 'contatei', 'respondeu', 'status', 'quantos'],
      async fn() {
        const f = await central('/api/prospects/funil', 8000);
        if (!f.length) return { titulo: 'Contatos registrados', texto: 'Nenhum negócio marcado na Central ainda — a fila tá zerada de histórico.' };
        return { titulo: 'Contatos registrados', texto: `${plural(soma(f, (x) => x.n), 'negócio marcado', 'negócios marcados')} na Central.`, itens: f.map((x) => ({ rotulo: x.status, valor: fmt(x.n) })) };
      },
    },
    roteiro: { rotulo: 'Qual é o roteiro?', descricao: 'Paradas e cidades da Expedição Paraty → Fortaleza.', palavras: ['roteiro', 'rota', 'cidade', 'parada', 'expedicao'], fn: acaoRota },
  },
  'atendimento-lead': {
    'estou-respondendo': {
      rotulo: 'O chat tá respondendo?', descricao: 'Confere de ponta a ponta se o chat dos sites tem IA agora.', palavras: ['chat', 'respondendo', 'funciona', 'ia', 'site'],
      async fn() {
        const r = await getJSON('https://allancandido.com/api/chat', { timeout: 8000 });
        return { titulo: 'Chat dos 3 sites', texto: r.respostas ? 'Respondendo com IA de ponta a ponta.' : 'Sem IA agora — o widget manda o visitante pro WhatsApp.' };
      },
    },
    'saude-ponte': {
      rotulo: 'A ponte pro Ollama tá de pé?', descricao: 'A ponte local (chat-ponte) e o Ollama do PC.', palavras: ['ponte', 'ollama', 'saude', 'local'],
      async fn() {
        const r = await getJSON('http://127.0.0.1:80/saude', { timeout: 8000 });
        return { titulo: 'Ponte do chat', texto: r.ok ? (r.ollama ? 'Ponte no ar e o Ollama respondendo.' : 'Ponte no ar, mas o Ollama não respondeu.') : 'A ponte respondeu com problema.', itens: [{ rotulo: 'Ponte', valor: r.ok ? 'ok' : 'falhou' }, { rotulo: 'Ollama', valor: r.ollama ? 'ok' : 'fora' }] };
      },
    },
    'leads-chat': {
      rotulo: 'Quem chegou pelo chat?', descricao: 'Contatos deixados no chat nos últimos 7 dias (mascarados).', palavras: ['lead', 'contato', 'chat', 'chegou', 'quem'],
      async fn() {
        const l = (await central('/api/leads?dias=7', 8000)).filter((x) => x.segmento === 'chat');
        if (!l.length) return { titulo: 'Leads do chat (7 dias)', texto: 'Ninguém deixou contato pelo chat na semana.' };
        return { titulo: 'Leads do chat (7 dias)', texto: `${plural(l.length, 'contato', 'contatos')} pelo chat.`, itens: l.slice(0, 10).map((x) => ({ rotulo: `${x.site} · ${x.quando}`, valor: `${(x.nome || '').split(/\s+/)[0] || 'sem nome'} · ${mascararTexto(x.contato || '')}` })) };
      },
    },
  },
  'sofia-bot': {
    'pedido-esperando': {
      rotulo: 'Tem anúncio esperando?', descricao: 'Pedidos de anúncio parados no Telegram (fotos, texto, GPS).', palavras: ['anuncio', 'imovel', 'foto', 'esperando', 'pedido', 'telegram'],
      async fn() {
        const ps = await pedidosSofia();
        if (!ps.length) return { titulo: 'Anúncios esperando', texto: 'Nada parado. Quando tiver imóvel, manda as fotos como Arquivo no @sofia_oma_bot.' };
        return {
          titulo: 'Anúncios esperando', texto: `${plural(ps.length, 'pedido parado', 'pedidos parados')} esperando você.`,
          itens: ps.map((p) => ({ rotulo: `${p.modo} · desde ${dataCurta(p.criadoEm)}`, valor: `${plural(p.fotos, 'foto', 'fotos')}${p.gps ? ' com GPS' : ''} · ${p.textos === 0 ? 'falta texto e /pronto' : 'falta /pronto e Publicar'}` })),
        };
      },
    },
    'estado-servico': { rotulo: 'Tá rodando?', descricao: 'Estado do serviço sofia-bot no PC.', palavras: ['rodando', 'ligada', 'servico', 'estado'], fn: () => estadoServico('sofia-bot.service', 'Sofia no PC') },
  },
  'motor-sites': {
    'no-ar': { rotulo: 'O motor tá no ar?', descricao: 'Confere previa.allancandido.com agora.', palavras: ['ar', 'online', 'funcionando', 'motor', 'previa'], fn: noAr('https://previa.allancandido.com', 'Motor de Sites') },
    'quem-nao-tem-site': {
      rotulo: 'Quem ainda não tem site?', descricao: 'Negócios de turismo com Cadastur regular e sem site declarado (RJ e BA).', palavras: ['cadastur', 'site', 'vender', 'turismo', 'quem', 'oportunidade'],
      async fn() {
        const [rj, ba] = await Promise.all([adminAC('/api/admin/cadastur?uf=RJ&pagina=1', 8000), adminAC('/api/admin/cadastur?uf=BA&pagina=1', 8000).catch(() => null)]);
        return {
          titulo: 'Turismo sem site (Cadastur)', texto: `${fmt(rj.total)} negócios no RJ${ba ? ` e ${fmt(ba.total)} na BA` : ''} com Cadastur regular e sem site declarado.`,
          itens: [{ rotulo: 'RJ', valor: fmt(rj.total) }, ...(ba ? [{ rotulo: 'BA', valor: fmt(ba.total) }] : []), { rotulo: 'Base gerada em', valor: rj.geradoEm || '—' }],
        };
      },
    },
  },
  'avisos-leilao': {
    'leiloes-rj': {
      rotulo: 'Quantos leilões no RJ hoje?', descricao: 'Leilões e vendas abertos no RJ por fonte (Caixa, BB, União, Justiça, bancos).', palavras: ['leilao', 'leiloes', 'rj', 'caixa', 'hoje', 'quantos'],
      async fn() {
        const d = await getJSON('https://allancandido.com/api/dashboard-live?uf=RJ', { timeout: 8000 });
        const rj = d.por_uf?.find((x) => x.uf === 'RJ');
        if (!rj) return { titulo: 'Leilões no RJ', texto: 'O painel não trouxe o RJ agora.' };
        const total = soma(['leiloes_caixa', 'leiloes_bb', 'leiloes_uniao', 'leiloes_judiciais', 'leiloes_privados'], (k) => rj[k]);
        return {
          titulo: 'Leilões no RJ', texto: `${fmt(total)} leilões abertos no RJ, fora ${fmt(Number(rj.vendas_caixa) + Number(rj.vendas_bb))} vendas diretas.`,
          itens: [['Caixa — leilões', rj.leiloes_caixa], ['Caixa — vendas', rj.vendas_caixa], ['Bancos privados', rj.leiloes_privados], ['Justiça', rj.leiloes_judiciais], ['BB — leilões', rj.leiloes_bb], ['BB — vendas', rj.vendas_bb], ['União', rj.leiloes_uniao]].map(([rotulo, v]) => ({ rotulo, valor: fmt(v) })),
        };
      },
    },
    'coleta-hoje': {
      rotulo: 'A coleta dos bancos rodou?', descricao: 'Última rodada do Bradesco, Santander e Itaú (falhas e totais).', palavras: ['coleta', 'banco', 'bradesco', 'santander', 'itau', 'falhou', 'rodou', 'errado', 'problema', 'erro'],
      async fn() {
        const [s, j] = await Promise.all([showUnits(['leiloes-privados.service'], ['ActiveState', 'Result', 'ExecMainExitTimestamp', 'ExecMainStartTimestamp']), falhaLeiloesBancos()]);
        const u = s['leiloes-privados.service'] || {};
        const itens = [...j.falhas.map((f) => ({ rotulo: f.banco, valor: `falhou (${f.motivo})` })), ...j.ok.map((o) => ({ rotulo: o.banco, valor: `${fmt(o.n)} de ${fmt(o.de)} gravados` }))];
        if (u.ActiveState === 'activating') {
          return { titulo: 'Coleta dos bancos privados', texto: `Tá rodando agora (começou ${quando(parseTs(u.ExecMainStartTimestamp))}) — daqui a pouco eu sei como foi.`, itens: itens.length ? itens.map((i) => ({ ...i, valor: `${i.valor} (parcial)` })) : undefined };
        }
        const fim = parseTs(u.ExecMainExitTimestamp);
        if (!fim) return { titulo: 'Coleta dos bancos privados', texto: 'Não achei nenhuma rodada registrada desde que o PC ligou.' };
        const q = quando(fim);
        return {
          titulo: 'Coleta dos bancos privados', texto: u.ActiveState === 'failed' ? `A última rodada (${q}) terminou com falha${j.falhas.length ? `: ${j.falhas.map((f) => f.banco).join(', ')}` : ''}.` : `Última rodada ${q}: tudo certo.`,
          itens,
        };
      },
    },
    frescor: {
      rotulo: 'A lista da Caixa tá fresca?', descricao: 'Idade da lista da Caixa importada e horário da próxima coleta.', palavras: ['caixa', 'lista', 'fresca', 'velha', 'atualizada', 'proxima'],
      async fn() {
        const [cx, tm] = await Promise.all([showUnits(['caixa-importar.service'], ['Result', 'ExecMainExitTimestamp']), showUnits(['leiloes-privados.timer', 'leiloes-privados.service'], ['NextElapseUSecRealtime', 'LastTriggerUSec', 'ActiveState'])]);
        const d = parseTs(cx['caixa-importar.service']?.ExecMainExitTimestamp);
        const dias = d ? diasEntre(d, Date.now()) : null;
        const prox = parseTs(tm['leiloes-privados.timer']?.NextElapseUSecRealtime);
        const rodando = tm['leiloes-privados.service']?.ActiveState === 'activating';
        return {
          titulo: 'Frescor dos avisos', texto: d ? (dias > 7 ? `A lista da Caixa tem ${fmt(dias)} dias — baixa de novo em ~/Downloads que eu importo sozinha.` : `Lista da Caixa importada ${quando(d)}, tá fresca.`) : 'Não achei importação da lista da Caixa.',
          itens: [{ rotulo: 'Lista da Caixa', valor: d ? `${quando(d)} (${cx['caixa-importar.service'].Result})` : '—' }, { rotulo: 'Coleta dos bancos', valor: rodando ? 'rodando agora' : prox ? `próxima ${quando(prox)}` : '—' }],
        };
      },
    },
  },
  'painel-pncp-cnpj': {
    frescor: {
      rotulo: 'Tem carga parada?', descricao: 'Alertas do brain dos dados (tabelas vazias e cargas agendadas que pararam).', palavras: ['carga', 'parada', 'fresco', 'alerta', 'tabela', 'banco'],
      async fn() {
        const b = await brainAlertas();
        return {
          titulo: 'Frescor do banco', texto: b.paradas.length ? `${plural(b.paradas.length, 'carga agendada parada', 'cargas agendadas paradas')}.` : 'Nenhuma carga agendada parada.',
          itens: [...b.paradas.map((p) => ({ rotulo: p.nome, valor: `sem carga há ${fmt(p.dias)} dias` })), ...b.vazias.map((v) => ({ rotulo: v, valor: 'tabela vazia' })), { rotulo: 'Conferido em', valor: b.gerado || '—' }],
        };
      },
    },
    'rj-hoje': {
      rotulo: 'Como tá o RJ em licitações?', descricao: 'Licitações, valor e abertas no RJ (painel ao vivo).', palavras: ['licitacao', 'licitacoes', 'rj', 'abertas', 'compras', 'publicas'],
      async fn() {
        const d = await getJSON('https://allancandido.com/api/dashboard-live?uf=RJ', { timeout: 8000 });
        const k = d.kpis || {};
        return { titulo: 'Licitações no RJ', texto: `${fmt(k.abertas)} abertas agora em ${fmt(k.municipios)} municípios.`, itens: [{ rotulo: 'Licitações na base', valor: fmt(k.licitacoes) }, { rotulo: 'Valor somado', valor: `R$ ${(Number(k.valor) / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi` }, { rotulo: 'Abertas', valor: fmt(k.abertas) }, { rotulo: 'Municípios', valor: fmt(k.municipios) }] };
      },
    },
    'raio-x': {
      rotulo: 'Raio-X de Angra', descricao: 'População, receita e licitações de Angra dos Reis.', palavras: ['angra', 'raio', 'municipio', 'cidade', 'receita', 'populacao'],
      async fn() {
        const d = await getJSON('https://allancandido.com/api/insights/municipio?ibge=3300100', { timeout: 8000 });
        const s = d.score || {}, l = d.licitacoes || {};
        return {
          titulo: 'Raio-X: Angra dos Reis', texto: `${fmt(s.populacao)} habitantes, ${fmt(l.abertas)} licitações abertas.`,
          itens: [{ rotulo: 'População', valor: fmt(s.populacao) }, { rotulo: 'Receita por habitante', valor: s.receita_per_capita ? `R$ ${fmt(s.receita_per_capita)}` : '—' }, { rotulo: 'Licitações', valor: `${fmt(l.total)} (${fmt(l.abertas)} abertas)` }, { rotulo: 'Valor das licitações', valor: l.valor ? `R$ ${(Number(l.valor) / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} bi` : '—' }],
        };
      },
    },
    caged: {
      rotulo: 'O CAGED novo entrou?', descricao: 'Última carga do Novo CAGED (MTE).', palavras: ['caged', 'emprego', 'mte', 'carga'],
      async fn() {
        const l = (await journal('caged-etl.service', 12)).filter((x) => x.startsWith('[caged]'));
        const s = (await showUnits(['caged-etl.service'], ['Result', 'ExecMainExitTimestamp']))['caged-etl.service'] || {};
        return { titulo: 'CAGED', texto: `Última rodada ${quando(parseTs(s.ExecMainExitTimestamp))} (${s.Result || '—'}).`, itens: l.slice(-4).map((x, i) => ({ rotulo: `log ${i + 1}`, valor: x.replace('[caged] ', '').slice(0, 120) })) };
      },
    },
  },
  'mercado-imobiliario': {
    'imobiliarias-novas': {
      rotulo: 'Abriu imobiliária nova?', descricao: 'Imobiliárias pelo CNPJ no radar e quantas são novas (RJ, BA, CE).', palavras: ['imobiliaria', 'nova', 'cnpj', 'radar', 'abriu'],
      async fn() {
        const s = await adminAC('/api/admin/leads?stats=1', 8000);
        const novos = soma(s, (x) => x.novos);
        return { titulo: 'Imobiliárias no radar', texto: `${fmt(soma(s, (x) => x.total))} em ${fmt(s.length)} cidades; ${novos === 0 ? 'nenhuma nova desde o último aviso' : plural(novos, 'nova', 'novas')}.`, itens: s.slice(0, 8).map((x) => ({ rotulo: `${x.cidade} · ${x.uf}`, valor: `${fmt(x.total)}${Number(x.novos) ? ` (+${fmt(x.novos)})` : ''}` })) };
      },
    },
    'm2-angra': {
      rotulo: 'Quanto tá o m² em Angra?', descricao: 'Preço mediano do m² por bairro em Angra dos Reis (anúncios, não é laudo).', palavras: ['m2', 'metro', 'preco', 'angra', 'bairro', 'quanto'],
      async fn() {
        const l = await getJSON('https://allancandido.com/api/ferramentas/precos-mercado?cidade=Angra%20dos%20Reis&uf=RJ', { timeout: 8000 });
        const top = (Array.isArray(l) ? l : []).filter((x) => x.bairro && Number(x.n) >= 3).sort((a, b) => b.n - a.n).slice(0, 8);
        if (!top.length) return { titulo: 'm² em Angra', texto: 'Sem amostra suficiente por bairro agora.' };
        return { titulo: 'm² em Angra dos Reis', texto: 'Mediana dos anúncios por bairro (só onde tem 3+ anúncios). Não é laudo.', itens: top.map((x) => ({ rotulo: `${x.bairro}${x.tipo ? ` · ${x.tipo}` : ''}`, valor: `R$ ${fmt(x.preco_m2_med)}/m² (${fmt(x.n)} anúncios)` })) };
      },
    },
    'proxima-coleta': {
      rotulo: 'Quando é a próxima coleta?', descricao: 'Próxima rodada OLX/Zap e do CNPJ da Receita.', palavras: ['coleta', 'proxima', 'olx', 'zap', 'quando', 'timer'],
      async fn() {
        const t = await showUnits(['portais-imob.timer', 'cnpj-imob.timer'], ['NextElapseUSecRealtime', 'LastTriggerUSec', 'ActiveState']);
        const p = t['portais-imob.timer'] || {}, c = t['cnpj-imob.timer'] || {};
        return { titulo: 'Agenda das coletas', texto: `OLX/Zap: ${quando(parseTs(p.NextElapseUSecRealtime))}.`, itens: [{ rotulo: 'OLX/Zap (próxima)', valor: quando(parseTs(p.NextElapseUSecRealtime)) }, { rotulo: 'OLX/Zap (última)', valor: quando(parseTs(p.LastTriggerUSec)) }, { rotulo: 'CNPJ da Receita (próxima)', valor: quando(parseTs(c.NextElapseUSecRealtime)) }, { rotulo: 'CNPJ da Receita (última)', valor: quando(parseTs(c.LastTriggerUSec)) }] };
      },
    },
  },
  'jobpago': {
    visitas: { rotulo: 'Como foi a JobPago ontem?', descricao: 'Visitas da JobPago nas últimas 24h.', palavras: ['visita', 'ontem', 'jobpago', 'acesso'], fn: visitasSite('jobpago', 'JobPago — 24h') },
    'lugares-dormir': {
      rotulo: 'Tem lugar pra dormir esperando?', descricao: 'Candidaturas a Refúgio da Estrada por status.', palavras: ['refugio', 'dormir', 'lugar', 'pousada', 'candidato'],
      async fn() {
        const r = await central('/api/refugios', 8000);
        if (!r.length) return { titulo: 'Refúgios da Estrada', texto: 'Nenhuma candidatura ainda.' };
        const por = {};
        for (const x of r) por[x.status] = (por[x.status] || 0) + 1;
        return { titulo: 'Refúgios da Estrada', texto: `${plural(r.length, 'candidatura', 'candidaturas')}.`, itens: Object.entries(por).map(([k, v]) => ({ rotulo: k, valor: fmt(v) })) };
      },
    },
    contribuicoes: {
      rotulo: 'Tem contribuição pra aprovar?', descricao: 'Contribuições dos viajantes esperando revisão.', palavras: ['contribuicao', 'viajante', 'aprovar', 'pendente'],
      async fn() {
        const c = await central('/api/contribuicoes', 8000);
        if (!c.length) return { titulo: 'Contribuições pendentes', texto: 'Nada esperando revisão.' };
        const por = {};
        for (const x of c) por[x.tipo] = (por[x.tipo] || 0) + 1;
        return { titulo: 'Contribuições pendentes', texto: `${plural(c.length, 'contribuição', 'contribuições')} esperando você.`, itens: Object.entries(por).map(([k, v]) => ({ rotulo: k.replace(/_/g, ' '), valor: fmt(v) })) };
      },
    },
    rota: { rotulo: 'Qual é o roteiro?', descricao: 'Paradas da Expedição Paraty → Fortaleza.', palavras: ['roteiro', 'rota', 'parada', 'expedicao'], fn: acaoRota },
    'no-ar': { rotulo: 'O site tá no ar?', descricao: 'Confere jobpago.com.br agora.', palavras: ['ar', 'online', 'site', 'funcionando'], fn: noAr('https://jobpago.com.br', 'JobPago') },
  },
  'allancandido-site': {
    'no-ar': { rotulo: 'O site tá no ar?', descricao: 'Confere allancandido.com agora.', palavras: ['ar', 'online', 'site', 'funcionando'], fn: noAr('https://allancandido.com', 'allancandido.com') },
    imoveis: {
      rotulo: 'Quais imóveis estão no site?', descricao: 'Imóveis publicados e o status de cada um.', palavras: ['imovel', 'imoveis', 'anuncio', 'publicado', 'venda'],
      async fn() {
        const p = await adminAC('/api/admin/properties', 8000);
        return { titulo: 'Imóveis no site', texto: p.length === 1 ? 'Só 1 imóvel publicado — a Sofia tem fotos pra mais.' : `${fmt(p.length)} imóveis publicados.`, itens: p.slice(0, 12).map((x) => ({ rotulo: String(x.name || x.titulo || x.id || 'imóvel').slice(0, 60), valor: x.status || '—' })) };
      },
    },
    visitas: { rotulo: 'Como foi o site ontem?', descricao: 'Visitas do allancandido.com nas últimas 24h.', palavras: ['visita', 'ontem', 'acesso', 'clique'], fn: visitasSite('allancandido', 'allancandido.com — 24h') },
  },
  'visiteprado': {
    'no-ar': { rotulo: 'O site tá no ar?', descricao: 'Confere visiteprado.com.br agora.', palavras: ['ar', 'online', 'site', 'funcionando'], fn: noAr('https://visiteprado.com.br', 'Visite Prado') },
    visitas: { rotulo: 'Como foi o Visite Prado ontem?', descricao: 'Visitas nas últimas 24h.', palavras: ['visita', 'ontem', 'acesso'], fn: visitasSite('visiteprado', 'Visite Prado — 24h') },
  },
  'link-checker': {
    pronta: {
      rotulo: 'Tá pronta pra varrer?', descricao: 'Confere se a auditora está de pé (healthz).', palavras: ['pronta', 'varrer', 'link', 'quebrado', 'auditoria'],
      async fn() {
        try { const r = await fetch('http://127.0.0.1:3014/healthz', { signal: AbortSignal.timeout(8000) }); const t = await r.text(); return { titulo: 'Auditora de links', texto: r.ok && t.trim() === 'ok' ? 'Pronta! Abre o painel no PC e me passa qualquer URL que eu varro tudo.' : `Respondeu estranho (${r.status}).` }; }
        catch { return { titulo: 'Auditora de links', texto: 'Tô dormindo — me acorda primeiro.' }; }
      },
    },
    'estado-servico': { rotulo: 'Tá rodando?', descricao: 'Estado do serviço no PC.', palavras: ['rodando', 'servico', 'estado', 'memoria'], fn: () => estadoServico('link-checker.service', 'Auditora no PC') },
  },
  'whatsapp-rag-jarvis': {
    corpo: {
      rotulo: 'Cadê meu corpo?', descricao: 'Estado dos containers do Jarvis e das dependências no Docker.', palavras: ['corpo', 'container', 'docker', 'reconstruir', 'qdrant', 'kokoro'],
      async fn() {
        const s = await getJSON(`${STACK}/api/status`, { timeout: 8000 });
        const ids = ['whatsapp', 'qdrant', 'postgres', 'ollama', 'kokoro'];
        const tr = { on: 'ligado', off: 'desligado', missing: 'não existe' };
        const itens = ids.map((id) => { const x = s.stacks.find((y) => y.id === id); return { rotulo: x ? x.name : id, valor: x ? tr[x.state] || x.state : 'não existe' }; });
        const wa = s.stacks.find((y) => y.id === 'whatsapp');
        return { titulo: 'Corpo do Jarvis', texto: !wa || wa.state === 'missing' ? 'Meus containers não existem no Docker — precisa reconstruir antes de me acordar.' : wa.state === 'on' ? 'Tô inteira e ligada.' : 'Tô inteira, só dormindo.', itens };
      },
    },
  },
  'offline-brain': {
    'idade-indice': {
      rotulo: 'Seu índice tá em dia?', descricao: 'Data da última indexação do vault.', palavras: ['indice', 'vault', 'nota', 'atualizado', 'dia'],
      async fn() {
        const j = JSON.parse(await fsp.readFile(path.join(HOME, '.offline-brain', 'meta.json'), 'utf8'));
        const d = new Date(Number(j.updated) * 1000);
        const n = j.mtimes && typeof j.mtimes === 'object' ? Object.keys(j.mtimes).length : null;
        const dias = diasEntre(d, Date.now());
        return { titulo: 'Índice do vault', texto: dias > 7 ? `Indexei pela última vez em ${dataCurta(d)}; faz ${fmt(dias)} dias.` : `Em dia: indexei em ${dataCurta(d)}.`, itens: [{ rotulo: 'Última indexação', valor: quando(d) }, ...(n != null ? [{ rotulo: 'Notas no índice', valor: fmt(n) }] : [])] };
      },
    },
    'estado-servico': { rotulo: 'Tá rodando?', descricao: 'Estado do serviço no PC.', palavras: ['rodando', 'servico', 'estado', 'memoria'], fn: () => estadoServico('offline-brain.service', 'Offline Brain no PC') },
  },
  'transcricao-video': {
    fila: {
      rotulo: 'Tem vídeo esperando?', descricao: 'Vídeos na Home, Desktop e Vídeos que dá pra transcrever.', palavras: ['video', 'esperando', 'fila', 'transcrever', 'gravacao'],
      async fn() {
        const v = await videosEsperando();
        if (!v.length) return { titulo: 'Vídeos esperando', texto: 'Nenhum vídeo nas pastas de sempre.' };
        return { titulo: 'Vídeos esperando', texto: `${plural(v.length, 'vídeo', 'vídeos')} pra transcrever.`, itens: v.slice(0, 8).map((x) => ({ rotulo: x.nome.slice(0, 60), valor: `${x.pasta} · ${fmt(x.mb)} MB` })) };
      },
    },
    ultima: {
      rotulo: 'Qual foi a última transcrição?', descricao: 'Data da última transcrição salva.', palavras: ['ultima', 'transcricao', 'quando', 'pdf'],
      async fn() { const d = await ultimaTranscricao(); return { titulo: 'Última transcrição', texto: d ? `Foi ${quando(d)}.` : 'Ainda não achei transcrição salva.' }; },
    },
    'estado-servico': { rotulo: 'Tá rodando?', descricao: 'Estado do serviço no PC.', palavras: ['rodando', 'servico', 'estado'], fn: () => estadoServico('transcricao-video.service', 'Transcrição no PC') },
  },
  'olho-do-investidor': {
    'estado-servico': { rotulo: 'Tá rodando?', descricao: 'Estado do globo no PC.', palavras: ['rodando', 'servico', 'estado', 'globo'], fn: () => estadoServico('olho-do-investidor.service', 'Olho do Investidor no PC') },
  },
  'holo-gestures': {
    'estado-servico': { rotulo: 'Tá rodando?', descricao: 'Estado do HOLO no PC.', palavras: ['rodando', 'servico', 'estado'], fn: () => estadoServico('holo-gestures.service', 'HOLO no PC') },
  },
  'controle-de-servicos': {
    ram: {
      rotulo: 'Quanta RAM tem livre?', descricao: 'RAM livre de verdade e quanto cada grupo Docker ligado come.', palavras: ['ram', 'memoria', 'livre', 'pesado'],
      async fn() {
        const [m, s] = await Promise.all([memoriaLivreMB(), getJSON(`${STACK}/api/status`, { timeout: 8000 }).catch(() => null)]);
        const on = s ? s.stacks.filter((x) => x.state === 'on') : [];
        return { titulo: 'Memória do PC', texto: `${gb(m.livre)} livres de ${gb(m.total)}.`, itens: [{ rotulo: 'Livre agora', valor: gb(m.livre) }, ...on.map((x) => ({ rotulo: x.name, valor: `${fmt(x.ram)} MB` }))] };
      },
    },
    'quem-ligado': {
      rotulo: 'Quem tá ligado no Docker?', descricao: 'Grupos Docker ligados, desligados e sem container.', palavras: ['ligado', 'docker', 'quem', 'container', 'grupo'],
      async fn() {
        const s = await getJSON(`${STACK}/api/status`, { timeout: 8000 });
        const tr = { on: 'ligado', off: 'desligado', missing: 'sem container' };
        const ord = { on: 0, off: 1, missing: 2 };
        return { titulo: 'Grupos do Docker', texto: `${plural(s.stacks.filter((x) => x.state === 'on').length, 'ligado', 'ligados')} de ${fmt(s.stacks.length)}.`, itens: [...s.stacks].sort((a, b) => (ord[a.state] ?? 3) - (ord[b.state] ?? 3)).map((x) => ({ rotulo: x.name, valor: tr[x.state] || x.state })) };
      },
    },
    falhas: {
      rotulo: 'Algum robô falhou?', descricao: 'Serviços do systemd com falha (sem os do KDE).', palavras: ['falha', 'falhou', 'erro', 'quebrou', 'robo'],
      async fn() {
        const f = await unidadesComFalha();
        if (!f.length) return { titulo: 'Falhas', texto: 'Nenhum serviço com falha. Casa em ordem.' };
        const s = await showUnits(f, ['Result', 'ExecMainExitTimestamp']);
        return { titulo: 'Falhas', texto: `${plural(f.length, 'serviço com falha', 'serviços com falha')}.`, itens: f.map((u) => ({ rotulo: u.replace(/\.service$/, ''), valor: `${s[u]?.Result || 'falhou'} · ${quando(parseTs(s[u]?.ExecMainExitTimestamp))}` })) };
      },
    },
    backup: {
      rotulo: 'O backup de hoje veio?', descricao: 'Último pull do backup do Postgres do VPS.', palavras: ['backup', 'banco', 'postgres', 'copia'],
      async fn() {
        const s = (await showUnits(['postgres-backup-pull.service'], ['Result', 'ExecMainExitTimestamp']))['postgres-backup-pull.service'] || {};
        const d = parseTs(s.ExecMainExitTimestamp);
        return { titulo: 'Backup do banco', texto: s.Result === 'success' && d ? `Veio ${quando(d)}, tudo certo.` : `Último resultado: ${s.Result || 'desconhecido'} (${quando(d)}).` };
      },
    },
    tunel: {
      rotulo: 'O túnel pro VPS tá de pé?', descricao: 'Túnel SSH do Postgres do VPS (porta 5433).', palavras: ['tunel', 'vps', 'conexao', 'banco'],
      async fn() {
        const s = (await showUnits(['pncp-tunnel.service'], ['ActiveState', 'ActiveEnterTimestamp']))['pncp-tunnel.service'] || {};
        return { titulo: 'Túnel do banco', texto: s.ActiveState === 'active' ? `De pé desde ${quando(parseTs(s.ActiveEnterTimestamp))}.` : 'Caído — os robôs que leem o VPS vão falhar.' };
      },
    },
  },
  'robos-navegador': {
    ativos: {
      rotulo: 'Tem robô rodando?', descricao: 'Quais robôs de navegador estão rodando agora.', palavras: ['rodando', 'agora', 'ativo', 'robo'],
      async fn() {
        const a = await getJSON(`${LAB}/api/automacoes/ativos`, { timeout: 8000 });
        const ids = Object.keys(a || {});
        const nomes = nomesAutomacoes();
        return { titulo: 'Robôs rodando', texto: ids.length ? `${plural(ids.length, 'robô rodando', 'robôs rodando')}.` : 'Nenhum robô rodando agora.', itens: ids.map((i) => ({ rotulo: nomes.get(i) || i, valor: 'rodando' })) };
      },
    },
    lista: {
      rotulo: 'Quais robôs você tem?', descricao: 'Os robôs cadastrados na aba Automações.', palavras: ['quais', 'lista', 'robos', 'tem', 'cadastrados'],
      async fn() {
        const nomes = [...nomesAutomacoes().entries()];
        return { titulo: 'Robôs cadastrados', texto: nomes.length ? `${plural(nomes.length, 'robô', 'robôs')} na aba Automações.` : 'Nenhum robô cadastrado.', itens: nomes.slice(0, 12).map(([id, n]) => ({ rotulo: n, valor: id })) };
      },
    },
  },
};

function capacidadesDe(slug) {
  return Object.entries(ACOES[slug] || {}).map(([id, c]) => ({ id, rotulo: c.rotulo, descricao: c.descricao, tipo: 'leitura', seguroParaUmToque: true }));
}

/* ================================================================ /estado */

const CAMPOS_INTERNOS = new Set(['controle', 'statusCheck', 'sistemaJsonProposto', 'capacidades', 'manchete', 'sistema']);

async function montarEstado() {
  const { agentes, meta } = roster();
  const [stMap, mem] = await Promise.all([calcularStatus(), memoriaLivreMB()]);
  const prontas = new Map();
  const promessas = agentes.map((a) => manchete(a.slug, stMap.get(a.slug)).then((v) => { prontas.set(a.slug, v); }, () => {}));
  await Promise.race([Promise.all(promessas), sleep(4500)]);
  const lista = agentes.map((a) => {
    const st = stMap.get(a.slug);
    const m = meta.get(a.slug);
    let mc = prontas.has(a.slug) ? prontas.get(a.slug) : null;
    if (!prontas.has(a.slug)) { const ant = mancheteBoa.get(a.slug); if (ant && ant.status === st.status) mc = ant.valor; }
    const saudavel = st.status === 'acordada' || st.status === 'remota';
    const ficha = {};
    for (const [k, v] of Object.entries(a)) if (!CAMPOS_INTERNOS.has(k)) ficha[k] = v;
    return {
      ...ficha,
      sistema: { slug: a.sistema?.slug || a.slug, titulo: a.sistema?.titulo || a.slug, oQueFaz: a.sistema?.oQueFaz || '', url: m.url },
      controle: { tipo: m.tipo },
      status: st.status, motivo: st.motivo, podeLigar: st.podeLigar,
      peso: a.peso === 'pesado' ? 'pesado' : 'leve', ramMB: st.ramMB,
      trabalhando: saudavel && (st.status === 'remota' || st.trabalhandoFixo || !!(mc && mc.atividade)),
      manchete: mc ? mc.texto : null,
      capacidades: capacidadesDe(a.slug),
    };
  });
  return { agora: new Date().toISOString(), hora: Math.round(horaDecimal() * 100) / 100, memoriaLivreMB: mem.livre, agentes: lista };
}

/* ================================================================ acordar / dormir / bom-dia */

function nomeDe(slug) { const a = roster().porSlug.get(slug); return a ? a.nome : slug; }

async function pesadasAcordadas(excluir) {
  const st = await calcularStatus();
  const { agentes, meta } = roster();
  return agentes
    .filter((a) => a.slug !== excluir && st.get(a.slug)?.status === 'acordada' && ['systemd', 'docker-proxy'].includes(meta.get(a.slug).tipo))
    .map((a) => ({ slug: a.slug, nome: a.nome, ramMB: st.get(a.slug).ramMB || Number(a.ramMB) || 0 }))
    .filter((x) => x.ramMB >= 100)
    .sort((a, b) => b.ramMB - a.ramMB);
}

async function esperarUnidade(unit, alvo, ms) {
  const fim = Date.now() + ms;
  let s = {};
  while (Date.now() < fim) {
    s = (await showUnits([unit], ['ActiveState', 'Result']))[unit] || {};
    if (alvo === 'active' ? ['active', 'failed'].includes(s.ActiveState) : ['inactive', 'failed'].includes(s.ActiveState)) break;
    await sleep(400);
  }
  return s;
}

async function acordar(slug, { origem = 'botao' } = {}) {
  const a = roster().porSlug.get(slug);
  if (!a) return { http: 404, ok: false, status: 'desconhecido', mensagem: 'Não conheço essa agente.' };
  const m = roster().meta.get(slug);
  invalidar('status');
  const st = (await calcularStatus()).get(slug);
  if (st.status === 'sem-corpo') return { http: 409, ok: false, status: st.status, mensagem: `${a.nome} precisa ser reconstruída antes de acordar (${st.motivo}). Pede no Claude: reconstrói o ${a.sistema?.titulo || slug}.` };
  if (slug === 'prospeccao-robo') return { http: 409, ok: false, status: st.status, mensagem: 'O robô de e-mail só liga com o seu ok no Claude ("liga o robô"). Daqui eu só preparo os rascunhos.' };
  if (st.status === 'acordada' && !(m.tipo === 'systemd' && st.motivo === 'acordando…')) return { http: 200, ok: true, status: 'acordada', mensagem: `${a.nome} já tá de pé!` };
  if (!st.podeLigar) {
    const porque = m.tipo === 'timer' ? 'quem marca o horário dela é o systemd' : m.tipo === 'remoto' ? 'ela roda no VPS, não no PC' : 'ela não tem interruptor por aqui';
    return { http: 409, ok: false, status: st.status, mensagem: `Não dá pra acordar a ${a.nome} daqui: ${porque}.` };
  }
  const mem = await memoriaLivreMB();
  const precisa = Number(a.ramMB) || 0;
  if (mem.livre != null && mem.livre - precisa < RESERVA_RAM_MB) {
    const pesadas = await pesadasAcordadas(slug);
    const quem = pesadas.slice(0, 3).map((p) => `${p.nome} (${fmt(p.ramMB)} MB)`).join(', ');
    return {
      http: 409, ok: false, status: st.status, motivo: 'ram',
      mensagem: `Pouca RAM: sobram ${fmt(mem.livre)} MB e a ${a.nome} come ~${fmt(precisa)} MB (deixo sempre ${fmt(RESERVA_RAM_MB)} MB de folga). ${quem ? `Quem tá pesando: ${quem}. Põe uma delas pra dormir que eu acordo a ${a.nome}.` : 'Nenhuma agente pesada acordada — a RAM tá com outros programas do PC (navegador, Docker).'}`,
    };
  }
  if (m.tipo === 'systemd') {
    if (!m.unidade || INTOCAVEIS_UNITS.has(m.unidade) || !UNIT_RE.test(m.unidade)) return { http: 409, ok: false, status: st.status, mensagem: 'Esse serviço não pode ser ligado daqui.' };
    const r = await rodar('systemctl', ['--user', 'start', m.unidade], { timeout: 30000 });
    const s = await esperarUnidade(m.unidade, 'active', 8000);
    invalidar('status', `manchete:${slug}`);
    if (s.ActiveState === 'active') return { http: 200, ok: true, status: 'acordada', mensagem: `${a.nome} acordou! Já tá indo pro posto.` };
    if (s.ActiveState === 'activating') return { http: 200, ok: true, status: 'acordada', mensagem: `${a.nome} tá levantando, já já tá de pé.` };
    return { http: 500, ok: false, status: s.ActiveState === 'failed' ? 'com-problema' : 'dormindo', mensagem: `${a.nome} não levantou (${r.code === 0 ? s.Result || 'sem resposta' : 'o systemd recusou'}). Dá uma olhada no Claude.` };
  }
  if (m.tipo === 'docker-proxy') {
    if (!m.stackId || INTOCAVEIS_STACK.has(m.stackId)) return { http: 409, ok: false, status: st.status, mensagem: 'Esse grupo não pode ser ligado daqui.' };
    const r = await fetch(`${STACK}/api/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.stackId, on: true }), signal: AbortSignal.timeout(20000) }).then((x) => x.json()).catch(() => ({ ok: false }));
    invalidar('status', 'stack', `manchete:${slug}`);
    return r.ok === false ? { http: 500, ok: false, status: st.status, mensagem: `O Docker não ligou a ${a.nome}.` } : { http: 200, ok: true, status: 'acordada', mensagem: `${a.nome} acordou!` };
  }
  return { http: 409, ok: false, status: st.status, mensagem: 'Sem interruptor pra essa.' };
}

async function dormir(slug) {
  const a = roster().porSlug.get(slug);
  if (!a) return { http: 404, ok: false, status: 'desconhecido', mensagem: 'Não conheço essa agente.' };
  const m = roster().meta.get(slug);
  invalidar('status');
  const st = (await calcularStatus()).get(slug);
  if (st.status === 'dormindo') return { http: 200, ok: true, status: 'dormindo', mensagem: `${a.nome} já tá dormindo.` };
  if (!st.podeLigar) {
    const porque = slug === 'prospeccao-robo' ? 'o robô já tá desligado de propósito' : m.tipo === 'timer' ? 'quem manda no horário dela é o systemd' : m.tipo === 'remoto' ? 'ela roda no VPS' : m.tipo === 'sob-demanda' ? 'ela só trabalha quando você dispara um robô' : slug === 'controle-de-servicos' ? 'ela cuida da casa e não tem interruptor por aqui' : 'o container dela fica fora do painel de liga/desliga';
    return { http: 409, ok: false, status: st.status, mensagem: `Não ponho a ${a.nome} pra dormir daqui: ${porque}.` };
  }
  if (m.tipo === 'systemd') {
    if (!m.unidade || INTOCAVEIS_UNITS.has(m.unidade) || !UNIT_RE.test(m.unidade)) return { http: 409, ok: false, status: st.status, mensagem: 'Esse serviço não pode ser desligado daqui.' };
    await rodar('systemctl', ['--user', 'stop', m.unidade], { timeout: 30000 });
    const s = await esperarUnidade(m.unidade, 'inactive', 8000);
    invalidar('status', `manchete:${slug}`);
    return ['inactive', 'failed'].includes(s.ActiveState)
      ? { http: 200, ok: true, status: 'dormindo', mensagem: `${a.nome} foi pro lounge. Boa noite!` }
      : { http: 500, ok: false, status: 'acordada', mensagem: `${a.nome} não quis deitar (${s.ActiveState || 'sem resposta'}).` };
  }
  if (m.tipo === 'docker-proxy') {
    if (!m.stackId || INTOCAVEIS_STACK.has(m.stackId)) return { http: 409, ok: false, status: st.status, mensagem: 'Esse grupo não pode ser desligado daqui.' };
    const r = await fetch(`${STACK}/api/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.stackId, on: false }), signal: AbortSignal.timeout(20000) }).then((x) => x.json()).catch(() => ({ ok: false }));
    invalidar('status', 'stack', `manchete:${slug}`);
    return r.ok === false ? { http: 500, ok: false, status: st.status, mensagem: 'O Docker não desligou.' } : { http: 200, ok: true, status: 'dormindo', mensagem: `${a.nome} foi dormir.` };
  }
  return { http: 409, ok: false, status: st.status, mensagem: 'Sem interruptor pra essa.' };
}

async function bomDia() {
  const { agentes } = roster();
  const acordadas = [], jaEstavam = [], recusadas = [];
  invalidar('status');
  // pré-carrega o modelo de conversa (compartilhado com Sofia/visão — nunca descarregamos)
  const ollama = fetch(`${OLLAMA}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODELO, keep_alive: '15m' }), signal: AbortSignal.timeout(60000) })
    .then((r) => { r.body?.cancel().catch(() => {}); return r.ok ? 'carregado' : `erro ${r.status}`; }).catch(() => 'sem resposta');
  for (const a of agentes.filter((x) => x.acordaSozinhaDeManha === true)) {
    const st = (await calcularStatus()).get(a.slug);
    if (st.status === 'acordada') { jaEstavam.push(a.slug); continue; }
    if (!st.podeLigar) { recusadas.push({ slug: a.slug, motivo: st.motivo || `não tem interruptor por aqui (${st.status})` }); continue; }
    const r = await acordar(a.slug, { origem: 'bom-dia' });
    if (r.ok && r.status === 'acordada') acordadas.push(a.slug); else recusadas.push({ slug: a.slug, motivo: r.mensagem });
    invalidar('status');
  }
  const estadoOllama = await Promise.race([ollama, sleep(2500).then(() => 'carregando')]);
  return { ok: true, acordadas, jaEstavam, recusadas, ollama: estadoOllama };
}

/* ================================================================ conversar (Ollama, com chão) */

async function ollamaChat(messages, { temperature = 0.6, num_predict = 220, timeout = 45000 } = {}) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeout),
    body: JSON.stringify({ model: MODELO, think: false, stream: false, keep_alive: '15m', messages, options: { temperature, num_predict, top_p: 0.9 } }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  const d = await r.json();
  return limparLLM(d?.message?.content || '');
}
function limparLLM(t) {
  return String(t || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '')
    .replace(/\*\*|__|`/g, '').replace(/^#+\s*/gm, '')
    .replace(/^\s*["“]|["”]\s*$/g, '').trim();
}
function cortarPalavras(t, max) {
  const palavras = t.split(/\s+/).filter(Boolean);
  if (palavras.length <= max) return t.trim();
  const corte = palavras.slice(0, max).join(' ');
  const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '));
  return fim > corte.length * 0.5 ? corte.slice(0, fim + 1) : `${corte.replace(/[,;:]$/, '')}…`;
}
const numerosDe = (t) => (String(t).match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/[.,]/g, ''));
const ROMANTICO = /\b(amor|amorzinho|querid[oa]|meu bem|benzinho|benz[ãa]o|lind[oa]|gatinho|fofo|fofinho|chuchu|meu anjo|vida minha|minha vida|xuxu|meu chefinho|chefinho)\b/i;
const DIZ_QUE_ENVIOU_RE = /\b(enviei|mandei|disparei|publiquei|j[aá] (foi )?enviad[oa]|j[aá] mandad[oa])\b/gi;
// "marcar Enviei" (o botão) e "não enviei" não contam como dizer que enviou
const DIZ_QUE_ENVIOU = {
  test(t) {
    for (const m of String(t).matchAll(DIZ_QUE_ENVIOU_RE)) {
      const antes = String(t).slice(Math.max(0, m.index - 14), m.index);
      if (/(n[ãa]o|nunca|marcar|marca|bot[ãa]o)\s*["“'«]?\s*$/i.test(antes) || /^["“'«]/.test(String(t).slice(m.index - 1, m.index))) continue;
      return true;
    }
    return false;
  },
};

function sugerirAcoes(slug, mensagem) {
  const caps = Object.entries(ACOES[slug] || {});
  if (!caps.length) return [];
  const msg = semAcento(mensagem);
  if (/o que (voce|vc|tu) (faz|pode)|pode fazer|faz por mim|me ajuda|ajuda|capacidade|botoes|mostra/.test(msg)) return caps.slice(0, 3).map(([id]) => id);
  const toks = new Set(msg.split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
  const pont = caps.map(([id, c]) => {
    const chaves = [...(c.palavras || []), ...semAcento(c.rotulo).split(/[^a-z0-9]+/).filter((w) => w.length >= 4)];
    let n = 0;
    for (const k of chaves) for (const t of toks) if (t.startsWith(k.slice(0, 5)) || k.startsWith(t.slice(0, 5))) { n += 1; break; }
    return [id, n];
  }).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return pont.slice(0, 2).map(([id]) => id);
}

function promptAgente(a, st, mc, extras = [], primeiraFala = true) {
  const caps = capacidadesDe(a.slug);
  // anotações do roster: só o rótulo (+ descrição quando não tem número, URL nem caminho — ex.: "hoje 401" é HTTP, não contagem)
  const so = (a.capacidades || []).filter((c) => !caps.some((x) => x.id === c.id)).map((c) => {
    const d = String(c.descricao || '');
    return `- ${c.rotulo}${d && !/\d|https?:|\/|~|x-admin|secret|token/i.test(d) ? `: ${d.slice(0, 110)}` : ''}`;
  });
  const colegas = roster().agentes.filter((x) => x.slug !== a.slug).map((x) => `- ${x.nome}: ${x.funcao}`);
  const p = partesData(new Date());
  const regras = [
    `Fale como ${a.nome}, em primeira pessoa ("eu"), com o Allan, que é seu chefe. Português do Brasil, jeito carioca leve.`,
    'Responda direto ao que ele perguntou, em até 70 palavras, sem markdown e sem listas; no máximo 1 emoji.',
    'Nada de apelido carinhoso ou flerte, mesmo que ele brinque (nada de "amor", "querido", "meu bem", "lindo"). Trate como chefe, com bom humor.',
    'Números: use SÓ os que aparecem em O QUE EU FAÇO ou FATOS AO VIVO. Não some, não estime, não arredonde. Se não tiver o número, diga que não sabe de cabeça e indique o botão certo pelo nome.',
    'Você não executa nada sozinha: nunca diga que enviou, mandou, publicou, ligou ou desligou algo, nem invente que alguém "já está resolvendo". Quem toca nos botões é o Allan.',
    'Se pedirem algo fora do seu sistema, indique a colega certa da lista COLEGAS.',
    'Período: diga exatamente o do fato (ex.: "nas últimas 24h", "na semana"); não troque por "hoje" nem "ontem".',
    'Não repita apresentação: só diga "sou a ..." se ele perguntar quem você é; nas outras respostas vá direto ao ponto.',
  ];
  if (st.status === 'sem-corpo') {
    regras.push(`AGORA VOCÊ ESTÁ SEM CORPO (${st.motivo || 'seus containers não existem'}): não consegue fazer nada do seu sistema até ser reconstruída. Se ele pedir algo do seu sistema, diga isso logo no começo e sugira pedir no Claude: "reconstrói o ${a.sistema?.titulo || a.slug}". Nunca prometa buscar, mostrar ou fazer algo agora.`);
  } else if (st.status === 'dormindo' && st.podeLigar) {
    regras.push('Agora você está dormindo (o serviço está desligado): se ele pedir algo que dependa de você rodando, diga que precisa acordar antes — é só tocar em "Acordar" na sua ficha.');
  } else if (st.status === 'com-problema') {
    regras.push(`Agora você está com problema (${st.motivo || 'falha'}). Se for relevante pra pergunta, conte isso com franqueza.`);
  }
  if (a.slug === 'prospeccao-robo') {
    regras.push('Você NUNCA envia e-mail, WhatsApp nem Telegram. Se o Allan pedir pra mandar, a resposta certa é: "eu não envio — preparo o rascunho na aba Prospectar, você abre no seu app, envia e volta pra marcar Enviei". O robô de e-mail está desligado de propósito e só liga se ele pedir no Claude ("liga o robô") — você não liga nem aprova nada. Regras do jogo: só empresas (PJ), no máximo 2 contatos por negócio, toda mensagem oferece sair.');
  }
  return [
    `Seu nome é ${a.nome}. Você é ${a.funcao} no Campus do Allan, um campus onde cada sistema dele virou uma agente. Você cuida do sistema "${a.sistema?.titulo || a.slug}" (se falar dele, diga "eu cuido do/da ...", nunca "eu sou a ${a.sistema?.titulo || a.slug}").`,
    '',
    'COMO RESPONDER',
    ...regras.map((r, i) => `${i + 1}) ${r}`),
    '',
    'QUEM VOCÊ É',
    `Personalidade: ${a.personalidade || ''}`,
    a.bordao && primeiraFala ? `Bordão (opcional, no máximo uma vez e só no fim; nunca responda só com ele): "${a.bordao}"` : '',
    '',
    'O QUE EU FAÇO (fatos do sistema)',
    a.sistema?.oQueFaz || '',
    '',
    `FATOS AO VIVO (${p.hour}:${p.minute} de ${p.day}/${p.month}/${p.year})`,
    `Estado: ${STATUS_TEXTO[st.status] || st.status}${st.motivo ? ` — ${st.motivo}` : ''}.`,
    `Manchete: ${mc && mc.texto ? mc.texto : 'sem número agora'}.`,
    ...extras.map((x) => `Resultado do botão "${x.rotulo}" agora: ${x.texto}${x.itens && x.itens.length ? ` (${x.itens.map((i) => `${i.rotulo}: ${i.valor}`).join('; ')})` : ''}`),
    '',
    'BOTÕES QUE O ALLAN PODE TOCAR NA SUA FICHA (só leitura)',
    ...(caps.length ? caps.map((c) => `- "${c.rotulo}": ${c.descricao}`) : ['- nenhum por enquanto']),
    ...(so.length ? ['', 'O QUE VOCÊ SÓ EXPLICA (não faz pelo Campus)', ...so] : []),
    '',
    'COLEGAS',
    ...colegas,
  ].filter((x) => x !== null && x !== undefined).join('\n');
}

function respostaPorRegras(a, st, mc) {
  const caps = capacidadesDe(a.slug);
  const frase1 = String(a.sistema?.oQueFaz || '').split(/(?<=[.!?])\s/)[0];
  const funcao = String(a.funcao || '');
  const partes = [`Oi, Allan! Aqui é a ${a.nome}, ${funcao.charAt(0).toLowerCase()}${funcao.slice(1)}.`];
  // o aviso que importa vem antes (o corte de 70 palavras come o fim)
  if (a.slug === 'prospeccao-robo') partes.push('Eu não envio nada: preparo o rascunho na aba Prospectar e quem envia é você, no seu app.');
  const semCorpo = st.status === 'sem-corpo';
  if (semCorpo) partes.push(mc && mc.texto && /corpo/i.test(mc.texto) ? `${mc.texto}.` : 'Tô sem corpo agora — preciso ser reconstruída antes de fazer qualquer coisa.', `Pede no Claude: reconstrói o ${a.sistema?.titulo || a.slug}.`);
  partes.push(frase1);
  if (!semCorpo && mc && mc.texto) partes.push(`Agora: ${mc.texto}.`);
  else if (!semCorpo && st.motivo) partes.push(`Agora: ${st.motivo}.`);
  if (caps.length) partes.push(`Toca aí: ${caps.slice(0, 3).map((c) => c.rotulo).join(' · ')}`);
  return cortarPalavras(partes.join(' '), 70);
}

async function conversar(corpo) {
  const slug = txt(corpo.slug);
  const a = roster().porSlug.get(slug);
  if (!a) return { http: 404, erro: 'Não conheço essa agente.' };
  const mensagem = txt(corpo.mensagem).trim().slice(0, 500);
  if (!mensagem) return { http: 400, erro: 'Manda uma mensagem.' };
  const hist = (Array.isArray(corpo.historico) ? corpo.historico.slice(-8) : []).filter((h) => h && typeof h === 'object' && typeof h.texto === 'string');
  const st = (await calcularStatus()).get(slug);
  const mc = await Promise.race([manchete(slug, st).catch(() => null), sleep(4000).then(() => mancheteBoa.get(slug)?.valor || null)]);
  const acoesSugeridas = sugerirAcoes(slug, mensagem);
  // chão extra: roda (só leitura, com teto de 4 s) as capacidades que a pergunta pede
  const extras = (await Promise.race([
    Promise.all(acoesSugeridas.slice(0, 2).map(async (id) => {
      try { const r = await ACOES[slug][id].fn(); return { rotulo: ACOES[slug][id].rotulo, texto: r.texto, itens: (r.itens || []).slice(0, 8) }; } catch { return null; }
    })),
    sleep(4000).then(() => []),
  ])).filter(Boolean);
  const sistema = promptAgente(a, st, mc, extras, hist.length === 0);
  const msgs = [{ role: 'system', content: sistema }];
  for (const h of hist) {
    const t = String(h && h.texto || '').slice(0, 500);
    if (t) msgs.push({ role: h.de === 'agente' ? 'assistant' : 'user', content: t });
  }
  msgs.push({ role: 'user', content: mensagem });
  const permitidos = new Set([...numerosDe(sistema), ...numerosDe(mensagem), ...hist.flatMap((h) => numerosDe(h && h.texto || '')), '1']);
  const pediuEnvio = a.slug === 'prospeccao-robo' && /\b(mand|envi|dispar|dispara|solta)\w*/.test(semAcento(mensagem));
  const problema = (t) => {
    if (!t) return 'resposta vazia';
    if (ROMANTICO.test(t)) return 'usou apelido carinhoso';
    if (DIZ_QUE_ENVIOU.test(t)) return 'disse que enviou/publicou algo';
    if (st.status === 'sem-corpo' && !/reconstru|sem corpo/.test(semAcento(t))) return 'não avisou que você está sem corpo e precisa ser reconstruída';
    if (pediuEnvio && !/prospectar|rascunho/.test(semAcento(t))) return 'não explicou que você não envia: prepara o rascunho na aba Prospectar e ele envia no app dele';
    const inventados = numerosDe(t).filter((n) => !permitidos.has(n));
    if (inventados.length) return `citou número que não está nos fatos (${inventados.slice(0, 3).join(', ')})`;
    return null;
  };
  // o modelo às vezes abre toda resposta com "Sou a X." / "Eu cuido do ..." — só deixa isso quando a pergunta é de apresentação
  const pediuApresentacao = /quem (e|eh|é) (voce|vc|tu)|o que (voce|vc|tu) (faz|pode)|se apresent|o que faz|faz por mim|quem e voce/.test(semAcento(mensagem));
  const semAbertura = (t) => {
    if (pediuApresentacao) return t;
    let s = t;
    for (let i = 0; i < 2; i += 1) {
      const m = s.match(/^(?:oi,? allan[!.,]?\s*)?(?:(?:eu )?sou a [^.!?\n]{1,40}[.!?]|eu cuido d[oa]s? [^\n]{1,140}?[.!?]["”']?\.?)\s+/i);
      if (!m || s.length - m[0].length < 20) break;
      s = s.slice(m[0].length);
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  try {
    let t = cortarPalavras(semAbertura(await ollamaChat(msgs, { temperature: 0.5 })), 70);
    let erro = problema(t);
    if (process.env.CAMPUS_DEBUG) console.error('[campus][debug] 1a', erro, '|', t);
    if (erro) {
      msgs.push({ role: 'assistant', content: t }, { role: 'user', content: `Refaça a resposta anterior: ela ${erro}. Siga as regras, use só números do contexto, máximo 70 palavras.` });
      t = cortarPalavras(semAbertura(await ollamaChat(msgs, { temperature: 0.3 })), 70);
      erro = problema(t);
      if (process.env.CAMPUS_DEBUG) console.error('[campus][debug] 2a', erro, '|', t);
    }
    if (!erro) return { http: 200, resposta: t, acoesSugeridas, fonte: 'ollama' };
  } catch (e) { logErro('conversar/ollama', e); }
  return { http: 200, resposta: respostaPorRegras(a, st, mc), acoesSugeridas: acoesSugeridas.length ? acoesSugeridas : capacidadesDe(slug).slice(0, 2).map((c) => c.id), fonte: 'regras' };
}

/* ================================================================ prospecção (Kira) */

async function estadoRobo() {
  const [r, j] = await Promise.all([
    rodar('systemctl', ['--user', 'show', 'prospeccao-robo.timer', '-p', 'UnitFileState', '-p', 'ActiveState', '-p', 'NextElapseUSecRealtime', '-p', 'LastTriggerUSec'], { timeout: 4000 }),
    rodar('journalctl', ['--user', '-u', 'prospeccao-robo.service', '-n', '3', '-o', 'cat'], { timeout: 4000 }),
  ]);
  const o = {};
  for (const l of r.stdout.split('\n')) { const i = l.indexOf('='); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); }
  const linhas = j.stdout.split('\n').filter(Boolean);
  let ultimoEnvio = null;
  for (const l of linhas) {
    const m = l.match(/^(\d{4}-\d{2}-\d{2}): (\d+|None) enviados de (\d+) candidatos/);
    if (m) ultimoEnvio = { dia: m[1], enviados: m[2] === 'None' ? 0 : Number(m[2]), candidatos: Number(m[3]) };
  }
  const hojeISO = (() => { const p = partesData(new Date()); return `${p.year}-${p.month}-${p.day}`; })();
  const enviadosHoje = ultimoEnvio && ultimoEnvio.dia === hojeISO ? ultimoEnvio.enviados : 0;
  const habilitado = o.UnitFileState === 'enabled';
  return {
    ativo: o.ActiveState === 'active', habilitado, unitFileState: o.UnitFileState || 'desconhecido', activeState: o.ActiveState || 'desconhecido',
    proximo: parseTs(o.NextElapseUSecRealtime), ultimoDisparo: parseTs(o.LastTriggerUSec), enviadosHoje, limite: LIMITE_ROBO, ultimoEnvio,
    log: linhas.map((l) => mascararTexto(l).slice(0, 160)),
    texto: `Robô de e-mail: ${habilitado ? 'ligado' : 'desligado'}, ${enviadosHoje}/${LIMITE_ROBO} hoje`,
    comoLigar: habilitado ? null : 'Só com o seu ok: peça no Claude "liga o robô".',
  };
}

const ROTULO_SETOR = {
  pousada: 'Pousada', restaurante: 'Restaurante', loja_roupas: 'Loja de roupas', salao_beleza: 'Salão de beleza', padaria: 'Padaria',
  mercado_mercearia: 'Mercado / mercearia', oficina_mecanica: 'Oficina mecânica', bar: 'Bar', imobiliaria: 'Imobiliária',
  turismo_passeio: 'Turismo e passeios', artesanato: 'Artesanato', camping_estacionamento: 'Camping / estacionamento',
  transporte_frete: 'Transporte e frete', posto_combustivel: 'Posto de combustível', agropecuaria: 'Agropecuária',
};
const rotuloSetor = (s) => ROTULO_SETOR[s] || (s ? String(s).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Outros');

let filaEstado = { dados: null, em: 0, voando: null };
const filaPorCnpj = new Map(); // cnpj -> {it, em}  (só memória; some em 2h)
const tirados = new Map(); // cnpj -> em (registrados no campus; somem da fila até a fila nova chegar)

function obterFila(forcar = false) {
  if (!forcar && filaEstado.dados && Date.now() - filaEstado.em < 10 * 60000) return Promise.resolve(filaEstado.dados);
  if (filaEstado.voando) return filaEstado.voando;
  const p = (async () => {
    const r = await rodar(PY, [FILA_PY, String(LIMITE_ROBO)], {
      timeout: 150000, cwd: CENTRAL_DIR, maxBuffer: 8 * 1024 * 1024,
      env: { PATH: '/usr/bin:/bin', HOME, LANG: 'C.UTF-8', PGOPTIONS: '-c default_transaction_read_only=on', PYTHONDONTWRITEBYTECODE: '1' },
    });
    let d = null;
    try { d = JSON.parse(r.stdout); } catch { /* nada */ }
    if (!d || d.erro || r.code !== 0 || !Array.isArray(d.itens)) throw new Error(d && d.erro ? d.erro : r.estourou ? 'a fila demorou demais' : 'a fila não respondeu direito');
    const agora = Date.now();
    for (const [k, v] of filaPorCnpj) if (agora - v.em > 2 * 3600000) filaPorCnpj.delete(k);
    for (const it of d.itens) filaPorCnpj.set(it.cnpj, { it, em: agora });
    tirados.clear();
    filaEstado = { dados: d, em: agora, voando: null };
    return d;
  })().finally(() => { if (filaEstado.voando === p) filaEstado.voando = null; });
  filaEstado.voando = p;
  return p;
}

function observacao(it) {
  const d = it.destino || {};
  const partes = [it.etapa === 2 ? '2º toque (7+ dias depois do 1º)' : '1º toque'];
  partes.push(it.tipo === 'novo' && it.abertura ? `abriu em ${it.abertura}` : d.anoAbertura ? `na praça desde ${d.anoAbertura}` : '');
  if (Number(d.concorrentes) > 1) partes.push(`${fmt(d.concorrentes)} concorrentes na cidade`);
  if (it.refugio) partes.push('recebe viajante (Refúgio)');
  if (it.linha === 'fixo') partes.push('telefone fixo, sem WhatsApp');
  if (it.linha === 'contador') partes.push('telefone parece de contador');
  return partes.filter(Boolean).join(' · ');
}

function itemPublico(it) {
  return {
    id: it.cnpj, cnpj: it.cnpj, nome: it.nome, cidade: it.cidade, uf: it.uf, categoria: rotuloSetor(it.categoria), setorId: it.categoria || null,
    etapa: it.etapa, tipo: it.tipo, abertura: it.abertura, refugio: !!it.refugio,
    canais: { email: !!it.email, whatsapp: { ok: it.linha === 'celular' && !!it.telefone, linha: it.linha || null }, telegram: true },
    origem: 'prospect', observacao: observacao(it),
  };
}

async function rotaFila(parsedUrl) {
  const limite = Math.max(1, Math.min(50, parseInt(parsedUrl.searchParams.get('limite') || '20', 10) || 20));
  // "atualizar=1" força recarga, mas no máximo 1x por minuto
  const d = await obterFila(parsedUrl.searchParams.get('atualizar') === '1' && Date.now() - filaEstado.em > 60000);
  const itens = d.itens.filter((it) => !tirados.has(it.cnpj)).slice(0, limite).map(itemPublico);
  return {
    itens, total: d.itens.length - tirados.size, geradoEm: d.geradoEm, atualizadaEm: new Date(filaEstado.em).toISOString(),
    regras: ['Um por vez: você abre, envia no seu app e volta pra marcar Enviei', 'Só empresas (PJ) — MEI/pessoa física ficam de fora (LGPD)', 'Dado do cadastro público de CNPJ da Receita. Toda mensagem oferece sair', 'No máximo 2 contatos por negócio'],
  };
}

function linkRelatorio(it, ref, canal) {
  const ibge = it.destino && /^\d{7}$/.test(String(it.destino.ibge || '')) ? it.destino.ibge : null;
  const setor = it.categoria && /^[a-z_]+$/.test(it.categoria) ? it.categoria : null;
  const fonte = canal === 'telegram' ? 'telegram' : 'whatsapp';
  const camp = canal === 'telegram' ? 'expedicao01-tg' : 'expedicao01-wa';
  return `https://jobpago.com.br/cidade${ibge ? `/${ibge}` : ''}?utm_source=${fonte}&utm_medium=prospeccao&utm_campaign=${camp}&utm_content=${ref}${setor && ibge ? `#setor-${setor}` : ''}`;
}

function fatosWhats(it, link) {
  const d = it.destino || {};
  const f = {
    negocio: it.nome, cidade: it.cidade, uf: it.uf, setor: d.setorPlural || null,
    abertoEm: it.tipo === 'novo' ? d.abertura : null, naPracaDesde: it.tipo === 'estabelecido' ? d.anoAbertura : null,
    negociosAbertosNaCidadeEm90Dias: d.novos90 ?? null, mesmoSetorAbertosNoUltimoAno: Number(d.setorAno) > 1 ? d.setorAno : null,
    concorrentesNaCidade: Number(d.concorrentes) > 1 ? d.concorrentes : null, recebeViajantes: !!d.refugio,
    expedicao: 'Expedição JobPago, Paraty → Fortaleza', saidaDeParaty: '15 de outubro', linkRelatorio: link,
  };
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== null && v !== undefined && v !== ''));
}

function textoModelo(it, link) {
  const paraty = semAcento(it.cidade) === 'paraty';
  const passagem = paraty
    ? 'Saio de Paraty em 15 de outubro na Expedição JobPago (Paraty → Fortaleza) visitando negócios da estrada.'
    : `Vou passar por ${it.cidade} na Expedição JobPago (Paraty → Fortaleza), que sai de Paraty em 15 de outubro, visitando negócios da estrada.`;
  return `Olá! Sou o Allan, da JobPago. ${passagem} ${it.nome} pode entrar grátis no mapa da cidade — o relatório de ${it.cidade} está aqui: ${link}\nSe preferir não receber mensagens, é só responder "sair".`;
}

function validarWhats(t, fatos, link) {
  if (!t) return 'vazio';
  if (t.length > 600) return 'passou de 600 caracteres';
  if (/verificad/i.test(t)) return 'falou em verificado';
  if (t.split(link).length !== 2) return 'o link do relatório não aparece exatamente uma vez';
  const resto = t.replace(link, ' ');
  if (/(https?:\/\/|www\.)\S+/i.test(resto) || /\b[\w-]+\.(com|br|net|org|io|me)\b/i.test(resto)) return 'tem outra URL';
  if (!/\bsair\b|n[ãa]o (quer|quiser|deseja|desejar) (mais )?receber|parar de receber/i.test(resto)) return 'sem frase de sair';
  if (/[\w.+-]+@[\w-]+\.\w/.test(resto) || /\d[\d ().-]{7,}\d/.test(resto)) return 'tem contato no texto';
  const ok = new Set(numerosDe(Object.entries(fatos).filter(([k]) => k !== 'linkRelatorio').map(([, v]) => String(v)).join(' ')));
  const inventados = numerosDe(resto).filter((n) => !ok.has(n));
  if (inventados.length) return `número fora dos fatos (${inventados.join(', ')})`;
  if (DIZ_QUE_ENVIOU.test(resto) || ROMANTICO.test(resto)) return 'tom proibido';
  return null;
}

async function textoWhatsApp(it, ref, canal, pedido) {
  const link = linkRelatorio(it, ref, canal);
  const fatos = fatosWhats(it, link);
  const base = textoModelo(it, link);
  const sistema = [
    'Você escreve UMA mensagem curta de WhatsApp do Allan Candido (JobPago) para um pequeno negócio. Português do Brasil, simpático, direto, sem exagero.',
    'Use SÓ os fatos do JSON. Não invente número, data, nome, prêmio nem promessa. Pode usar no máximo 1 número dos fatos para dar contexto.',
    'Regras: até 450 caracteres; coloque o linkRelatorio exatamente como está, uma única vez; nenhuma outra URL ou site; não fale em selo, "verificado" nem preço;',
    'termine com a frase de sair: Se preferir não receber mensagens, é só responder "sair".',
    'Responda só com o texto da mensagem, sem aspas e sem comentários.',
  ].join(' ');
  const usuario = `Modelo base (pode personalizar, mantendo a ideia): ${base}\n\nFatos (JSON): ${JSON.stringify(fatos)}${pedido ? `\n\nPedido do Allan (só estilo, as regras continuam valendo): ${pedido}` : ''}`;
  let motivo = null;
  try {
    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
      const t = (await ollamaChat([{ role: 'system', content: sistema }, { role: 'user', content: usuario }], { temperature: tentativa ? 0.2 : 0.4, num_predict: 220 }))
        .replace(/^mensagem:\s*/i, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      motivo = validarWhats(t, fatos, link);
      if (!motivo) return { texto: t, link, fonte: 'ollama', motivo: null };
    }
  } catch (e) { motivo = 'ollama fora'; logErro('rascunho/ollama', e); }
  return { texto: textoModelo(it, link), link, fonte: 'modelo', motivo };
}

async function montarEmail(destino) {
  const segredoCron = segredo('central-prospeccao/cron_secret');
  if (!segredoCron) throw Object.assign(new Error('sem o segredo do link de sair no PC'), { http: 500 });
  const r = await rodar(process.execPath, [MONTAR_MJS], {
    timeout: 20000, cwd: path.dirname(MONTAR_MJS), input: JSON.stringify(destino),
    env: { PATH: '/usr/bin:/bin', HOME, NODE_NO_WARNINGS: '1', CRON_SECRET: segredoCron },
  });
  let d = null;
  try { d = JSON.parse(r.stdout); } catch { /* nada */ }
  if (!d || d.erro || !d.assunto || !d.texto) throw Object.assign(new Error(`não consegui montar o e-mail (${d && d.erro ? d.erro : r.estourou ? 'demorou' : 'saída inválida'})`), { http: 500 });
  return d;
}

async function rascunho(corpo) {
  const cnpj = (txt(corpo.id) || txt(corpo.cnpj)).replace(/\D/g, '');
  const canal = txt(corpo.canal);
  if (cnpj.length !== 14) return { http: 400, erro: 'Faltou o negócio (CNPJ com 14 dígitos).' };
  if (!['email', 'whatsapp', 'telegram'].includes(canal)) return { http: 400, erro: 'Canal tem que ser email, whatsapp ou telegram.' };
  const pedido = txt(corpo.pedido).replace(/[<>]/g, '').trim().slice(0, 200);
  let reg = filaPorCnpj.get(cnpj);
  // CNPJ desconhecido: recarrega a fila no máximo 1x por minuto (cada carga fria leva 13–21 s no banco)
  if (!reg && Date.now() - filaEstado.em > 60000) { await obterFila(true); reg = filaPorCnpj.get(cnpj); }
  if (!reg) return { http: 404, erro: 'Esse negócio saiu da fila (já contatado, pediu pra sair ou mudou). Atualiza a fila.' };
  const it = reg.it;
  const ref = crypto.randomBytes(5).toString('hex');
  if (canal === 'email') {
    if (!it.email || !/^[^\s@<>()"',;:\\]+@[^\s@<>()"',;:\\]+\.[a-z]{2,}$/i.test(it.email)) return { http: 409, erro: 'Esse negócio não tem e-mail válido no cadastro.' };
    const destino = { ...it.destino, ref };
    const e = await montarEmail(destino);
    return {
      http: 200, canal, cnpj, ref, assunto: e.assunto, texto: e.texto, aprovado: true, fonte: 'texto-aprovado',
      link: `mailto:${it.email}?subject=${encodeURIComponent(e.assunto)}&body=${encodeURIComponent(e.texto)}`,
      avisos: ['Texto aprovado em 28/09 — o mesmo do robô, sem mudar uma vírgula.', 'Um por vez: você abre, envia no seu app e volta pra marcar Enviei'],
    };
  }
  if (canal === 'whatsapp' && !(it.linha === 'celular' && it.telefone && /^55\d{2}9\d{8}$/.test(it.telefone))) {
    return { http: 409, erro: it.linha === 'fixo' ? 'O telefone desse negócio é fixo — sem WhatsApp. Tenta e-mail ou Telegram.' : it.linha === 'contador' ? 'Esse telefone aparece em vários CNPJs (cara de contador) — melhor não.' : 'Esse negócio não tem celular no cadastro.' };
  }
  const w = await textoWhatsApp(it, ref, canal, pedido);
  const avisos = [canal === 'whatsapp' ? 'Texto de WhatsApp ainda sem aprovação formal — revise antes de enviar' : 'Texto ainda sem aprovação formal — revise antes de enviar'];
  if (w.fonte === 'modelo') avisos.push('Usei o modelo padrão (a versão personalizada não passou na checagem).');
  if (canal === 'whatsapp') {
    return { http: 200, canal, cnpj, ref, texto: w.texto, linkRelatorio: w.link, aprovado: false, fonte: w.fonte, link: `https://wa.me/${it.telefone}?text=${encodeURIComponent(w.texto)}`, avisos };
  }
  // o Telegram põe a URL em cima do texto: no lugar do link fica "(link acima)"
  const textoTg = w.texto.replace(w.link, '(link acima)');
  avisos.push('No Telegram você escolhe o contato na hora de compartilhar.');
  return { http: 200, canal, cnpj, ref, texto: textoTg, linkRelatorio: w.link, aprovado: false, fonte: w.fonte, link: `https://t.me/share/url?url=${encodeURIComponent(w.link)}&text=${encodeURIComponent(textoTg)}`, avisos };
}

const STATUS_REGISTRO = { enviei: 'contatado', respondeu: 'respondeu', 'pediu-sair': 'descartado', descartar: 'descartado' };
async function registro(corpo) {
  const cnpj = txt(corpo.cnpj).replace(/\D/g, '');
  const canal = txt(corpo.canal);
  const acao = txt(corpo.acao);
  const ref = txt(corpo.ref).toLowerCase();
  if (cnpj.length !== 14) return { http: 400, erro: 'CNPJ tem que ter 14 dígitos.' };
  if (!['email', 'whatsapp', 'telegram'].includes(canal)) return { http: 400, erro: 'Canal tem que ser email, whatsapp ou telegram.' };
  if (!STATUS_REGISTRO[acao]) return { http: 400, erro: 'Ação tem que ser enviei, respondeu, pediu-sair ou descartar.' };
  if (!/^[0-9a-f]{10}$/.test(ref)) return { http: 400, erro: 'Ref inválida (10 caracteres hexadecimais do rascunho).' };
  const p = partesData(new Date());
  const status = STATUS_REGISTRO[acao];
  const notas = `${canal} manual ${p.day}/${p.month} ref=${ref} (campus)${acao === 'pediu-sair' ? ' pediu pra sair' : ''}`;
  const r = await fetch(`${CENTRAL}/api/prospects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Central': '1' }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ cnpj, frente: 'jobpago', status, notas }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) return { http: 502, erro: 'A Central não gravou — tenta de novo daqui a pouco.' };
  tirados.set(cnpj, Date.now());
  invalidar('manchete:prospeccao-robo');
  return { http: 200, ok: true, status, mensagem: acao === 'enviei' ? 'Marcado como contatado. Próximo!' : 'Anotado na Central.' };
}

/* ================================================================ HTTP */

function enviar(res, status, obj) {
  if (res.headersSent) { try { res.end(); } catch { /* nada */ } return; }
  for (const h of ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers']) res.removeHeader(h);
  const corpo = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': Buffer.byteLength(corpo) });
  res.end(corpo);
}

function lerJSON(req, limite = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const tam = Number(req.headers['content-length'] || 0);
    if (tam > limite) { req.resume(); reject(Object.assign(new Error('corpo grande demais'), { http: 413 })); return; }
    const pedacos = [];
    let total = 0;
    let parou = false;
    req.on('data', (c) => {
      if (parou) return;
      total += c.length;
      if (total > limite) { parou = true; reject(Object.assign(new Error('corpo grande demais'), { http: 413 })); req.resume(); return; }
      pedacos.push(c);
    });
    req.on('end', () => {
      if (parou) return;
      const txt = Buffer.concat(pedacos).toString('utf8').trim();
      if (!txt) { resolve({}); return; }
      try {
        const j = JSON.parse(txt);
        if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('não é objeto');
        resolve(j);
      } catch { reject(Object.assign(new Error('JSON inválido'), { http: 400 })); }
    });
    req.on('error', (e) => { if (!parou) reject(e); });
  });
}

const responderCom = (res, r) => { const { http = 200, ...resto } = r; enviar(res, http, resto); };

export default async function handleCampus(req, res, pathname, parsedUrl) {
  const rota = String(pathname || '').slice('/api/campus'.length) || '/';
  try {
    for (const h of ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers']) res.removeHeader(h);
    const host = String(req.headers.host || '').toLowerCase();
    if (!HOSTS_OK.has(host) && !host.endsWith(`:${PORTA}`) && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.endsWith('.ts.net')) return enviar(res, 403, { erro: 'host não permitido' });

    if (req.method === 'GET') {
      switch (rota) {
        case '/estado': return enviar(res, 200, await montarEstado());
        case '/monetizacao': {
          const t = await fsp.readFile(MONETIZACAO, 'utf8');
          return enviar(res, 200, JSON.parse(t));
        }
        case '/prospeccao/fila':
          try { return enviar(res, 200, await rotaFila(parsedUrl)); } catch (e) { logErro('fila', e); return enviar(res, 503, { erro: 'A fila não carregou agora (o banco de CNPJ ou o túnel pode estar fora). Tenta de novo em 1 min.' }); }
        case '/prospeccao/robo': {
          const r = await estadoRobo();
          return enviar(res, 200, { ...r, proximo: r.proximo ? r.proximo.toISOString() : null, ultimoDisparo: r.ultimoDisparo ? r.ultimoDisparo.toISOString() : null });
        }
        default: return enviar(res, 404, { erro: 'rota não existe' });
      }
    }

    if (req.method === 'POST') {
      if (req.headers['x-campus'] !== '1') { req.resume(); return enviar(res, 403, { erro: 'falta o cabeçalho X-Campus' }); }
      let corpo;
      try { corpo = await lerJSON(req); } catch (e) { return enviar(res, e.http || 400, { erro: e.message }); }
      switch (rota) {
        case '/acordar': return responderCom(res, await acordar(txt(corpo.slug)));
        case '/dormir': return responderCom(res, await dormir(txt(corpo.slug)));
        case '/bom-dia': return enviar(res, 200, await bomDia());
        case '/conversar': return responderCom(res, await conversar(corpo));
        case '/acao': {
          const slug = txt(corpo.slug), id = txt(corpo.id);
          if (!roster().porSlug.has(slug)) return enviar(res, 404, { erro: 'Não conheço essa agente.' });
          const cap = ACOES[slug] && Object.prototype.hasOwnProperty.call(ACOES[slug], id) ? ACOES[slug][id] : null;
          if (!cap) return enviar(res, 404, { erro: 'Isso ela não faz por botão — pergunta na conversa.' });
          try {
            const r = await Promise.race([cap.fn(), sleep(9000).then(() => { throw Object.assign(new Error('demorou'), { demorou: true }); })]);
            return enviar(res, 200, { titulo: r.titulo, texto: r.texto, itens: Array.isArray(r.itens) ? r.itens.slice(0, 20) : undefined });
          } catch (e) {
            logErro(`acao ${slug}/${id}`, e);
            return enviar(res, 502, { erro: e.demorou ? 'Demorou demais pra responder (8 s).' : `Não consegui ler agora (${e.status ? `respondeu ${e.status}` : e.name === 'TimeoutError' ? 'tempo esgotado' : 'fora do ar?'}).` });
          }
        }
        case '/prospeccao/rascunho':
          try { return responderCom(res, await rascunho(corpo)); } catch (e) { logErro('rascunho', e); return enviar(res, e.http || 503, { erro: e.http ? e.message : 'A fila não carregou agora — tenta de novo em 1 min.' }); }
        case '/prospeccao/registro':
          try { return responderCom(res, await registro(corpo)); } catch (e) { logErro('registro', e); return enviar(res, 502, { erro: 'A Central não respondeu — tenta de novo.' }); }
        default: return enviar(res, 404, { erro: 'rota não existe' });
      }
    }

    req.resume();
    return enviar(res, 405, { erro: 'método não permitido' });
  } catch (e) {
    logErro(`rota ${rota}`, e);
    return enviar(res, 500, { erro: 'Deu ruim aqui no servidor do campus.' });
  }
}

// aquece o cache logo que o módulo carrega (o primeiro /estado da manhã já sai quente)
setTimeout(() => { montarEstado().catch(() => {}); }, 1500).unref?.();
