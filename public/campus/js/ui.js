// Interface do Campus: HUD, folha inferior (conversa + Prospectar da Kira),
// quadro 💰, equipe, ajustes, avisos, carregando e balões projetados.
// Todo texto entra por textContent (nada de innerHTML com dado de fora).
import { api } from './api.js';

// ---------------------------------------------------------------- utilitários
const $ = (sel, raiz = document) => raiz.querySelector(sel);

function el(tag, props = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'vars') for (const [n, val] of Object.entries(v)) e.style.setProperty(n, val);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const f of filhos.flat()) {
    if (f == null || f === false) continue;
    e.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return e;
}

// replaceChildren transforma null em texto "null": filtra antes
function trocar(alvo, ...filhos) { alvo.replaceChildren(...filhos.flat().filter((f) => f != null && f !== false)); }

const STATUS = {
  acordada: 'Acordada',
  remota: 'Na nuvem',
  dormindo: 'Dormindo',
  'com-problema': 'Com problema',
  erro: 'Com problema',
  'sem-corpo': 'Sem corpo',
  desconhecido: 'Sem sinal',
};

const LIMPA_REF = /\s*\((?:[^()]*?)(?:src\/|\/home\/|\.tsx?\b|\.py\b|\.mjs\b|:\d+-\d+)(?:[^()]*?)\)/g;
function limpar(t) { return String(t ?? '').replace(LIMPA_REF, '').replace(/\s{2,}/g, ' ').trim(); }
function mascarar(t) {
  return String(t ?? '')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '•••@•••')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '••••');
}
function primeiroTrecho(t, max = 90) {
  const s = limpar(t);
  const i = s.search(/\.\s/);
  let r = i > 0 ? s.slice(0, i) : s;
  if (r.length > max) r = r.slice(0, max - 1).trimEnd() + '…';
  return r;
}
function corTexto(hex) {
  // texto escuro ou claro sobre a cor do agente (contraste simples por luminância)
  const m = /^#?([\da-f]{6})$/i.exec(hex || '');
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.36 ? '#1d1206' : '#ffffff';
}
const ehKira = (a) => a && (a.slug === 'prospeccao-robo');
const linkSeguro = (href) => /^(mailto:|https:\/\/wa\.me\/|https:\/\/api\.whatsapp\.com\/|https:\/\/t\.me\/)/i.test(href || '');

const TITULOS_M = {
  'avisos-leilao': 'Avisos de leilão',
  'licitacoes-servico': 'Licitações como serviço',
  'parceiro-local-sites': 'Sites com parceiro local',
  'compras-publicas': 'Avisos de compras públicas',
  'corretagem-imoveis': 'Corretagem de imóveis',
  'patrocinio-expedicao': 'Patrocínio da Expedição',
  'design-3d': 'Design 3D sob encomenda',
  'raio-x-relatorio': 'Relatório Raio-X da cidade',
  'recepcao-24h': 'Recepção 24h no WhatsApp',
  'link-checker-auditoria': 'Auditoria de links quebrados',
  'central-prospeccao-produto': 'Central de prospecção (produto)',
  'imovel-inbox-corretores': 'Imóvel-inbox pra corretores',
  'radar-cnpj': 'Radar CNPJ',
  transcricao: 'Transcrição de vídeo',
};
const PRONTIDAO = {
  vendendo: 'Vendendo',
  'pronto-falta-pouco': 'Pronto, falta pouco',
  'precisa-construir': 'Precisa construir',
  'nao-vale-agora': 'Não vale agora',
};

const REGRAS_KIRA = [
  ['☝️', 'Um por vez: você abre, envia no seu app e volta pra marcar Enviei'],
  ['🏢', 'Só empresas (PJ) — MEI/pessoa física ficam de fora (LGPD)'],
  ['📄', 'Dado do cadastro público de CNPJ da Receita. Toda mensagem oferece sair'],
  ['✌️', 'No máximo 2 contatos por negócio'],
];
const CANAIS = {
  email: { nome: 'E-mail', abrir: 'Abrir no E-mail', ico: '✉️' },
  whatsapp: { nome: 'WhatsApp', abrir: 'Abrir no WhatsApp', ico: '💬' },
  telegram: { nome: 'Telegram', abrir: 'Abrir no Telegram', ico: '✈️' },
};
const ACOES_REGISTRO = {
  enviei: { rotulo: 'Enviei ✓', confirma: (n) => `Marcar que você enviou pra ${n}?` },
  respondeu: { rotulo: 'Respondeu', confirma: (n) => `Marcar que ${n} respondeu?` },
  'pediu-sair': { rotulo: 'Pediu pra sair', confirma: (n) => `${n} pediu pra sair? Fica fora pra sempre.` },
  descartar: { rotulo: 'Descartar', confirma: (n) => `Descartar ${n} da fila?` },
};

// ---------------------------------------------------------------- UI
export function criarUI(ctx) {
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hud = $('#hud');
  const folha = $('#folha');
  const corpoFolha = $('#folha-corpo');
  const abaConversa = $('#aba-conversa');
  const abaProsp = $('#aba-prospectar');
  const form = $('#folha-form');
  const input = $('#folha-input');
  const veu = $('#veu');
  const toasts = $('#toasts');

  // ---------- carregando ----------
  const loader = {
    passo(texto, frac) {
      $('#loader-passo').textContent = texto;
      if (frac != null) $('#loader-barra').style.width = `${Math.round(frac * 100)}%`;
    },
    sumir() {
      const l = $('#loader');
      l.classList.add('sumindo');
      setTimeout(() => l.remove(), 900);
    },
    erro(msg) {
      const p = $('#loader-passo');
      p.textContent = msg; p.classList.add('erro-boot');
    },
  };

  // ---------- avisos rápidos ----------
  function toast(msg, tipo = '', ms = 3800) {
    const t = el('div', { class: `toast ${tipo}`, text: msg });
    toasts.append(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    setTimeout(() => { t.classList.add('saindo'); setTimeout(() => t.remove(), 350); }, ms);
  }

  // altura do HUD → posição do aviso offline e dos toasts
  let hudFim = 140;
  const ro = new ResizeObserver(() => {
    hudFim = Math.round(hud.offsetTop + hud.offsetHeight + 10); // sem transform (o HUD pode estar escondido)
    document.documentElement.style.setProperty('--hud-fim', `${hudFim}px`);
  });
  ro.observe(hud);

  // ---------- HUD ----------
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function saudacao(h) { return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function relogio() {
    const d = new Date();
    $('#hud-ola').textContent = `${saudacao(d.getHours())}, Allan`;
    $('#hud-relogio').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    $('#hud-data').textContent = `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
  }
  relogio();
  setInterval(relogio, 10000);

  function atualizarContagens({ ok, sono, prob }) {
    $('#n-ok').textContent = ok;
    $('#n-sono').textContent = sono;
    $('#n-prob').textContent = prob;
    $('[data-tipo="prob"]', hud).dataset.zero = String(prob === 0);
    $('[data-tipo="ok"]', hud).setAttribute('aria-label', `${ok} acordadas — ver lista`);
    $('[data-tipo="sono"]', hud).setAttribute('aria-label', `${sono} dormindo — ver lista`);
    $('[data-tipo="prob"]', hud).setAttribute('aria-label', `${prob} com problema — ver lista`);
  }
  hud.querySelectorAll('.conta').forEach((b) => b.addEventListener('click', () => abrirEquipe(b.dataset.filtro)));
  $('#btn-bomdia').addEventListener('click', () => ctx.bomDia());
  $('#btn-quadro').addEventListener('click', () => abrirQuadro());
  $('#btn-ajustes').addEventListener('click', (e) => { e.stopPropagation(); alternarAjustes(); });
  $('#btn-tentar').addEventListener('click', () => ctx.tentarDeNovo());

  function setBomDiaOcupado(b) { $('#btn-bomdia').setAttribute('aria-busy', b ? 'true' : 'false'); }
  function setOffline(b) { $('#offline').hidden = !b; }

  // ---------- ajustes ----------
  const ajustesEl = $('#ajustes');
  const ajAcordar = $('#aj-acordar');
  const ajVoz = $('#aj-voz');
  function sincronizarAjustes() {
    const a = ctx.ajustes();
    ajAcordar.checked = !!a.acordarAoAbrir;
    ajVoz.checked = !!a.voz;
    ajustesEl.querySelectorAll('[data-q]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.q === a.qualidade)));
  }
  ajAcordar.addEventListener('change', () => ctx.salvarAjuste('acordarAoAbrir', ajAcordar.checked));
  ajVoz.addEventListener('change', () => {
    ctx.salvarAjuste('voz', ajVoz.checked);
    if (ajVoz.checked) ctx.testarVoz?.();
  });
  ajustesEl.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    const antes = ctx.ajustes().qualidade;
    ctx.salvarAjuste('qualidade', b.dataset.q);
    sincronizarAjustes();
    if (antes !== b.dataset.q) {
      const nota = $('#aj-qualidade-nota');
      nota.textContent = '';
      nota.append('Vale ao recarregar · ', el('button', { type: 'button', class: 'resumo-btn', style: { border: 0, background: 'none', color: 'var(--accent-ink)', fontWeight: 700, padding: 0, minHeight: '0', fontSize: '12.5px' }, text: 'recarregar agora', onclick: () => location.reload() }));
    }
  }));
  function alternarAjustes(forcar) {
    const abrir = forcar ?? !ajustesEl.classList.contains('aberto');
    if (abrir) sincronizarAjustes();
    ajustesEl.classList.toggle('aberto', abrir);
    ajustesEl.setAttribute('aria-hidden', String(!abrir));
    $('#btn-ajustes').setAttribute('aria-expanded', String(abrir));
  }
  document.addEventListener('pointerdown', (e) => {
    if (ajustesEl.classList.contains('aberto') && !ajustesEl.contains(e.target) && e.target !== $('#btn-ajustes')) alternarAjustes(false);
  }, true);

  // ---------- painéis (💰 e equipe) ----------
  let painelAberto = null;
  let painelAbertoEm = 0;
  function abrirPainel(id) {
    fecharPainel();
    painelAbertoEm = performance.now();
    const p = $('#' + id);
    p.classList.add('aberto'); p.setAttribute('aria-hidden', 'false');
    veu.classList.add('on');
    painelAberto = p;
    atualizarHud();
    ctx.aoMudarCobertura?.();
    setTimeout(() => $('.btn-fechar', p)?.focus({ preventScroll: true }), 50);
  }
  function fecharPainel() {
    if (!painelAberto) return;
    painelAberto.classList.remove('aberto'); painelAberto.setAttribute('aria-hidden', 'true');
    painelAberto = null;
    veu.classList.toggle('on', false);
    atualizarHud();
    ctx.aoMudarCobertura?.();
  }
  // toque no quadro 3D abre o painel no pointerup; o "click" que o celular dispara logo depois
  // cai no véu recém-aberto e fechava tudo na mesma hora — ignora esse clique fantasma
  veu.addEventListener('click', () => { if (performance.now() - painelAbertoEm > 450) fecharPainel(); });
  document.querySelectorAll('.painel [data-fechar]').forEach((b) => b.addEventListener('click', fecharPainel));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (ajustesEl.classList.contains('aberto')) alternarAjustes(false);
    else if (painelAberto) fecharPainel();
    else if (slugAtual) fecharFolha();
  });

  // ---------- 💰 quadro ----------
  let dadosM = null, filtroM = 'todos', resumoAberto = false;
  const abertosM = new Set();
  async function abrirQuadro() {
    abrirPainel('quadro');
    const corpo = $('#quadro-corpo');
    if (!dadosM) {
      trocar(corpo, el('div', { class: 'esperando' }, el('p', { text: 'Abrindo o caderno de contas…' }), el('div', { class: 'esqueleto' }), el('div', { class: 'esqueleto' }), el('div', { class: 'esqueleto' })));
      try { dadosM = await api.monetizacao(); }
      catch (e) {
        trocar(corpo, el('div', { class: 'cartao' }, el('p', { text: `Não consegui abrir o quadro agora (${e.message}).` }), el('button', { class: 'btn btn-pequeno', type: 'button', style: { marginTop: '10px' }, text: 'Tentar de novo', onclick: () => { fecharPainel(); abrirQuadro(); } })));
        return;
      }
    }
    renderQuadro();
  }
  function renderQuadro() {
    const corpo = $('#quadro-corpo');
    const itens = Array.isArray(dadosM?.itens) ? dadosM.itens : [];
    const ordem = Array.isArray(dadosM?.ranking) ? dadosM.ranking : itens.map((i) => i.id);
    const porId = new Map(itens.map((i) => [i.id, i]));
    const lista = ordem.map((id) => porId.get(id)).filter(Boolean);
    for (const i of itens) if (!ordem.includes(i.id)) lista.push(i);

    const frag = document.createDocumentFragment();
    if (dadosM?.resumo) {
      const txt = limpar(dadosM.resumo);
      const curto = txt.length > 210 && !resumoAberto ? txt.slice(0, 200).trimEnd() + '… ' : txt + ' ';
      frag.append(el('p', { class: 'resumo' }, curto,
        txt.length > 210 ? el('button', { type: 'button', text: resumoAberto ? 'menos' : 'ler tudo', onclick: () => { resumoAberto = !resumoAberto; renderQuadro(); } }) : null));
    }
    const contagem = { todos: lista.length };
    for (const i of lista) contagem[i.prontidao] = (contagem[i.prontidao] || 0) + 1;
    const filtros = el('div', { class: 'filtros', role: 'group', 'aria-label': 'Filtrar por prontidão' });
    for (const [k, nome] of [['todos', 'Todos'], ...Object.entries(PRONTIDAO)]) {
      if (k !== 'todos' && !contagem[k] && k !== 'vendendo') continue;
      filtros.append(el('button', { type: 'button', class: 'filtro', 'aria-pressed': String(filtroM === k), text: `${nome} · ${contagem[k] || 0}`, onclick: () => { filtroM = k; renderQuadro(); } }));
    }
    frag.append(filtros);

    const ul = el('ol', { class: 'ranking' });
    lista.forEach((it, idx) => {
      if (filtroM !== 'todos' && it.prontidao !== filtroM) return;
      const aberto = abertosM.has(it.id);
      const nome = it.nome || it.titulo || TITULOS_M[it.id] || it.id.replace(/-/g, ' ');
      const li = el('li', { class: 'item-m', 'data-aberto': String(aberto) });
      const bt = el('button', { type: 'button', 'aria-expanded': String(aberto), onclick: () => { aberto ? abertosM.delete(it.id) : abertosM.add(it.id); renderQuadro(); } },
        el('span', { class: 'pos', text: String(idx + 1) }),
        el('span', { class: 'nome-m', text: nome }),
        el('span', { class: 'seta', 'aria-hidden': 'true', text: '▾' }),
        el('span', { class: 'linha-m' },
          el('span', { class: 'prontidao', 'data-p': it.prontidao, text: PRONTIDAO[it.prontidao] || it.prontidao }),
          it.preco ? el('span', { class: 'preco-m', text: primeiroTrecho(it.preco.split(/,\s*(?:Pix|sem|com)\b/)[0], 46) }) : null),
        it.receitaPotencial ? el('span', { class: 'receita', text: primeiroTrecho(it.receitaPotencial, 110) }) : null,
      );
      li.append(bt);
      if (aberto) li.append(detalheM(it));
      ul.append(li);
    });
    frag.append(ul);
    trocar(corpo, frag);
  }
  function detalheM(it) {
    const d = el('div', { class: 'detalhe-m' });
    if (it.primeiraAcao) d.append(el('div', { class: 'primeira' }, el('h4', { text: 'Primeira ação' }), el('p', { text: limpar(it.primeiraAcao) })));
    if (Array.isArray(it.oQueFalta) && it.oQueFalta.length) {
      d.append(el('div', {}, el('h4', { text: 'O que falta (e quem faz)' }),
        el('ul', { class: 'falta' }, it.oQueFalta.map((f) => el('li', {},
          el('span', { class: 'quem', 'data-q': f.quem, text: f.quem || '?' }),
          el('span', { text: limpar(f.acao) }),
          f.esforco ? el('span', { class: 'esforco', text: `⏱ ${f.esforco}` }) : null)))));
    }
    const bloco = (t, v) => v ? el('div', {}, el('h4', { text: t }), el('p', { text: limpar(v) })) : null;
    // append(null) vira o texto "null": só entra bloco que existe
    d.append(...[
      bloco('Produto', it.produto),
      bloco('Preço', it.preco),
      bloco('Até o 1º real', it.tempoAtePrimeiroReal),
      bloco('Receita possível', it.receitaPotencial),
      bloco('Canal de venda', it.canalDeVenda),
      bloco('Pra quem', it.publico),
    ].filter(Boolean));
    if (Array.isArray(it.riscos) && it.riscos.length) {
      d.append(el('div', {}, el('h4', { text: 'Riscos' }), el('ul', { class: 'riscos' }, it.riscos.map((r) => el('li', { text: limpar(r) })))));
    }
    return d;
  }

  // ---------- equipe ----------
  let filtroEq = 'todas';
  function grupo(st) {
    if (st === 'acordada' || st === 'remota') return 'acordadas';
    if (st === 'com-problema' || st === 'sem-corpo' || st === 'erro') return 'problema';
    return 'dormindo';
  }
  function abrirEquipe(filtro = 'todas') {
    filtroEq = filtro;
    abrirPainel('equipe');
    renderEquipe();
  }
  function renderEquipe() {
    const corpo = $('#equipe-corpo');
    const todas = ctx.agentes();
    const filtros = el('div', { class: 'filtros', role: 'group', 'aria-label': 'Filtrar a equipe' });
    const nomes = { todas: 'Todas', acordadas: 'Acordadas', dormindo: 'Dormindo', problema: 'Com problema' };
    for (const [k, n] of Object.entries(nomes)) {
      const c = k === 'todas' ? todas.length : todas.filter((a) => grupo(a.status) === k).length;
      filtros.append(el('button', { type: 'button', class: 'filtro', 'aria-pressed': String(filtroEq === k), text: `${n} · ${c}`, onclick: () => { filtroEq = k; renderEquipe(); } }));
    }
    const ul = el('ul', { class: 'equipe' });
    const ordem = { problema: 0, acordadas: 1, dormindo: 2 };
    todas.filter((a) => filtroEq === 'todas' || grupo(a.status) === filtroEq)
      .sort((a, b) => ordem[grupo(a.status)] - ordem[grupo(b.status)] || a.nome.localeCompare(b.nome))
      .forEach((a) => ul.append(el('li', {}, el('button', { type: 'button', onclick: () => { fecharPainel(); ctx.selecionar(a.slug); } },
        avatar(a),
        el('span', { class: 'n', text: a.nome }),
        el('span', { class: 'f', text: a.sistema?.titulo || a.funcao }),
        el('span', { class: 'pill', 'data-status': a.status, text: STATUS[a.status] || a.status })))));
    if (!ul.children.length) ul.append(el('li', { class: 'conversa-vazia', text: 'Ninguém aqui agora.' }));
    trocar(corpo, filtros, ul);
  }

  function avatar(a) {
    return el('span', { class: 'avatar', 'aria-hidden': 'true', vars: { '--ac': a.accentHex || '#f2a33a', '--cabelo': a.cabelo?.cor || a.accentHex }, text: (a.nome || '?')[0] });
  }

  // ================================================================ folha inferior
  let slugAtual = null;
  let abaAtual = 'conversa';
  let estadoFolha = 'fechada'; // fechada | aberta | cheia
  const historicos = new Map(); // slug -> [{tipo, texto, ...}]
  const pendentes = new Set();  // slugs esperando resposta
  const confirmando = { slug: null, acao: null };
  const ultimaRender = { info: '', acoes: '', caps: '' };

  function hist(slug) { if (!historicos.has(slug)) historicos.set(slug, []); return historicos.get(slug); }

  function avisarAltura() {
    // quanto da tela a folha cobre por baixo (a câmera sobe a imagem pela metade disso)
    const larga = window.innerWidth >= 760;
    const h = estadoFolha === 'aberta' && !larga ? alturaPeek() : 0;
    ctx.aoAlturaFolha?.(h, estadoFolha);
  }
  function alturaPeek() { return Math.round(Math.max(330, window.innerHeight * 0.5)); }

  function setEstadoFolha(novo) {
    estadoFolha = novo;
    folha.style.setProperty('--altura', `${alturaPeek()}px`);
    folha.classList.toggle('aberta', novo === 'aberta');
    folha.classList.toggle('cheia', novo === 'cheia');
    folha.setAttribute('aria-hidden', String(novo === 'fechada'));
    atualizarHud();
    avisarAltura();
    ctx.aoMudarCobertura?.();
  }

  function abrirFolha(slug, opcoes = {}) {
    const a = ctx.agente(slug);
    if (!a) return;
    const trocou = slugAtual !== slug;
    if (trocou && slugAtual) ctx.aoFecharFolha?.(slugAtual, true);
    slugAtual = slug;
    confirmando.slug = null;
    if (trocou) {
      abaAtual = opcoes.aba || 'conversa';
      Object.assign(ultimaRender, { info: '', acoes: '', caps: '' });
      trocar(abaConversa, 
        el('div', { id: 'c-info' }), el('div', { id: 'c-acoes', class: 'acoes' }),
        el('div', { id: 'c-caps', class: 'caps' }), el('div', { id: 'c-thread', class: 'conversa', 'aria-live': 'polite' }),
      );
      corpoFolha.scrollTop = 0;
    } else if (opcoes.aba) abaAtual = opcoes.aba;
    folha.style.setProperty('--ac', a.accentHex || '#f2a33a');
    folha.style.setProperty('--sobre-ac', corTexto(a.accentHex));
    input.placeholder = `Fala com a ${a.nome}…`;
    renderCabecalho();
    renderAbas();
    renderConversa();
    if (ehKira(a) && abaAtual === 'prospectar') renderProsp();
    setEstadoFolha(opcoes.cheia ? 'cheia' : (estadoFolha === 'cheia' ? 'cheia' : 'aberta'));
    if (opcoes.focarEntrada && !matchMedia('(pointer: coarse)').matches) setTimeout(() => input.focus({ preventScroll: true }), 300);
    if (opcoes.rolarConversa) setTimeout(rolarFim, 60);
  }

  function fecharFolha() {
    if (!slugAtual) return;
    const s = slugAtual;
    slugAtual = null;
    setEstadoFolha('fechada');
    input.blur();
    ctx.aoFecharFolha?.(s, false);
  }
  $('#folha-fechar').addEventListener('click', fecharFolha);

  function renderCabecalho() {
    const a = ctx.agente(slugAtual);
    if (!a) return;
    const av = $('#folha-avatar');
    av.style.setProperty('--ac', a.accentHex || '#f2a33a');
    av.style.setProperty('--cabelo', a.cabelo?.cor || a.accentHex);
    av.textContent = (a.nome || '?')[0];
    $('#folha-nome').textContent = a.nome;
    const st = $('#folha-status');
    const rotulo = (STATUS[a.status] || a.status) + (a.trabalhando && (a.status === 'acordada' || a.status === 'remota') ? ' · trabalhando' : '');
    trocar(st, el('span', { class: 'pill', 'data-status': a.status, text: rotulo }));
    const extra = [a.funcao, a.peso === 'pesado' ? `pesada (${a.ramMB || '?'} MB)` : null].filter(Boolean).join(' · ');
    $('#folha-funcao').textContent = extra;
  }

  function textoMotivo(a) {
    if (a.status === 'sem-corpo') return `Preciso ser reconstruída${a.motivo ? ` — ${a.motivo}` : ''}. Por isso não tem botão de acordar.`;
    return a.motivo || null;
  }

  function renderAbas() {
    const a = ctx.agente(slugAtual);
    const temProsp = ehKira(a);
    $('#folha-abas').hidden = !temProsp;
    if (!temProsp) abaAtual = 'conversa';
    $('#aba-btn-conversa').setAttribute('aria-selected', String(abaAtual === 'conversa'));
    $('#aba-btn-prospectar').setAttribute('aria-selected', String(abaAtual === 'prospectar'));
    abaConversa.hidden = abaAtual !== 'conversa';
    abaProsp.hidden = abaAtual !== 'prospectar';
    form.hidden = abaAtual !== 'conversa';
  }
  $('#aba-btn-conversa').addEventListener('click', () => { abaAtual = 'conversa'; renderAbas(); });
  $('#aba-btn-prospectar').addEventListener('click', () => {
    abaAtual = 'prospectar'; renderAbas(); renderProsp();
    if (estadoFolha !== 'cheia') setEstadoFolha('cheia');
    if (!prosp.fila && !prosp.carregandoFila) carregarFila();
    carregarRobo();
  });

  // ---------- aba conversa ----------
  function renderConversa() {
    const a = ctx.agente(slugAtual);
    if (!a) return;
    // info: sistema + manchete
    const manchete = typeof a.manchete === 'string' ? a.manchete : null;
    const motivo = textoMotivo(a);
    const chaveInfo = JSON.stringify([a.slug, a.sistema?.titulo, a.sistema?.oQueFaz, manchete, a.status, motivo]);
    if (chaveInfo !== ultimaRender.info) {
      ultimaRender.info = chaveInfo;
      const info = $('#c-info');
      const sis = a.sistema || {};
      const url = typeof sis.url === 'string' && /^https:\/\//.test(sis.url) ? sis.url : null;
      const prob = a.status === 'com-problema' || a.status === 'sem-corpo' || a.status === 'erro';
      trocar(info, 
        motivo ? el('p', { class: `motivo ${prob ? 'prob' : ''}`, text: motivo }) : null,
        manchete ? el('div', { class: 'cartao cartao-manchete' }, el('h3', { text: a.status === 'acordada' || a.status === 'remota' ? 'Agora' : 'Último recado' }), el('p', { text: manchete })) : null,
        el('div', { class: 'cartao cartao-sistema' },
          el('h3', { text: 'Sistema' }),
          el('p', { class: 'titulo', text: sis.titulo || a.funcao || '' }),
          sis.oQueFaz ? el('p', { class: 'desc', text: sis.oQueFaz }) : null,
          url ? el('a', { class: 'btn btn-pequeno', href: url, target: '_blank', rel: 'noopener', style: { marginTop: '8px' }, text: 'Abrir o sistema ↗' }) : null),
      );
    }
    renderAcoes();
    renderCaps();
    renderThread();
  }

  function renderAcoes() {
    const a = ctx.agente(slugAtual);
    if (!a) return;
    const ocupado = ctx.ocupado?.(a.slug) || '';
    const chave = JSON.stringify([a.slug, a.status, a.podeLigar, ocupado, confirmando.slug === a.slug ? confirmando.acao : null, pendentes.has(a.slug)]);
    if (chave === ultimaRender.acoes) return;
    ultimaRender.acoes = chave;
    const box = $('#c-acoes');
    const filhos = [
      el('button', { type: 'button', class: 'btn btn-primario', disabled: pendentes.has(a.slug), onclick: () => enviar(a.slug, 'O que você faz por mim?') }, '✨ O que você faz por mim?'),
      el('button', { type: 'button', class: 'btn', 'aria-busy': ocupado === 'vindo' ? 'true' : null, onclick: () => ctx.vemAqui(a.slug) }, ocupado === 'vindo' ? '🚶‍♀️ Vindo…' : '👋 Vem aqui'),
    ];
    const acordada = a.status === 'acordada' || a.status === 'com-problema';
    if (a.podeLigar && a.status !== 'sem-corpo' && a.status !== 'remota') {
      if (confirmando.slug === a.slug && confirmando.acao === 'dormir') {
        filhos.push(el('div', { class: 'confirma' },
          el('p', { text: `Pôr a ${a.nome} pra dormir? O serviço dela para até você acordar de novo.` }),
          el('button', { type: 'button', class: 'btn btn-pequeno btn-perigo', onclick: () => { confirmando.slug = null; ctx.dormir(a.slug); } }, 'Sim, dormir'),
          el('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => { confirmando.slug = null; renderAcoes(); } }, 'Deixa acordada')));
      } else if (acordada) {
        filhos.push(el('button', { type: 'button', class: 'btn', 'aria-busy': ocupado === 'dormindo' ? 'true' : null, onclick: () => { confirmando.slug = a.slug; confirmando.acao = 'dormir'; renderAcoes(); } }, ocupado === 'dormindo' ? '🌙 Indo…' : '🌙 Dormir'));
      } else {
        filhos.push(el('button', { type: 'button', class: 'btn', 'aria-busy': ocupado === 'acordando' ? 'true' : null, onclick: () => ctx.acordar(a.slug) }, ocupado === 'acordando' ? '⏰ Acordando…' : '⏰ Acordar'));
      }
    }
    trocar(box, ...filhos);
  }

  function renderCaps() {
    const a = ctx.agente(slugAtual);
    const caps = (a?.capacidades || []).filter((c) => c && c.id && c.rotulo && c.tipo === 'leitura' && c.seguroParaUmToque !== false);
    const chave = JSON.stringify([a?.slug, caps.map((c) => c.id), a?.status]);
    if (chave === ultimaRender.caps) return;
    ultimaRender.caps = chave;
    const box = $('#c-caps');
    const dormindo = !(a.status === 'acordada' || a.status === 'remota');
    trocar(box, ...caps.map((c) => el('button', {
      type: 'button', class: 'cap', title: c.descricao || '', 'data-cap': c.id,
      onclick: () => executarCap(a.slug, c),
    }, c.rotulo)));
    box.hidden = !caps.length;
    if (caps.length && dormindo) box.title = 'Ela tá dormindo — pode ser que não responda.';
  }

  function renderThread() {
    const a = ctx.agente(slugAtual);
    if (!a) return;
    const th = $('#c-thread');
    const h = hist(a.slug);
    const filhos = [];
    if (!h.length) {
      const dica = a.status === 'acordada' || a.status === 'remota'
        ? `Pergunta qualquer coisa — a ${a.nome} responde pelo sistema dela.`
        : `A ${a.nome} tá ${a.status === 'sem-corpo' ? 'sem corpo' : 'dormindo'}, mas ainda conversa e explica o que faz.`;
      filhos.push(el('p', { class: 'conversa-vazia', text: dica }));
    }
    const capsOk = new Map((a.capacidades || []).map((c) => [c.id, c]));
    for (const m of h) {
      if (m.tipo === 'allan') filhos.push(el('div', { class: 'msg msg-allan', text: m.texto }));
      else if (m.tipo === 'agente') {
        filhos.push(el('div', { class: 'msg msg-agente' }, m.texto,
          m.fonte === 'regras' ? el('span', { class: 'msg-meta', text: 'resposta pronta (a IA tá cochilando)' }) : null));
        const sug = (m.sugestoes || []).map((id) => capsOk.get(id)).filter((c) => c && c.tipo === 'leitura');
        if (sug.length && m === h[h.length - 1]) {
          filhos.push(el('div', { class: 'sugestoes' }, sug.map((c) => el('button', { type: 'button', class: 'cap', onclick: () => executarCap(a.slug, c) }, c.rotulo))));
        }
      } else if (m.tipo === 'acao') {
        const dl = Array.isArray(m.itens) && m.itens.length
          ? el('dl', {}, m.itens.flatMap((i) => [el('dt', { text: i.rotulo }), el('dd', { text: String(i.valor ?? '') })]))
          : null;
        filhos.push(el('div', { class: 'msg msg-acao' }, el('strong', { text: m.titulo || 'Resultado' }), m.texto ? el('span', { text: m.texto }) : null, dl));
      } else if (m.tipo === 'erro') {
        filhos.push(el('div', { class: 'msg msg-erro', text: m.texto }));
      }
    }
    if (pendentes.has(a.slug)) filhos.push(el('div', { class: 'digitando', 'aria-label': `${a.nome} tá digitando` }, el('i'), el('i'), el('i')));
    trocar(th, ...filhos);
  }

  function rolarFim() {
    corpoFolha.scrollTo({ top: corpoFolha.scrollHeight, behavior: reduzido ? 'auto' : 'smooth' });
  }

  async function enviar(slug, texto) {
    texto = String(texto || '').trim();
    if (!texto || pendentes.has(slug)) return;
    const h = hist(slug);
    const anterior = h.filter((m) => m.tipo === 'allan' || m.tipo === 'agente').slice(-12)
      .map((m) => ({ de: m.tipo === 'allan' ? 'allan' : 'agente', texto: m.texto }));
    h.push({ tipo: 'allan', texto });
    pendentes.add(slug);
    if (slug === slugAtual) { renderThread(); renderAcoes(); rolarFim(); }
    ctx.aoPensar?.(slug, true);
    try {
      const r = await api.conversar(slug, texto, anterior);
      const resposta = String(r?.resposta || '').trim() || 'Hmm, me deu um branco. Pergunta de novo?';
      h.push({ tipo: 'agente', texto: resposta, fonte: r?.fonte, sugestoes: Array.isArray(r?.acoesSugeridas) ? r.acoesSugeridas : [] });
      ctx.falar?.(slug, resposta);
    } catch (e) {
      h.push({ tipo: 'erro', texto: `Não consegui responder agora (${e.message}).` });
    } finally {
      pendentes.delete(slug);
      ctx.aoPensar?.(slug, false);
      if (slug === slugAtual) { renderThread(); renderAcoes(); rolarFim(); }
    }
  }

  async function executarCap(slug, cap) {
    if (pendentes.has(slug)) return;
    const h = hist(slug);
    h.push({ tipo: 'allan', texto: cap.rotulo });
    pendentes.add(slug);
    if (slug === slugAtual) { renderThread(); rolarFim(); if (estadoFolha !== 'cheia') setEstadoFolha('cheia'); }
    try {
      const r = await api.acao(slug, cap.id);
      h.push({ tipo: 'acao', titulo: r?.titulo || cap.rotulo, texto: r?.texto ? mascarar(r.texto) : '', itens: Array.isArray(r?.itens) ? r.itens.map((i) => ({ rotulo: i.rotulo, valor: mascarar(i.valor) })) : [] });
    } catch (e) {
      h.push({ tipo: 'erro', texto: `Não rolou: ${e.message}` });
    } finally {
      pendentes.delete(slug);
      if (slug === slugAtual) { renderThread(); rolarFim(); }
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!slugAtual) return;
    const t = input.value;
    input.value = '';
    enviar(slugAtual, t);
  });
  input.addEventListener('focus', () => { if (estadoFolha === 'aberta') setEstadoFolha('cheia'); setTimeout(rolarFim, 250); });

  // ---------- arrastar a folha ----------
  (() => {
    let ini = null;
    const alvos = [$('#folha-alca'), $('#folha-topo')];
    const down = (e) => {
      if (e.target.closest('button')) return;
      ini = { y: e.clientY, t: performance.now(), base: folha.getBoundingClientRect().top, id: e.pointerId, h: folha.offsetHeight };
      folha.classList.add('arrastando');
      e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!ini || e.pointerId !== ini.id) return;
      const dy = e.clientY - ini.y;
      if (dy < 0 && estadoFolha === 'aberta' && window.innerWidth < 760) {
        // meia altura → cheia: cresce com o dedo
        folha.style.transform = '';
        folha.style.height = `${Math.min(window.innerHeight - 12, ini.h - dy)}px`;
        return;
      }
      folha.style.height = '';
      const topoMin = window.innerHeight - folha.offsetHeight;
      const y = Math.max(topoMin, ini.base + dy) - topoMin;
      folha.style.transform = `translateY(${y}px)`;
    };
    const up = (e) => {
      if (!ini || e.pointerId !== ini.id) return;
      const dy = e.clientY - ini.y;
      const vel = dy / Math.max(1, performance.now() - ini.t);
      folha.classList.remove('arrastando');
      folha.style.transform = '';
      folha.style.height = '';
      ini = null;
      if (Math.abs(dy) < 6) { setEstadoFolha(estadoFolha === 'cheia' ? 'aberta' : 'cheia'); return; }
      if (dy > 70 || vel > 0.6) {
        if (estadoFolha === 'cheia' && dy < 260) setEstadoFolha('aberta'); else fecharFolha();
      } else if (dy < -50 || vel < -0.5) setEstadoFolha('cheia');
      else setEstadoFolha(estadoFolha);
    };
    for (const a of alvos) {
      a.addEventListener('pointerdown', down);
      a.addEventListener('pointermove', move);
      a.addEventListener('pointerup', up);
      a.addEventListener('pointercancel', up);
    }
  })();

  // ================================================================ Prospectar (Kira)
  const prosp = {
    etapa: 'lista', fila: null, carregandoFila: false, erroFila: null, inicioFila: 0,
    robo: null, erroRobo: null,
    item: null, canal: null, pedido: '',
    escrevendo: false, rascunho: null, assunto: '', texto: '', abriu: false,
    confirmar: null, registrando: false,
  };

  async function carregarFila(forcar = false) {
    if (prosp.carregandoFila) return;
    if (prosp.fila && !forcar) return;
    prosp.carregandoFila = true; prosp.erroFila = null; prosp.inicioFila = Date.now();
    renderProsp();
    const tick = setInterval(() => { if (abaAtual === 'prospectar' && prosp.etapa === 'lista') atualizarEspera(); }, 1000);
    try {
      const r = await api.fila(20, forcar);
      prosp.fila = Array.isArray(r?.itens) ? r.itens : [];
      prosp.totalFila = Number.isFinite(Number(r?.total)) ? Number(r.total) : null;
    } catch (e) {
      prosp.erroFila = e.message;
    } finally {
      clearInterval(tick);
      prosp.carregandoFila = false;
      if (abaAtual === 'prospectar') renderProsp();
    }
  }
  function atualizarEspera() {
    const p = $('#espera-txt', abaProsp);
    if (!p) return;
    const s = Math.round((Date.now() - prosp.inicioFila) / 1000);
    p.textContent = s < 4 ? 'A Kira tá separando quem vale contatar…'
      : s < 14 ? `Cruzando o cadastro de CNPJ das cidades do roteiro… ${s}s`
        : `Quase lá — a 1ª busca do dia leva uns 20 s. ${s}s`;
  }
  async function carregarRobo() {
    try { prosp.robo = await api.robo(); prosp.erroRobo = null; }
    catch (e) { prosp.erroRobo = e.message; }
    if (abaAtual === 'prospectar') { const c = $('#robo-card', abaProsp); if (c) c.replaceWith(cartaoRobo()); }
  }

  function lerRobo(r) {
    r = r || {};
    const ligado = !!(r.ativo ?? r.ligado ?? (r.ActiveState ? r.ActiveState === 'active' : false)) || r.habilitado === true || r.UnitFileState === 'enabled';
    const hoje = Number(r.enviadosHoje ?? r.hoje ?? 0) || 0;
    const limite = Number(r.limite ?? 25) || 25;
    let log = r.log ?? r.ultimasLinhas ?? r.journal ?? [];
    if (typeof log === 'string') log = log.split('\n');
    if (!Array.isArray(log)) log = [];
    return { ligado, hoje, limite, ultimo: r.ultimoEnvio ?? r.ultimo ?? null, proximo: r.proximo ?? r.proximoDisparo ?? null, log: log.filter(Boolean).slice(-3).map(mascarar) };
  }
  function quando(v) {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function cartaoRobo() {
    const r = lerRobo(prosp.robo);
    const linha = typeof prosp.robo?.texto === 'string' && /^Robô de e-mail:/.test(prosp.robo.texto)
      ? prosp.robo.texto
      : `Robô de e-mail: ${r.ligado ? 'ligado' : 'desligado'}, ${r.hoje}/${r.limite} hoje`;
    const sub = !prosp.robo && !prosp.erroRobo ? 'conferindo o timer…'
      : prosp.erroRobo ? `não consegui ler o timer (${prosp.erroRobo})`
        : r.ligado ? (r.proximo ? `próximo disparo ${quando(r.proximo)}` : 'timer ligado')
          : (prosp.robo?.comoLigar || 'esperando seu ok — peça no Claude: liga o robô');
    return el('div', { class: 'cartao robo', id: 'robo-card' },
      el('span', { class: 'robo-ico', 'aria-hidden': 'true', text: r.ligado ? '📨' : '😴' }),
      el('div', {}, el('strong', { text: linha }), el('small', { text: sub }),
        r.ultimo ? el('small', { style: { display: 'block' }, text: `último envio: ${quando(r.ultimo)}` }) : null),
      r.log.length ? el('pre', { class: 'robo-log', 'aria-label': 'Últimas linhas do robô', text: r.log.join('\n') }) : null,
    );
  }

  function canaisDo(item) {
    const c = item?.canais || {};
    const wa = c.whatsapp;
    const waOk = wa === true || (wa && typeof wa === 'object' && !!wa.ok);
    const waLinha = wa && typeof wa === 'object' ? wa.linha : null;
    return {
      email: { ok: !!c.email, motivo: c.email ? 'texto aprovado' : 'sem e-mail' },
      whatsapp: { ok: waOk, motivo: waOk ? 'celular' : waLinha === 'fixo' ? 'linha fixa' : waLinha === 'contador' ? 'cara de contador' : 'sem celular' },
      // o link de compartilhar do Telegram não precisa de contato: você escolhe na hora
      telegram: { ok: true, motivo: 'você escolhe' },
    };
  }

  function renderProsp() {
    const a = ctx.agente(slugAtual);
    if (!ehKira(a)) return;
    const filhos = [
      el('ul', { class: 'regras', 'aria-label': 'Regras da prospecção' }, REGRAS_KIRA.map(([i, t]) => el('li', {}, el('span', { 'aria-hidden': 'true', text: i }), el('span', { text: t })))),
      cartaoRobo(),
    ];
    if (prosp.etapa === 'lista') filhos.push(...vistaLista());
    else filhos.push(...vistaCompor());
    trocar(abaProsp, ...filhos);
  }

  function vistaLista() {
    const sub = prosp.fila && prosp.totalFila != null && prosp.totalFila > prosp.fila.length ? ` · ${prosp.fila.length} de ${prosp.totalFila}` : '';
    const titulo = el('div', { class: 'passo-titulo' }, el('h3', { text: `Quem vale contatar hoje${sub}` }),
      prosp.fila && !prosp.carregandoFila ? el('button', { type: 'button', class: 'btn-voltar', onclick: () => carregarFila(true) }, '↻ Atualizar') : null);
    if (prosp.carregandoFila || (!prosp.fila && !prosp.erroFila)) {
      if (!prosp.carregandoFila) setTimeout(() => carregarFila(), 0);
      const box = el('div', { class: 'esperando' }, el('p', { id: 'espera-txt', text: 'A Kira tá separando quem vale contatar…' }),
        el('div', { class: 'esqueleto' }), el('div', { class: 'esqueleto' }), el('div', { class: 'esqueleto' }));
      setTimeout(atualizarEspera, 0);
      return [titulo, box];
    }
    if (prosp.erroFila) {
      return [titulo, el('div', { class: 'cartao' }, el('p', { text: `A fila não veio (${prosp.erroFila}).` }),
        el('button', { type: 'button', class: 'btn btn-pequeno', style: { marginTop: '10px' }, onclick: () => carregarFila(true) }, 'Tentar de novo'))];
    }
    if (!prosp.fila.length) return [titulo, el('p', { class: 'conversa-vazia', text: 'Fila vazia: ninguém novo pra contatar agora. Volta mais tarde!' })];
    const ul = el('ul', { class: 'fila' });
    for (const it of prosp.fila) {
      const c = canaisDo(it);
      ul.append(el('li', {}, el('button', { type: 'button', class: 'fila-item', onclick: () => escolherItem(it) },
        el('span', { class: 'nome' }, it.nome || 'Empresa', it.origem && it.origem !== 'prospect' ? el('span', { class: 'origem', text: it.origem === 'lead' ? 'lead' : 'negócio' }) : null),
        el('span', { class: 'canais' },
          el('span', { class: `canal-tag ${c.email.ok ? '' : 'off'}`, title: c.email.motivo, 'aria-label': c.email.ok ? 'tem e-mail' : 'sem e-mail', text: 'E-mail' }),
          el('span', { class: `canal-tag ${c.whatsapp.ok ? '' : 'off'}`, title: c.whatsapp.motivo, 'aria-label': c.whatsapp.ok ? 'tem WhatsApp' : c.whatsapp.motivo, text: 'Zap' })),
        el('span', { class: 'onde', text: [it.cidade && `${it.cidade}${it.uf ? '/' + it.uf : ''}`, it.categoria].filter(Boolean).join(' · ') }),
        it.observacao ? el('span', { class: 'obs', text: it.observacao }) : null)));
    }
    return [titulo, ul];
  }

  function escolherItem(it) {
    const c = canaisDo(it);
    Object.assign(prosp, {
      etapa: 'compor', item: it, canal: c.whatsapp.ok ? 'whatsapp' : c.email.ok ? 'email' : 'telegram',
      pedido: '', rascunho: null, assunto: '', texto: '', abriu: false, confirmar: null, escrevendo: false,
    });
    renderProsp();
    corpoFolha.scrollTo({ top: 0 });
  }

  function montarLink(canal, original, texto, assunto) {
    try {
      if (canal === 'email') {
        const i = original.indexOf('?');
        const dest = i >= 0 ? original.slice(0, i) : original;
        return `${dest}?subject=${encodeURIComponent(assunto || '')}&body=${encodeURIComponent(texto || '')}`;
      }
      const u = new URL(original);
      if (canal === 'whatsapp') return `${u.origin}${u.pathname}?text=${encodeURIComponent(texto || '')}`;
      if (canal === 'telegram') {
        const url = u.searchParams.get('url') || '';
        return `${u.origin}${u.pathname}?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto || '')}`;
      }
    } catch { /* link estranho: usa o original */ }
    return original;
  }

  async function escrever() {
    if (prosp.escrevendo || !prosp.item) return;
    prosp.escrevendo = true; prosp.rascunho = null; prosp.abriu = false; prosp.confirmar = null;
    renderProsp();
    const item = prosp.item, canal = prosp.canal;
    try {
      const r = await api.rascunho({ id: item.id, origem: item.origem, canal, pedido: prosp.pedido.trim() || undefined });
      if (prosp.item !== item || prosp.canal !== canal) return; // trocou no meio
      prosp.rascunho = { ...r, canal };
      prosp.texto = String(r?.texto || '');
      prosp.assunto = String(r?.assunto || '');
    } catch (e) {
      prosp.rascunho = null;
      toast(`A Kira não conseguiu escrever (${e.message})`, 'erro');
    } finally {
      prosp.escrevendo = false;
      if (abaAtual === 'prospectar') renderProsp();
      setTimeout(() => $('#rascunho-texto', abaProsp)?.scrollIntoView({ block: 'center', behavior: reduzido ? 'auto' : 'smooth' }), 80);
    }
  }

  function vistaCompor() {
    const it = prosp.item;
    const c = canaisDo(it);
    const out = [];
    out.push(el('div', { class: 'passo-titulo' },
      el('button', { type: 'button', class: 'btn-voltar', onclick: () => { prosp.etapa = 'lista'; renderProsp(); } }, '← Fila'),
      el('h3', { text: it.nome || 'Empresa' })));
    out.push(el('p', { class: 'nota', style: { textAlign: 'left', marginTop: '-4px' }, text: [it.cidade && `${it.cidade}${it.uf ? '/' + it.uf : ''}`, it.categoria, it.observacao].filter(Boolean).join(' · ') }));

    const seg = el('div', { class: 'segmentos', role: 'group', 'aria-label': 'Canal' });
    for (const k of ['email', 'whatsapp', 'telegram']) {
      seg.append(el('button', {
        type: 'button', class: 'segmento', 'aria-pressed': String(prosp.canal === k), disabled: !c[k].ok || prosp.escrevendo,
        onclick: () => { if (prosp.canal !== k) { prosp.canal = k; prosp.rascunho = null; prosp.abriu = false; prosp.confirmar = null; renderProsp(); } },
      }, el('span', {}, `${CANAIS[k].ico} ${CANAIS[k].nome}`, el('small', { text: c[k].motivo }))));
    }
    out.push(seg);

    if (prosp.canal !== 'email') {
      const ped = el('input', { id: 'pedido', type: 'text', maxlength: '200', placeholder: 'ex.: mais curto, cita o turismo da cidade', value: prosp.pedido, oninput: (e) => { prosp.pedido = e.target.value; } });
      out.push(el('div', { class: 'campo' }, el('label', { for: 'pedido', text: 'Pedido pra Kira (opcional)' }), ped));
    } else {
      out.push(el('p', { class: 'nota', style: { textAlign: 'left' }, text: 'No e-mail vai o texto aprovado em 28/09, do jeitinho que foi aprovado.' }));
    }

    out.push(el('button', { type: 'button', class: 'btn btn-primario btn-grande', 'aria-busy': prosp.escrevendo ? 'true' : null, onclick: escrever },
      prosp.escrevendo ? 'A Kira tá escrevendo…' : prosp.rascunho ? '↻ Escrever de novo' : '✍️ Escrever'));
    if (prosp.escrevendo) out.push(el('p', { class: 'nota', style: { marginTop: '8px' }, text: 'Pode levar até uns 40 s com a IA acordando.' }));

    const r = prosp.rascunho;
    if (r && !prosp.escrevendo) {
      out.push(el('div', { style: { height: '14px' } }));
      // o servidor pode mandar o mesmo aviso que a tela já mostra em destaque: compara sem pontuação/caixa
      const chaveAviso = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
      const AVISO_ZAP = 'Texto de WhatsApp ainda sem aprovação formal — revise antes de enviar.';
      const vistos = new Set();
      const textos = [];
      if (r.canal === 'whatsapp' && r.aprovado !== true) { textos.push({ t: AVISO_ZAP, forte: true }); vistos.add(chaveAviso(AVISO_ZAP)); }
      for (const t of Array.isArray(r.avisos) ? r.avisos : []) {
        const k = chaveAviso(t);
        if (!k || vistos.has(k)) continue;
        vistos.add(k); textos.push({ t: String(t), forte: false });
      }
      const avisos = textos.map((x) => el('li', { class: x.forte ? 'forte' : null, text: x.t }));
      if (avisos.length) out.push(el('ul', { class: 'avisos' }, avisos));

      const linkEl = el('a', { class: 'btn btn-primario btn-grande btn-abrir', target: r.canal === 'email' ? null : '_blank', rel: 'noopener noreferrer' });
      const atualizarLink = () => {
        const href = montarLink(r.canal, String(r.link || ''), prosp.texto, prosp.assunto);
        if (linkSeguro(href)) { linkEl.href = href; linkEl.removeAttribute('aria-disabled'); }
        else { linkEl.removeAttribute('href'); linkEl.setAttribute('aria-disabled', 'true'); }
      };
      if (r.canal === 'email') {
        out.push(el('div', { class: 'campo' }, el('label', { for: 'rascunho-assunto', text: 'Assunto' }),
          el('input', { id: 'rascunho-assunto', type: 'text', value: prosp.assunto, oninput: (e) => { prosp.assunto = e.target.value; atualizarLink(); } })));
      }
      const cont = el('span', { class: 'contador' });
      const atualizarCont = () => {
        if (r.canal !== 'whatsapp') { cont.textContent = `${prosp.texto.length} caracteres`; return; }
        cont.textContent = `${prosp.texto.length}/600`;
        cont.classList.toggle('estourou', prosp.texto.length > 600);
      };
      const ta = el('textarea', { id: 'rascunho-texto', rows: '9', oninput: (e) => { prosp.texto = e.target.value; atualizarLink(); atualizarCont(); } });
      ta.value = prosp.texto;
      out.push(el('div', { class: 'campo' }, el('label', { for: 'rascunho-texto', text: r.canal === 'email' ? 'Texto do e-mail' : 'Mensagem (dá pra editar)' }), ta, cont));
      atualizarCont();
      atualizarLink();
      linkEl.append(el('span', { class: 'canal-ico', 'aria-hidden': 'true', text: CANAIS[r.canal].ico }), CANAIS[r.canal].abrir);
      linkEl.addEventListener('click', () => {
        prosp.abriu = true;
        setTimeout(() => { const box = $('#registro', abaProsp); if (box) box.classList.add('destacar'); }, 400);
      });
      out.push(linkEl);
      out.push(el('p', { class: 'nota', text: r.canal === 'telegram' ? 'Abre o Telegram com o texto pronto — você escolhe o contato e envia.' : 'Abre o app com o texto pronto. Quem envia é você, lá no app.' }));

      out.push(el('p', { class: 'registro-titulo', text: 'Voltou? Marca o que rolou:' }));
      if (prosp.confirmar) {
        const ac = ACOES_REGISTRO[prosp.confirmar];
        out.push(el('div', { class: 'confirma', id: 'registro' },
          el('p', { text: ac.confirma(it.nome || 'essa empresa') }),
          el('button', { type: 'button', class: 'btn btn-pequeno btn-primario', 'aria-busy': prosp.registrando ? 'true' : null, onclick: () => registrar(prosp.confirmar) }, prosp.registrando ? 'Anotando…' : 'Sim, marcar'),
          el('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => { prosp.confirmar = null; renderProsp(); } }, 'Cancelar')));
      } else {
        const box = el('div', { class: `registro ${prosp.abriu ? 'destacar' : ''}`, id: 'registro' });
        for (const [k, ac] of Object.entries(ACOES_REGISTRO)) {
          box.append(el('button', { type: 'button', class: `btn ${k === 'enviei' ? 'btn-ok' : 'btn-pequeno'} ${k === 'pediu-sair' || k === 'descartar' ? '' : ''}`, onclick: () => { prosp.confirmar = k; renderProsp(); } }, ac.rotulo));
        }
        out.push(box);
      }
    }
    return out;
  }

  async function registrar(acao) {
    if (prosp.registrando) return;
    const it = prosp.item, r = prosp.rascunho;
    if (!it || !r) return;
    prosp.registrando = true; renderProsp();
    try {
      const resp = await api.registro({ cnpj: r.cnpj || it.cnpj || it.id, canal: r.canal, acao, ref: r.ref || null });
      toast(resp?.mensagem || (acao === 'enviei' ? `Anotado: enviado pra ${it.nome} ✓` : 'Anotado na Central ✓'));
      prosp.fila = (prosp.fila || []).filter((x) => x !== it);
      Object.assign(prosp, { etapa: 'lista', item: null, rascunho: null, confirmar: null, texto: '', assunto: '', abriu: false });
    } catch (e) {
      toast(`Não anotou: ${e.message}`, 'erro');
      prosp.confirmar = null;
    } finally {
      prosp.registrando = false;
      if (abaAtual === 'prospectar') renderProsp();
    }
  }

  // ================================================================ balões
  const camada = $('#baloes');
  const baloes = new Map(); // slug -> {el, txt, nome, ultimo:{}}
  function garantirBalao(a) {
    let b = baloes.get(a.slug);
    if (b) return b;
    const nome = el('div', { class: 'balao-nome', text: a.nome });
    const txt = el('div', { class: 'balao-texto' });
    const caixa = el('div', { class: 'balao-caixa' }, nome, txt);
    const e = el('div', { class: 'balao so-nome', vars: { '--ac': a.accentHex || '#f2a33a' } }, caixa);
    camada.append(e);
    b = { el: e, txt, nome, ult: { x: 0, y: 0, op: -1, modo: '', texto: null, classe: '' } };
    baloes.set(a.slug, b);
    return b;
  }
  // retângulos já ocupados neste quadro (quem vem primeiro — a mais perto — tem prioridade)
  let ocupados = [];
  function inicioBaloes() { ocupados = []; }
  const bate = (r) => ocupados.some((o) => r.x0 < o.x1 && r.x1 > o.x0 && r.y0 < o.y1 && r.y1 > o.y0);

  function esconderBalao(b) {
    const u = b.ult;
    if (u.op !== 0) { b.el.style.opacity = '0'; b.el.style.transform = 'translate3d(-9999px,0,0)'; u.op = 0; }
  }
  function aplicarConteudo(b, modo, texto, classe) {
    const u = b.ult;
    const t = modo === 'nome' ? null : texto;
    if (t !== u.texto) { b.txt.textContent = t || ''; u.texto = t; }
    const cls = `balao ${modo === 'nome' ? 'so-nome' : ''} ${classe || ''}`;
    if (cls !== u.classe) { b.el.className = cls; u.classe = cls; }
  }
  function tamanho(b, modo, texto, classe) {
    // mede uma vez por (modo, texto, destaque) e guarda
    const chave = `${modo}|${modo === 'nome' ? '' : texto}|${/destaque/.test(classe || '') ? 1 : 0}`;
    b.tams = b.tams || new Map();
    let t = b.tams.get(chave);
    if (!t) {
      aplicarConteudo(b, modo, texto, classe);
      t = { w: b.el.offsetWidth || 120, h: b.el.offsetHeight || 40 };
      if (b.tams.size > 12) b.tams.clear();
      b.tams.set(chave, t);
    }
    return t;
  }

  function posicionarBalao(slug, { visivel, x, y, opacidade, modo, texto, classe }) {
    const b = baloes.get(slug);
    if (!b) return;
    if (!visivel || opacidade <= 0.02) { esconderBalao(b); return; }
    const u = b.ult;
    const W = window.innerWidth;
    const topoLivre = hud.classList.contains('escondido') ? 8 : hudFim;
    const tentar = (m) => {
      const t = tamanho(b, m, texto, classe);
      const meio = t.w / 2;
      const xc = Math.max(8 + meio, Math.min(W - 8 - meio, x));
      const ret = { x0: xc - meio, x1: xc + meio, y0: y - t.h, y1: y };
      return { m, t, meio, xc, ret };
    };
    // completo → se encavalar, só o nome → se ainda encavalar, some
    let p = tentar(modo);
    if (bate(p.ret) && modo !== 'nome') p = tentar('nome');
    if (bate(p.ret)) { esconderBalao(b); return; }
    let op = opacidade;
    if (p.ret.y0 < topoLivre) op *= Math.max(0, 1 - (topoLivre - p.ret.y0) / 28); // some embaixo do HUD
    if (op <= 0.02) { esconderBalao(b); return; }
    ocupados.push(p.ret);
    aplicarConteudo(b, p.m, texto, classe);
    // a ponta continua apontando pra ela mesmo quando o balão encosta na borda
    const dx = Math.max(-p.meio + 16, Math.min(p.meio - 16, x - p.xc));
    if (Math.abs(p.xc - u.x) > 0.3 || Math.abs(y - u.y) > 0.3 || u.op === 0 || u.h !== p.t.h) {
      b.el.style.transform = `translate3d(${(p.xc - p.meio).toFixed(1)}px, ${(y - p.t.h).toFixed(1)}px, 0)`;
      u.x = p.xc; u.y = y; u.h = p.t.h;
    }
    if (Math.abs(dx - (u.dx ?? 0)) > 0.5) { b.el.style.setProperty('--dx', `${dx.toFixed(1)}px`); u.dx = dx; }
    const opR = Math.round(op * 100) / 100;
    if (opR !== u.op) { b.el.style.opacity = String(opR); u.op = opR; }
  }

  // ================================================================ estado vindo do app
  function atualizarFolha() {
    if (!slugAtual) return;
    const a = ctx.agente(slugAtual);
    if (!a) { fecharFolha(); return; }
    folha.style.setProperty('--ac', a.accentHex || '#f2a33a');
    renderCabecalho();
    renderAbas();
    if (abaAtual === 'conversa') renderConversa();
    if (painelAberto?.id === 'equipe') renderEquipe();
  }

  let hudOculto = true;
  function atualizarHud() {
    // no celular, com a folha aberta o HUD sai de cena pra sobrar céu pra agente
    const larga = window.innerWidth >= 760;
    const esconder = hudOculto || estadoFolha === 'cheia' || (estadoFolha === 'aberta' && !larga);
    hud.classList.toggle('escondido', esconder);
    document.documentElement.classList.toggle('sem-hud', esconder || !!painelAberto);
  }
  function mostrarHud(b = true) {
    hudOculto = !b;
    atualizarHud();
  }

  window.addEventListener('resize', () => { if (estadoFolha !== 'fechada') setEstadoFolha(estadoFolha); });

  return {
    loader, toast, relogio,
    mostrarHud, atualizarContagens, setOffline, setBomDiaOcupado,
    abrirFolha, fecharFolha, atualizarFolha,
    get slugAberto() { return slugAtual; },
    get estadoFolha() { return estadoFolha; },
    get coberto() { return estadoFolha === 'cheia' || !!painelAberto; },
    abrirQuadro, abrirEquipe, fecharPainel,
    abrirChat(slug) { abrirFolha(slug, { aba: 'conversa', focarEntrada: true, rolarConversa: true }); },
    dizer(slug, texto) {
      const t = String(texto || '').trim();
      if (!t) return;
      hist(slug).push({ tipo: 'agente', texto: t, sugestoes: [] });
      if (slug === slugAtual && abaAtual === 'conversa') { renderThread(); setTimeout(rolarFim, 60); }
    },
    garantirBalao, posicionarBalao, inicioBaloes,
    enviar,
  };
}
