// Campus — casca do app: renderer, mundo, agentes, estado → lugar, loop e conversa com a UI.
// ?stubs=1 usa mundo/personagem de teste (campus/dev/stubs) · ?mock=1 usa API de teste
// (?mock=offline simula o PC dormindo) · ?hora=7.5 fixa a hora do céu.
import { api, instalarMock } from './api.js';
import { criarCamera } from './camera.js';
import { criarUI } from './ui.js';

const THREE = window.THREE;
const params = new URLSearchParams(location.search);
const MODO_DEV = params.has('stubs') || params.has('mock') || params.has('dev');
const REDUZIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------ ajustes
const LS = {
  ler(k, padrao) {
    try { const v = localStorage.getItem(k); return v == null ? padrao : JSON.parse(v); } catch { return padrao; }
  },
  gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado etc. */ } },
};
const qualidadePadrao = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600 ? 'celular' : 'pc';
const ajustes = {
  acordarAoAbrir: LS.ler('campus.acordarAoAbrir', true),
  voz: LS.ler('campus.voz', false),
  qualidade: params.get('qualidade') || LS.ler('campus.qualidade', qualidadePadrao),
};
if (ajustes.qualidade !== 'pc') ajustes.qualidade = 'celular';

function horaAgora() {
  const q = params.get('hora');
  if (q != null && q !== '' && !isNaN(parseFloat(q))) return ((parseFloat(q) % 24) + 24) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
function periodo(h) { return h >= 19 || h < 5 ? 'noite' : h >= 12 ? 'tarde' : 'manha'; }
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ atividades
const ROUPA_ACADEMIA = new Set(['esteira', 'halteres', 'yoga', 'alongando', 'bicicleta']);
const rand = (a, b) => a + Math.random() * (b - a);

// ------------------------------------------------------------------ estado global
const agentes = new Map(); // slug -> Ag
let ultimoEstado = null;
let offline = false;
let falhasSeguidas = 0;
let mundo = null, cam = null, renderer = null, scene = null, ui = null;
let criarPersonagemReal = null, criarPersonagemStub = null;
let relogio = 0;
let vozes = [];
const ocupacao = new Map(); // slug -> 'acordando' | 'dormindo' | 'vindo'
let selecionada = null;
let dentroDoVoo = true;

/*
 Ag = {
   slug, dados (ficha + estado), p (Personagem),
   modo: 'dormir'|'trabalho'|'lazer'|'problema'|null, deitada: bool, andando: bool,
   posto, gen, proximaTroca, lazerAtual, chamada: bool, voltaEm
 }
*/

// ------------------------------------------------------------------ boot
async function boot() {
  ui = criarUI(ctxUI());
  document.documentElement.dataset.periodo = periodo(horaAgora());
  ui.loader.passo('Abrindo as persianas', 0.08);

  if (params.has('mock')) {
    const { criarMock } = await import('../dev/stubs/api-mock.js');
    instalarMock(criarMock(params.get('mock') || '1'));
  }

  // pede o estado já, em paralelo com a montagem do 3D
  const promessaEstado = api.estado().then((r) => ({ ok: true, r }), (e) => ({ ok: false, e }));

  // ---- renderer ----
  const canvas = document.getElementById('cena');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: ajustes.qualidade === 'pc', powerPreference: 'high-performance', alpha: false });
  } catch (e) {
    console.error(e);
    ui.loader.erro('Esse navegador não conseguiu abrir o 3D. Tenta no Chrome do celular.');
    return;
  }
  const dprMax = ajustes.qualidade === 'pc' ? 1.75 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprMax));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = ajustes.qualidade === 'pc' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); ui.toast('O 3D travou — recarrega a página que volta.', 'erro', 8000); });

  scene = new THREE.Scene();
  cam = criarCamera(canvas, { reduzido: REDUZIDO, raioMax: 130 });
  redimensionar();

  // ---- módulos do mundo e das personagens ----
  ui.loader.passo('Montando o prédio', 0.25);
  const usarStubs = params.has('stubs');
  let modMundo, modPers;
  const stubs = [];
  if (usarStubs) {
    [modMundo, modPers] = await Promise.all([import('../dev/stubs/mundo.js'), import('../dev/stubs/personagem.js')]);
  } else {
    try { modMundo = await import('./mundo.js'); } catch (e) { console.error('[campus] mundo.js não carregou, usando o provisório', e); modMundo = await import('../dev/stubs/mundo.js'); stubs.push('mundo'); }
    try { modPers = await import('./personagem.js'); } catch (e) { console.error('[campus] personagem.js não carregou, usando o provisório', e); modPers = await import('../dev/stubs/personagem.js'); stubs.push('personagens'); }
  }
  criarPersonagemReal = modPers.criarPersonagem;
  try {
    mundo = modMundo.criarMundo(scene, renderer, { qualidade: ajustes.qualidade });
  } catch (e) {
    console.error('[campus] criarMundo falhou, usando o provisório', e);
    const s = await import('../dev/stubs/mundo.js');
    while (scene.children.length) scene.remove(scene.children[0]);
    mundo = s.criarMundo(scene, renderer, { qualidade: ajustes.qualidade });
    stubs.push('mundo');
  }
  aplicarHora();
  ui.loader.passo('Chamando as meninas', 0.5);

  // ---- quem existe (estado ao vivo > roster estático > memória) ----
  const resp = await Promise.race([promessaEstado, new Promise((r) => setTimeout(() => r(null), 4500))]);
  let lista = null;
  if (resp?.ok) {
    lista = listaDe(resp.r);
    ultimoEstado = resp.r;
    guardarRoster(lista);
  } else {
    lista = await rosterReserva();
    if (resp && !resp.ok) marcarOffline(true);
  }
  ui.loader.passo('Acordando quem tá de pé', 0.72);
  for (const d of lista) criarAgente(d);
  aplicarEstado(lista, { teleporte: true });
  if (resp == null) {
    // o estado demorou: entra assim mesmo e aplica quando chegar (com animação)
    promessaEstado.then((x) => { if (x.ok) receberEstado(x.r); else falhaEstado(x.e); });
  }

  ui.loader.passo('Passando o café', 0.92);
  // ---- voo de abertura: começa alto, fora do anel, e desce girando até a praça ----
  const ci = mundo.camerainicial || { pos: new THREE.Vector3(10, 17, 24), alvo: new THREE.Vector3(0, 1, 0) };
  const s = new THREE.Spherical().setFromVector3(ci.pos.clone().sub(ci.alvo));
  const deAlvo = new THREE.Vector3(0, 2, 0);
  const dePos = new THREE.Vector3().setFromSpherical(new THREE.Spherical(118, 0.62, s.theta + 1.35)).add(deAlvo);
  cam.posicionar(dePos, deAlvo);
  // primeira imagem (compila shaders) antes de sumir com o carregando
  cam.update(0);
  renderer.render(scene, cam.camera);
  if (stubs.length && !usarStubs) setTimeout(() => ui.toast(`Usando ${stubs.join(' e ')} provisório(s) — a versão final ainda não carregou.`, '', 6000), 2500);
  const hh = new Date().getHours();
  ui.loader.passo(hh >= 5 && hh < 12 ? 'Bom dia!' : hh >= 12 && hh < 18 ? 'Boa tarde!' : 'Boa noite!', 1);
  setTimeout(() => {
    ui.loader.sumir();
    if (REDUZIDO) { cam.posicionar(ci.pos, ci.alvo); fimDoVoo(); }
    else { cam.posicionar(dePos, deAlvo); cam.voar({ pos: dePos, alvo: deAlvo }, { pos: ci.pos, alvo: ci.alvo }, 4.6, fimDoVoo); }
  }, 250);

  cam.on('tap', aoTocar);
  window.addEventListener('resize', redimensionar);
  window.visualViewport?.addEventListener('resize', redimensionar);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { atualizarEstado(); aplicarHora(); } });
  setInterval(() => { if (!document.hidden) atualizarEstado(); }, 20000);
  setInterval(aplicarHora, 60000);

  if ('speechSynthesis' in window) {
    const carregarVozes = () => { vozes = speechSynthesis.getVoices().filter((v) => /^pt(-|_)?BR/i.test(v.lang) || /^pt/i.test(v.lang)); };
    carregarVozes();
    speechSynthesis.addEventListener?.('voiceschanged', carregarVozes);
  }
  registrarSW();
  if (MODO_DEV) expor();
  requestAnimationFrame(quadro);
}

function fimDoVoo() {
  dentroDoVoo = false;
  ui.mostrarHud(true);
  if (!offline && ultimoEstado) talvezBomDiaAutomatico();
}

// ------------------------------------------------------------------ roster
function listaDe(r) { return Array.isArray(r?.agentes) ? r.agentes.filter((a) => a && a.slug) : []; }

const CAMPOS_ROSTER = ['slug', 'nome', 'funcao', 'personalidade', 'bordao', 'saudacaoManha', 'cabelo', 'olhos', 'pele', 'altura', 'busto', 'quadril',
  'roupaTrabalho', 'roupaAcademia', 'atividadeTrabalho', 'atividadesLazer', 'zona', 'vozTom', 'accentHex', 'peso', 'ramMB', 'acordaSozinhaDeManha'];
function fichaLimpa(a) {
  const f = {};
  for (const k of CAMPOS_ROSTER) if (a[k] !== undefined) f[k] = a[k];
  if (a.sistema) f.sistema = { slug: a.sistema.slug, titulo: a.sistema.titulo, oQueFaz: a.sistema.oQueFaz };
  return f;
}
function guardarRoster(lista) { LS.gravar('campus.roster.v1', lista.map(fichaLimpa)); }

async function rosterReserva() {
  // sem estado ao vivo: todas dormindo, sem capacidades nem manchete
  const comoDormindo = (f) => ({ ...fichaLimpa(f), status: 'dormindo', podeLigar: false, trabalhando: false, manchete: null, capacidades: [] });
  try {
    const r = await fetch('/data/campus/agentes.json', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (Array.isArray(j?.agentes)) return j.agentes.map(comoDormindo); }
  } catch { /* sem rede */ }
  const mem = LS.ler('campus.roster.v1', []);
  return Array.isArray(mem) ? mem.map(comoDormindo) : [];
}

// ------------------------------------------------------------------ agentes
function criarAgente(d) {
  if (agentes.has(d.slug)) return agentes.get(d.slug);
  let p;
  try { p = criarPersonagemReal(d, { qualidade: ajustes.qualidade }); }
  catch (e) {
    console.error(`[campus] personagem ${d.slug} falhou, usando boneca provisória`, e);
    p = criarPersonagemStubSync(d);
  }
  if (p.hitbox) p.hitbox.userData.slug = d.slug;
  scene.add(p.group);
  const ag = { slug: d.slug, dados: d, p, modo: null, deitada: false, andando: false, posto: null, gen: 0, proximaTroca: 0, lazerAtual: null, chamada: false, voltaEm: 0 };
  agentes.set(d.slug, ag);
  ui.garantirBalao(d);
  return ag;
}
let stubPersMod = null;
import('../dev/stubs/personagem.js').then((m) => { stubPersMod = m; }).catch(() => {});
function criarPersonagemStubSync(d) {
  if (stubPersMod) return stubPersMod.criarPersonagem(d, { qualidade: ajustes.qualidade });
  // último recurso: um marcador simples
  const group = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.1, 4, 8), new THREE.MeshLambertMaterial({ color: d.accentHex || '#f2a33a' }));
  m.position.y = 0.8; group.add(m);
  const cabeca = new THREE.Object3D(); cabeca.position.y = 1.6; group.add(cabeca);
  return { slug: d.slug, ficha: d, group, hitbox: m, cabeca, setAtividade() {}, setRoupa() {}, andarPara(pts, cb) { if (pts?.length) group.position.copy(pts[pts.length - 1]); cb && cb(); }, olharPara() {}, setFalando() {}, setDestaque() {}, update() {}, dispose() {} };
}

function chamarSeguro(ag, metodo, ...args) {
  try { return ag.p[metodo]?.(...args); } catch (e) { console.error(`[campus] ${ag.slug}.${metodo}`, e); }
}

function modoDesejado(d) {
  if (offline) return 'dormir';
  switch (d.status) {
    case 'acordada': return d.trabalhando ? 'trabalho' : 'lazer';
    case 'remota': return 'trabalho';
    case 'com-problema':
    case 'erro': return 'problema';
    default: return 'dormir'; // dormindo, sem-corpo, desconhecido
  }
}

function aplicarEstado(lista, { teleporte = false } = {}) {
  const vistos = new Set();
  for (const d of lista) {
    vistos.add(d.slug);
    const ag = agentes.get(d.slug) || criarAgente(d);
    ag.dados = d;
    if (ag.chamada) continue; // tá com o Allan; ajusta quando voltar
    const alvo = modoDesejado(d);
    if (alvo !== ag.modo || teleporte) irParaModo(ag, alvo, { teleporte });
  }
  atualizarContagens();
  ui.atualizarFolha();
}

function atualizarContagens() {
  let ok = 0, sono = 0, prob = 0;
  for (const ag of agentes.values()) {
    const s = offline ? 'dormindo' : ag.dados.status;
    if (s === 'acordada' || s === 'remota') ok++;
    else if (s === 'com-problema' || s === 'sem-corpo' || s === 'erro') prob++;
    else sono++;
  }
  ui.atualizarContagens({ ok, sono, prob });
}

function postoReserva(ag, zonaId) {
  const z = mundo.zonas?.[zonaId] || mundo.zonas?.[ag.dados.zona] || { centro: new THREE.Vector3(), raio: 4 };
  const a = Math.random() * Math.PI * 2, r = (z.raio || 4) * 0.5 * Math.random();
  const pos = z.centro.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  pos.y = 0;
  return { pos, rotY: Math.atan2(-pos.x, -pos.z), zona: zonaId, atividade: 'parada', reserva: true };
}

function reservar(ag, atividade, zonaReserva) {
  try { mundo.liberarPosto(ag.slug); } catch (e) { console.error(e); }
  let posto = null;
  try { posto = mundo.reservarPosto(atividade, ag.slug); } catch (e) { console.error(e); }
  return posto || postoReserva(ag, zonaReserva || ag.dados.zona);
}

function irParaModo(ag, modo, { teleporte = false } = {}) {
  ag.modo = modo;
  const d = ag.dados;
  if (modo === 'dormir') {
    levarPara(ag, reservar(ag, 'dormindo', 'dormitorio'), { roupaFinal: 'pijama', teleporte });
  } else if (modo === 'trabalho' || modo === 'problema') {
    const posto = reservar(ag, d.atividadeTrabalho || 'computador', d.zona);
    levarPara(ag, posto, { roupa: 'trabalho', teleporte, atividadeFinal: modo === 'problema' ? 'parada' : null });
  } else if (modo === 'lazer') {
    const opcoes = (Array.isArray(d.atividadesLazer) && d.atividadesLazer.length ? d.atividadesLazer : ['cafe']);
    let ativ = opcoes[Math.floor(Math.random() * opcoes.length)];
    if (opcoes.length > 1 && ativ === ag.lazerAtual) ativ = opcoes.find((x) => x !== ag.lazerAtual);
    ag.lazerAtual = ativ;
    ag.proximaTroca = relogio + rand(40, 90);
    levarPara(ag, reservar(ag, ativ, 'jardim'), { roupa: ROUPA_ACADEMIA.has(ativ) ? 'academia' : 'trabalho', teleporte });
  }
}

// leva a agente até o posto: levanta (se deitada), troca de roupa, anda e assume a atividade
function levarPara(ag, posto, { roupa = null, roupaFinal = null, atividadeFinal = null, teleporte = false } = {}) {
  const gen = ++ag.gen;
  ag.posto = posto;
  const g = ag.p.group;
  const chegar = () => {
    if (gen !== ag.gen) return;
    ag.andando = false;
    g.position.copy(posto.pos);
    g.rotation.y = posto.rotY || 0;
    if (roupaFinal) chamarSeguro(ag, 'setRoupa', roupaFinal);
    const at = atividadeFinal || posto.atividade || 'parada';
    chamarSeguro(ag, 'setAtividade', at);
    ag.deitada = at === 'dormindo';
  };
  if (teleporte) {
    if (roupa) chamarSeguro(ag, 'setRoupa', roupa);
    chegar();
    return;
  }
  const andar = () => {
    if (gen !== ag.gen) return;
    if (roupa) chamarSeguro(ag, 'setRoupa', roupa);
    let pontos;
    try { pontos = mundo.caminho(g.position.clone(), posto.pos.clone()); } catch (e) { console.error(e); pontos = [posto.pos.clone()]; }
    if (!Array.isArray(pontos) || !pontos.length) pontos = [posto.pos.clone()];
    ag.andando = true;
    chamarSeguro(ag, 'setAtividade', 'andando');
    chamarSeguro(ag, 'andarPara', pontos, chegar);
  };
  if (ag.deitada) {
    // acordando: levanta ao lado da cama, espreguiça e troca de roupa antes de sair andando
    ag.deitada = false;
    const ladoCama = new THREE.Vector3(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y));
    g.position.addScaledVector(ladoCama, 0.95);
    g.position.y = 0;
    chamarSeguro(ag, 'setAtividade', 'parada');
    setTimeout(() => { if (gen === ag.gen) chamarSeguro(ag, 'setAtividade', 'alongando'); }, 500);
    setTimeout(andar, REDUZIDO ? 300 : 1700);
  } else {
    andar();
  }
}

// ------------------------------------------------------------------ "Vem aqui"
function vemAqui(slug) {
  const ag = agentes.get(slug);
  if (!ag) return;
  // ponto na praça, virado pra câmera, sem empilhar quem já veio
  const pa = mundo.pontoAllan ? mundo.pontoAllan.clone() : new THREE.Vector3();
  const dirCam = cam.camera.position.clone().sub(pa); dirCam.y = 0;
  if (dirCam.lengthSq() < 0.01) dirCam.set(0, 0, 1);
  dirCam.normalize();
  const lado = new THREE.Vector3(dirCam.z, 0, -dirCam.x);
  const ja = [...agentes.values()].filter((a) => a.chamada && a !== ag).length;
  const destino = pa.clone().addScaledVector(dirCam, 1.4).addScaledVector(lado, (ja % 2 ? 1 : -1) * Math.ceil(ja / 2) * 1.1);
  destino.y = 0;

  const gen = ++ag.gen;
  ag.chamada = true;
  ag.voltaEm = 0;
  try { mundo.liberarPosto(slug); } catch { /* ok */ }
  ocupacao.set(slug, 'vindo');
  ui.atualizarFolha();
  ui.toast(`A ${ag.dados.nome} tá vindo até você`);
  selecionar(slug, { semFoco: true, manterFolha: true });
  cam.follow(ag.p.group, { raio: 9, altura: 1.1 });

  const andar = () => {
    if (gen !== ag.gen) return;
    let pontos;
    try { pontos = mundo.caminho(ag.p.group.position.clone(), destino.clone()); } catch { pontos = [destino.clone()]; }
    if (!pontos?.length) pontos = [destino.clone()];
    ag.andando = true;
    chamarSeguro(ag, 'setAtividade', 'andando');
    chamarSeguro(ag, 'andarPara', pontos, () => {
      if (gen !== ag.gen) return;
      ag.andando = false;
      ocupacao.delete(slug);
      ag.p.group.position.copy(destino);
      const olho = cam.camera.position.clone(); olho.y = 0;
      chamarSeguro(ag, 'olharPara', olho);
      chamarSeguro(ag, 'setAtividade', 'acenando');
      const d = ag.dados;
      const hAgora = new Date().getHours();
      const oi = hAgora >= 5 && hAgora < 12 && d.saudacaoManha
        ? String(d.saudacaoManha).replace('{manchete}', typeof d.manchete === 'string' ? d.manchete.replace(/\.$/, '') : 'tudo tranquilo por aqui')
        : `Oi, Allan! ${d.bordao || 'Tô aqui.'}`;
      falar(slug, oi, { soVoz: false });
      setTimeout(() => { if (gen === ag.gen) chamarSeguro(ag, 'setAtividade', 'parada'); }, 2600);
      cam.unfollow();
      const alvoCam = destino.clone(); alvoCam.y = 1.1;
      // de frente pra ela, um pouco mais baixo que a vista geral (dá pra ver o rosto e o aceno)
      const thetaFrente = Math.atan2(olho.x - destino.x, olho.z - destino.z);
      cam.focus(alvoCam, 6.5, { duracao: 1.0, theta: thetaFrente, phi: 1.2 });
      ui.abrirChat(slug);
      ui.dizer(slug, oi); // o "oi" também aparece escrito na conversa
      ui.atualizarFolha();
    });
  };
  if (ag.deitada) {
    ag.deitada = false;
    const g = ag.p.group;
    g.position.addScaledVector(new THREE.Vector3(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y)), 0.95);
    g.position.y = 0;
    chamarSeguro(ag, 'setAtividade', 'parada');
    setTimeout(andar, REDUZIDO ? 200 : 1200);
  } else andar();
}

function liberarChamada(ag, atraso = 9) {
  if (!ag?.chamada) return;
  ag.voltaEm = relogio + atraso;
}

// ------------------------------------------------------------------ fala
function falar(slug, texto, { soVoz = false } = {}) {
  const ag = agentes.get(slug);
  if (!ag) return;
  const limpo = String(texto || '').replace(/[*_#`>]/g, '').slice(0, 600);
  const duracaoBoca = Math.min(9000, 700 + limpo.length * 55);
  const parar = () => { chamarSeguro(ag, 'setFalando', false); };
  if (ajustes.voz && 'speechSynthesis' in window && limpo) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(limpo);
      u.lang = 'pt-BR';
      u.pitch = Math.max(0, Math.min(2, Number(ag.dados.vozTom) || 1));
      u.rate = 1.04;
      const v = vozes.find((x) => /pt(-|_)BR/i.test(x.lang) && /female|feminina|luciana|francisca|vit[oó]ria|maria|google/i.test(x.name)) || vozes.find((x) => /pt(-|_)BR/i.test(x.lang)) || vozes[0];
      if (v) u.voice = v;
      u.onstart = () => chamarSeguro(ag, 'setFalando', true);
      u.onend = parar; u.onerror = parar;
      speechSynthesis.speak(u);
      return;
    } catch (e) { console.error(e); }
  }
  if (soVoz) return;
  chamarSeguro(ag, 'setFalando', true);
  setTimeout(parar, duracaoBoca);
}

// ------------------------------------------------------------------ seleção e toque
function selecionar(slug, { semFoco = false, manterFolha = false } = {}) {
  const ag = agentes.get(slug);
  if (!ag) return;
  if (selecionada && selecionada !== slug) {
    const ant = agentes.get(selecionada);
    if (ant) chamarSeguro(ant, 'setDestaque', false);
  }
  selecionada = slug;
  chamarSeguro(ag, 'setDestaque', true);
  if (!semFoco) {
    const alvo = new THREE.Vector3();
    ag.p.group.getWorldPosition(alvo);
    alvo.y += ag.deitada ? 0.5 : 1.0;
    const raio = Math.max(6.5, Math.min(cam.esf.radius, 10));
    cam.focus(alvo, raio, { duracao: 0.9, phi: Math.min(cam.esf.phi, 1.12) });
    if (ag.andando) setTimeout(() => { if (selecionada === slug && ag.andando) cam.follow(ag.p.group, { altura: 1.0 }); }, 950);
  }
  if (!manterFolha || ui.slugAberto !== slug) ui.abrirFolha(slug);
}

function aoTocar({ x, y }) {
  if (dentroDoVoo) return;
  const alvos = [];
  for (const ag of agentes.values()) if (ag.p.hitbox) alvos.push(ag.p.hitbox);
  const clicaveis = Array.isArray(mundo.objetosClicaveis) ? mundo.objetosClicaveis : [];
  let hits = [];
  try { hits = cam.escolher(x, y, [...alvos, ...clicaveis]); } catch (e) { console.error(e); }
  for (const h of hits) {
    let o = h.object;
    while (o) {
      if (o.userData?.slug && agentes.has(o.userData.slug)) { selecionar(o.userData.slug); return; }
      if (o.userData?.acao) { executarAcaoMundo(o.userData.acao, o); return; }
      o = o.parent;
    }
  }
  // dedo gordo: a agente mais próxima do toque na tela (até 44 px)
  const v = new THREE.Vector3();
  const w = window.innerWidth, hh = window.innerHeight;
  let melhor = null, melhorD = 44;
  for (const ag of agentes.values()) {
    ag.p.group.getWorldPosition(v); v.y += ag.deitada ? 0.4 : 0.9;
    v.project(cam.camera);
    if (v.z > 1) continue;
    const sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * hh;
    const dist = Math.hypot(sx - x, sy - y);
    if (dist < melhorD) { melhorD = dist; melhor = ag.slug; }
  }
  if (melhor) { selecionar(melhor); return; }
  if (ui.slugAberto) ui.fecharFolha();
}

function executarAcaoMundo(acao) {
  if (acao === 'monetizacao' || acao === 'quadro' || acao === 'dinheiro') ui.abrirQuadro();
  else if (acao === 'equipe') ui.abrirEquipe('todas');
}

// ------------------------------------------------------------------ API: estado e ações
let buscandoEstado = false;
async function atualizarEstado() {
  if (buscandoEstado) return;
  buscandoEstado = true;
  try { receberEstado(await api.estado()); }
  catch (e) { falhaEstado(e); }
  finally { buscandoEstado = false; }
}

function receberEstado(r) {
  const lista = listaDe(r);
  ultimoEstado = r;
  falhasSeguidas = 0;
  if (offline) marcarOffline(false);
  if (lista.length) guardarRoster(lista);
  aplicarEstado(lista);
  if (!dentroDoVoo) talvezBomDiaAutomatico();
}

function falhaEstado(e) {
  falhasSeguidas++;
  console.warn('[campus] /estado falhou:', e?.message || e);
  // na abertura cai direto; depois espera 2 falhas seguidas (soluço do Tailscale)
  if (!offline && (falhasSeguidas >= 2 || !ultimoEstado)) marcarOffline(true);
}

function marcarOffline(b) {
  offline = b;
  ui?.setOffline(b);
  if (agentes.size) aplicarEstado([...agentes.values()].map((a) => a.dados));
}

async function bomDia({ automatico = false } = {}) {
  ui.setBomDiaOcupado(true);
  try {
    const r = await api.bomDia();
    const ac = r?.acordadas?.length || 0, ja = r?.jaEstavam?.length || 0, rec = r?.recusadas || [];
    if (ac) ui.toast(`☀️ ${ac === 1 ? 'Acordei 1 agente' : `Acordei ${ac} agentes`}${ja ? ` · ${ja} já tavam de pé` : ''}`);
    else ui.toast(automatico ? '☀️ Bom dia! Todo mundo que acorda cedo já tava de pé.' : '☀️ Todo mundo que acorda cedo já tava de pé.');
    for (const x of rec.slice(0, 3)) {
      const nome = agentes.get(x.slug)?.dados.nome || x.slug;
      ui.toast(`${nome} ficou dormindo: ${x.motivo || 'sem motivo informado'}`, 'erro', 6000);
    }
  } catch (e) {
    ui.toast(`Não deu pra acordar a turma: ${e.message}`, 'erro');
  } finally {
    ui.setBomDiaOcupado(false);
    atualizarEstado();
  }
}

function talvezBomDiaAutomatico() {
  if (!ajustes.acordarAoAbrir) return;
  const h = new Date().getHours();
  if (h < 5 || h >= 12) return;
  const hoje = hojeLocal();
  if (LS.ler('campus.bomDiaEm', null) === hoje) return;
  if (sessionFlag) return;
  sessionFlag = true;
  LS.gravar('campus.bomDiaEm', hoje);
  bomDia({ automatico: true });
}
let sessionFlag = false;

async function acordar(slug) {
  const ag = agentes.get(slug);
  ocupacao.set(slug, 'acordando'); ui.atualizarFolha();
  try {
    const r = await api.acordar(slug);
    if (r?.ok === false) ui.toast(r.mensagem || 'Ela não quis acordar agora.', 'erro', 6000);
    else ui.toast(r?.mensagem || `${ag?.dados.nome || 'Ela'} acordou!`);
  } catch (e) {
    ui.toast(e.dados?.mensagem || `Não deu pra acordar: ${e.message}`, 'erro', 6000);
  } finally {
    ocupacao.delete(slug);
    await atualizarEstado();
    ui.atualizarFolha();
  }
}

async function dormir(slug) {
  const ag = agentes.get(slug);
  ocupacao.set(slug, 'dormindo'); ui.atualizarFolha();
  try {
    const r = await api.dormir(slug);
    if (r?.ok === false) ui.toast(r.mensagem || 'Ela não conseguiu dormir agora.', 'erro', 6000);
    else ui.toast(r?.mensagem || `${ag?.dados.nome || 'Ela'} foi dormir.`);
  } catch (e) {
    ui.toast(e.dados?.mensagem || `Não deu: ${e.message}`, 'erro', 6000);
  } finally {
    ocupacao.delete(slug);
    await atualizarEstado();
    ui.atualizarFolha();
  }
}

// ------------------------------------------------------------------ contexto da UI
function dadosUI(ag) {
  const d = { ...ag.dados };
  if (offline) { d.status = 'dormindo'; d.motivo = 'Sem sinal do PC agora'; d.podeLigar = false; d.trabalhando = false; }
  if (typeof d.manchete !== 'string') d.manchete = null;
  if (!Array.isArray(d.capacidades)) d.capacidades = [];
  return d;
}

function ctxUI() {
  return {
    agente: (slug) => { const ag = agentes.get(slug); return ag ? dadosUI(ag) : null; },
    agentes: () => [...agentes.values()].map(dadosUI),
    ajustes: () => ({ ...ajustes }),
    salvarAjuste(k, v) {
      ajustes[k] = v;
      LS.gravar(`campus.${k}`, v);
      if (k === 'voz' && !v && 'speechSynthesis' in window) speechSynthesis.cancel();
    },
    testarVoz() { if (selecionada) falar(selecionada, 'Voz ligada!', { soVoz: true }); },
    bomDia: () => bomDia(),
    acordar, dormir, vemAqui,
    selecionar: (slug) => selecionar(slug),
    ocupado: (slug) => ocupacao.get(slug) || '',
    falar: (slug, t) => falar(slug, t),
    aoPensar(slug, b) {
      const ag = agentes.get(slug);
      if (ag && ag.chamada && !ag.andando) chamarSeguro(ag, 'setAtividade', b ? 'falando' : 'parada');
    },
    tentarDeNovo: () => { falhasSeguidas = 0; atualizarEstado(); },
    aoAlturaFolha(h) {
      const largo = window.innerWidth >= 760;
      cam?.setOffset(largo && ui?.slugAberto ? 218 : 0, h / 2);
    },
    aoFecharFolha(slug, trocando) {
      const ag = agentes.get(slug);
      if (ag) { chamarSeguro(ag, 'setDestaque', false); liberarChamada(ag); }
      if (!trocando) { selecionada = null; cam?.unfollow(); }
    },
    aoMudarCobertura() {},
  };
}

// ------------------------------------------------------------------ loop
const vTmp = new THREE.Vector3();
let ultimoT = performance.now();
let amostraFps = { n: 0, t: 0, baixou: false };

function quadro(agora) {
  requestAnimationFrame(quadro);
  const dt = Math.min(0.05, Math.max(0, (agora - ultimoT) / 1000));
  ultimoT = agora;
  relogio += dt;

  try { mundo.update?.(dt, relogio); } catch (e) { console.error(e); mundo.update = null; }
  for (const ag of agentes.values()) {
    try { ag.p.update(dt, relogio); } catch (e) { console.error(`[campus] update ${ag.slug}`, e); ag.p.update = () => {}; }
    // lazer: troca de atividade a cada 40–90 s
    if (ag.modo === 'lazer' && !ag.chamada && !ag.andando && relogio > ag.proximaTroca) irParaModo(ag, 'lazer');
    // chamada que acabou: volta pro posto
    if (ag.chamada && ag.voltaEm && relogio > ag.voltaEm && ui.slugAberto !== ag.slug) {
      ag.chamada = false; ag.voltaEm = 0;
      irParaModo(ag, modoDesejado(ag.dados));
    }
  }
  cam.update(dt);
  focarSombra();
  lodContorno(dt);
  renderer.render(scene, cam.camera);
  posicionarBaloes();
  medirFps(dt);
}

// sombra nítida de perto: o mapa de sombra do sol encolhe e segue o alvo da câmera
const vFrente = new THREE.Vector3();
let sombraGeral = true;
function focarSombra() {
  if (typeof mundo.focoSombra !== 'function') return;
  const r = cam.esf.radius;
  if (r > 26) {
    if (!sombraGeral) { sombraGeral = true; try { mundo.focoSombra(null); } catch (e) { console.error(e); mundo.focoSombra = null; } }
    return;
  }
  sombraGeral = false;
  vFrente.copy(cam.alvo).sub(cam.camera.position); vFrente.y = 0;
  if (vFrente.lengthSq() > 1e-6) vFrente.normalize();
  const meia = Math.max(7, r * 1.5);
  try { mundo.focoSombra({ x: cam.alvo.x + vFrente.x * meia * 0.35, z: cam.alvo.z + vFrente.z * meia * 0.35 }, meia); }
  catch (e) { console.error(e); mundo.focoSombra = null; }
}

// de longe o contorno (casco invertido) some na tela mas dobra os triângulos de cada agente: desliga
let lodT = 0;
function lodContorno(dt) {
  lodT -= dt;
  if (lodT > 0) return;
  lodT = 0.25;
  const pc = cam.camera.position;
  for (const ag of agentes.values()) {
    const c = ag.p.contorno;
    if (!c || !c.isMesh) continue;
    const longe = ag.slug !== selecionada && pc.distanceTo(ag.p.group.position) > 38;
    if (c.visible === longe) c.visible = !longe;
  }
}

const LONGE_BALAO = 82; // até onde a manchete aparece (a vista geral fica a ~60–75 m das agentes)
function posicionarBaloes() {
  const w = window.innerWidth, h = window.innerHeight;
  const esconderTudo = dentroDoVoo || ui.coberto;
  const candidatos = [];
  for (const ag of agentes.values()) {
    const d = ag.dados;
    if (esconderTudo) { ui.posicionarBalao(ag.slug, { visivel: false }); continue; }
    const ref = ag.p.cabeca || ag.p.group;
    ref.getWorldPosition(vTmp);
    vTmp.y += ag.p.cabeca ? 0.32 : 1.9;
    const dist = cam.camera.position.distanceTo(vTmp);
    vTmp.project(cam.camera);
    const naTela = vTmp.z < 1 && vTmp.x > -1.1 && vTmp.x < 1.1 && vTmp.y > -0.97 && vTmp.y < 1.15;
    if (!naTela) { ui.posicionarBalao(ag.slug, { visivel: false }); continue; }
    const x = (vTmp.x + 1) / 2 * w, y = (1 - vTmp.y) / 2 * h;
    const st = offline ? 'dormindo' : d.status;
    const acordada = st === 'acordada' || st === 'remota';
    const problema = st === 'com-problema' || st === 'sem-corpo' || st === 'erro';
    const sel = selecionada === ag.slug;
    let texto = null;
    if (acordada && typeof d.manchete === 'string' && d.manchete) texto = d.manchete;
    else if (problema) texto = st === 'sem-corpo' ? 'Preciso ser reconstruída' : (d.motivo || 'Algo deu errado aqui');
    candidatos.push({ ag, x, y, dist, texto, acordada, problema, sel, dormindo: !acordada && !problema });
  }
  // balão completo: só as 4 mais perto (3 na vista geral, de longe); nome: perto o bastante
  // com a folha aberta, a manchete já tá na folha: no 3D ficam só os nomes
  const folhaAberta = !!ui.slugAberto;
  const comTexto = folhaAberta ? [] : candidatos.filter((c) => c.texto && c.dist < LONGE_BALAO).sort((a, b) => a.dist - b.dist);
  const nCompletos = comTexto.length && comTexto[0].dist > 34 ? 3 : 4;
  const completos = new Set(comTexto.slice(0, nCompletos).map((c) => c.ag.slug));
  ui.inicioBaloes();
  candidatos.sort((a, b) => (b.sel - a.sel) || (completos.has(b.ag.slug) - completos.has(a.ag.slug)) || (a.dist - b.dist));
  for (const c of candidatos) {
    const completo = completos.has(c.ag.slug);
    const mostraNome = c.sel || c.dist < 17 || completo;
    if (!mostraNome) { ui.posicionarBalao(c.ag.slug, { visivel: false }); continue; }
    const op = c.sel ? 1 : completo ? Math.max(0, Math.min(1, (LONGE_BALAO - c.dist) / 10)) : Math.max(0, Math.min(1, (17 - c.dist) / 4));
    if (op <= 0.02) { ui.posicionarBalao(c.ag.slug, { visivel: false }); continue; }
    const classe = [c.dormindo ? 'dormindo' : '', c.problema ? 'problema' : '', c.sel ? 'destaque' : ''].join(' ');
    ui.posicionarBalao(c.ag.slug, {
      visivel: true, x: c.x, y: c.y - 4, opacidade: op,
      modo: completo ? 'completo' : 'nome',
      texto: completo ? c.texto : null, classe,
    });
  }
}

function medirFps(dt) {
  if (amostraFps.baixou || ajustes.qualidade === 'pc' || dentroDoVoo) return;
  amostraFps.n++; amostraFps.t += dt;
  if (amostraFps.t >= 5) {
    const fps = amostraFps.n / amostraFps.t;
    amostraFps.n = 0; amostraFps.t = 0;
    if (fps < 26 && renderer.getPixelRatio() > 1) {
      amostraFps.baixou = true;
      renderer.setPixelRatio(1);
      redimensionar();
      console.info(`[campus] ${fps.toFixed(0)} fps: baixei a resolução pra 1x`);
    }
  }
}

function redimensionar() {
  if (!renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  cam.resize(w, h);
}

function aplicarHora() {
  const h = horaAgora();
  document.documentElement.dataset.periodo = periodo(h);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = periodo(h) === 'noite' ? '#15111c' : '#f8d9b4';
  try { mundo?.setHora?.(h); } catch (e) { console.error(e); }
}

// ------------------------------------------------------------------ PWA
function registrarSW() {
  if (!('serviceWorker' in navigator) || MODO_DEV) return;
  navigator.serviceWorker.register('/campus/sw.js', { scope: '/campus/' }).catch((e) => console.warn('[campus] sw:', e?.message || e));
}

// ------------------------------------------------------------------ depuração (só em ?stubs/?mock/?dev)
function expor() {
  window.__campus = {
    agentes: () => [...agentes.values()].map((a) => ({ slug: a.slug, modo: a.modo, andando: a.andando, deitada: a.deitada, chamada: a.chamada, pos: a.p.group.position.toArray().map((n) => +n.toFixed(2)) })),
    selecionar, vemAqui, bomDia, atualizarEstado,
    posTela(slug) {
      const ag = agentes.get(slug); if (!ag) return null;
      const v = new THREE.Vector3(); ag.p.group.getWorldPosition(v); v.y += 0.9; v.project(cam.camera);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, z: v.z };
    },
    get emVoo() { return dentroDoVoo; },
    cam: () => ({ alvo: cam.alvo.toArray(), raio: cam.esf.radius, phi: cam.esf.phi, theta: cam.esf.theta, pos: cam.camera.position.toArray() }),
    // câmera sem abrir a folha (fotos de conferência)
    focar(alvo, raio = 6, phi = null, theta = null) {
      let p;
      if (typeof alvo === 'string') { const ag = agentes.get(alvo); if (!ag) return false; p = ag.p.group.getWorldPosition(new THREE.Vector3()); p.y += ag.deitada ? 0.4 : 0.9; }
      else p = new THREE.Vector3(alvo[0], alvo[1], alvo[2]);
      cam.unfollow();
      cam.focus(p, raio, { duracao: 0.01, ...(phi != null ? { phi } : {}), ...(theta != null ? { theta } : {}) });
      return true;
    },
    postos: () => [...agentes.values()].map((a) => ({
      slug: a.slug, nome: a.dados.nome, status: a.dados.status, modo: a.modo, deitada: a.deitada, andando: a.andando,
      posto: a.posto ? { zona: a.posto.zona, atividade: a.posto.atividade, reserva: !!a.posto.reserva, pos: a.posto.pos.toArray().map((n) => +n.toFixed(2)), rotY: +(a.posto.rotY || 0).toFixed(2) } : null,
      pos: a.p.group.position.toArray().map((n) => +n.toFixed(2)), rotY: +a.p.group.rotation.y.toFixed(2),
    })),
    alvosEm: (x, y) => {
      const alvos = [...agentes.values()].map((a) => a.p.hitbox).filter(Boolean);
      return cam.escolher(x, y, [...alvos, ...(mundo.objetosClicaveis || [])]).map((h) => `${h.object.name || h.object.type}:${h.object.userData?.slug || h.object.userData?.acao || ''}@${h.distance.toFixed(1)}`);
    },
    clicaveis: () => (Array.isArray(mundo.objetosClicaveis) ? mundo.objetosClicaveis : []).map((o) => {
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      const v = c.clone().project(cam.camera);
      let a = o; while (a && !a.userData?.acao) a = a.parent;
      return { acao: a?.userData?.acao || null, centro: c.toArray().map((n) => +n.toFixed(2)), x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, z: v.z };
    }),
    info: () => ({
      calls: renderer.info.render.calls, triangulos: renderer.info.render.triangles,
      geometrias: renderer.info.memory.geometries, texturas: renderer.info.memory.textures,
      programas: renderer.info.programs?.length ?? null, pixelRatio: renderer.getPixelRatio(),
      qualidade: ajustes.qualidade,
    }),
    ui,
  };
}

boot().catch((e) => {
  console.error('[campus] boot falhou', e);
  try { ui?.loader.erro(`Deu ruim ao abrir o campus: ${e.message}`); } catch { /* sem UI */ }
});
