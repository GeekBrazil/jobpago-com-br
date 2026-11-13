// MOCK de teste da API do Campus (?mock=1). Nunca chama rede pra /api/campus:
// devolve dados inventados. Empresas, e-mails e telefones abaixo são FICTÍCIOS
// (domínio .invalid e número zerado) — servem só pra desenhar a tela.
import { ErroApi } from '../../js/api.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const IMPLEMENTADAS = {
  'central-prospeccao': ['visitas-ontem', 'leads', 'funil'],
  'link-checker': ['links-quebrados'],
  'avisos-leilao': ['leiloes-hoje'],
  'prospeccao-robo': ['quem-contataria'],
};

const MANCHETES = {
  'central-prospeccao': 'Ontem: 8 visitantes (JobPago 6, AC 1, VP 1), nenhum lead ainda.',
  'prospeccao-robo': 'Robô desligado esperando seu ok · 0 contatados · 155 cidades no roteiro',
  'avisos-leilao': '42 leilões novos hoje, 7 no RJ',
  'painel-pncp-cnpj': '1.204 licitações abertas na Costa Verde',
  'link-checker': 'Varri 3 sites: 0 links quebrados',
  'jobpago': '6 visitas ontem, 2 na página da Expedição',
  'sofia-bot': '2 imóveis novos no WhatsApp esperando foto',
  'offline-brain': 'Índice com 12 mil notas, tudo em dia',
  'controle-de-servicos': '11 serviços de pé, 4 dormindo',
};

let estadoSim = null;

async function montarEstado(modo) {
  if (modo === 'offline') { await espera(400); throw new ErroApi('Sem conexão com o PC', { rede: true }); }
  if (!estadoSim) {
    const r = await fetch('/data/campus/agentes.json', { cache: 'no-store' });
    const roster = (await r.json()).agentes;
    const st = {
      'prospeccao-robo': ['dormindo', 'esperando seu ok — peça no Claude: liga o robô'],
      'whatsapp-rag-jarvis': ['sem-corpo', 'os containers não existem mais'],
      'transcricao-video': ['dormindo'], 'holo-gestures': ['dormindo'], 'olho-do-investidor': ['dormindo'],
      'robos-navegador': ['dormindo'], 'offline-brain': ['acordada'],
      'mercado-imobiliario': ['com-problema', 'leiloes-privados falhou (Bradesco 504)'],
      'jobpago': ['remota'], 'allancandido-site': ['remota'], 'visiteprado': ['remota'],
    };
    estadoSim = roster.map((f) => {
      const [status, motivo] = st[f.slug] || ['acordada'];
      const caps = (f.capacidades || []).filter((c) => (IMPLEMENTADAS[f.slug] || []).includes(c.id) || (c.tipo === 'leitura' && c.seguroParaUmToque && Math.random() < 0.0))
        .map(({ id, rotulo, descricao, tipo, seguroParaUmToque }) => ({ id, rotulo, descricao, tipo, seguroParaUmToque }));
      return {
        ...f,
        status, motivo: motivo || null,
        podeLigar: f.controle?.tipo === 'systemd' || f.controle?.tipo === 'docker-proxy',
        trabalhando: status === 'remota' || (status === 'acordada' && !!MANCHETES[f.slug]),
        manchete: status === 'acordada' || status === 'remota' || f.slug === 'prospeccao-robo' ? (MANCHETES[f.slug] || null) : null,
        capacidades: caps,
      };
    });
  }
  await espera(250);
  return { agora: new Date().toISOString(), hora: new Date().getHours(), memoriaLivreMB: 5400, agentes: estadoSim };
}

const FILA = [
  { id: '00000000000101', nome: 'Pousada Maré Mansa', cidade: 'Paraty', uf: 'RJ', categoria: 'Hospedagem', canais: { email: true, whatsapp: { ok: true, linha: 'celular' } }, origem: 'prospect', observacao: 'Aberta em mar/2026 · 1º toque' },
  { id: '00000000000102', nome: 'Padaria Pão da Ilha', cidade: 'Angra dos Reis', uf: 'RJ', categoria: 'Alimentação', canais: { email: false, whatsapp: { ok: true, linha: 'celular' } }, origem: 'prospect', observacao: '1º toque' },
  { id: '00000000000103', nome: 'Imobiliária Costa Azul', cidade: 'Ubatuba', uf: 'SP', categoria: 'Imobiliária', canais: { email: true, whatsapp: { ok: false, linha: 'fixo' } }, origem: 'negocio', observacao: '2º toque · 1º e-mail em 22/09' },
  { id: '00000000000104', nome: 'Oficina Náutica Ponta Leste', cidade: 'Angra dos Reis', uf: 'RJ', categoria: 'Serviços náuticos', canais: { email: true, whatsapp: { ok: true, linha: 'celular' } }, origem: 'lead', observacao: 'Veio do site · 1º toque' },
  { id: '00000000000105', nome: 'Restaurante Sabor de Mangaratiba', cidade: 'Mangaratiba', uf: 'RJ', categoria: 'Alimentação', canais: { email: true, whatsapp: false }, origem: 'prospect', observacao: '1º toque' },
];

async function rascunho({ id, canal }) {
  await espera(1400);
  const it = FILA.find((x) => x.id === id) || FILA[0];
  const ref = 'a1b2c3d4e5';
  const link = `https://jobpago.com.br/cidade/3303807?utm_source=${canal}&utm_content=${ref}`;
  if (canal === 'email') {
    const assunto = `${it.cidade}: o que a sua cidade movimenta (dados públicos)`;
    const texto = `Olá, equipe da ${it.nome}!\n\nSou o Allan, da JobPago. Montei um relatório gratuito com o que ${it.cidade} movimenta em compras públicas e turismo — dá pra ver o seu setor aqui: ${link}\n\nSe não quiser receber mais nada, é só responder "sair" que eu tiro o seu contato na hora.\n\nAbraço,\nAllan`;
    return { assunto, texto, ref, cnpj: it.id, aprovado: true, link: `mailto:contato@exemplo.invalid?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`, avisos: ['Texto aprovado em 28/09 — sem mudar uma vírgula.'] };
  }
  const texto = `Oi! Aqui é o Allan, da JobPago. Vi que a ${it.nome} fica em ${it.cidade} e separei os números do seu setor na cidade: ${link}\nSe preferir não receber mais, me avisa que eu paro.`;
  if (canal === 'telegram') {
    return { texto, ref, cnpj: it.id, aprovado: false, link: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(texto)}`, avisos: ['No Telegram você escolhe o contato na hora de compartilhar.'] };
  }
  return { texto, ref, cnpj: it.id, aprovado: false, link: `https://wa.me/5500000000000?text=${encodeURIComponent(texto)}`, avisos: ['Personalizei com os números da cidade; o link é o do relatório.'] };
}

export function criarMock(modo = '1') {
  return async function mock(rota, { metodo, corpo }) {
    const r = rota.split('?')[0];
    if (r === '/estado') return montarEstado(modo);
    if (modo === 'offline') { await espera(300); throw new ErroApi('Sem conexão com o PC', { rede: true }); }
    switch (r) {
      case '/bom-dia': {
        await espera(1200);
        const acordadas = [];
        for (const a of estadoSim || []) if (a.status === 'dormindo' && a.podeLigar && a.acordaSozinhaDeManha) { a.status = 'acordada'; acordadas.push(a.slug); }
        return { ok: true, acordadas, jaEstavam: (estadoSim || []).filter((a) => a.status === 'acordada').map((a) => a.slug), recusadas: [{ slug: 'holo-gestures', motivo: 'pouca RAM livre' }] };
      }
      case '/acordar': {
        await espera(900);
        const a = estadoSim?.find((x) => x.slug === corpo.slug);
        if (a) { a.status = 'acordada'; a.manchete = MANCHETES[a.slug] || 'Acabei de acordar, já tô de pé!'; }
        return { ok: true, status: 'acordada', mensagem: 'Acordei! Tô indo pro meu posto.' };
      }
      case '/dormir': {
        await espera(700);
        const a = estadoSim?.find((x) => x.slug === corpo.slug);
        if (a) { a.status = 'dormindo'; a.manchete = null; a.trabalhando = false; }
        return { ok: true, status: 'dormindo', mensagem: 'Boa noite, tô indo pro lounge.' };
      }
      case '/conversar': {
        await espera(1300);
        const a = estadoSim?.find((x) => x.slug === corpo.slug);
        const caps = (a?.capacidades || []).map((c) => c.id);
        return {
          resposta: `Opa, Allan! Sou a ${a?.nome || 'agente'}. ${a?.sistema?.oQueFaz || ''} Quer que eu te mostre agora?`,
          acoesSugeridas: caps.slice(0, 2), fonte: 'ollama',
        };
      }
      case '/acao': {
        await espera(800);
        return { titulo: 'Visitas de ontem', texto: 'Movimento fraco mas constante — a JobPago puxou o bonde.', itens: [{ rotulo: 'JobPago', valor: '6 visitantes' }, { rotulo: 'Allan Candido', valor: '1 visitante' }, { rotulo: 'VisitePrado', valor: '1 visitante' }, { rotulo: 'Leads', valor: '0' }] };
      }
      case '/monetizacao': {
        const resp = await fetch('/data/campus/monetizacao.json', { cache: 'no-store' });
        return resp.json();
      }
      case '/prospeccao/fila': await espera(modo === 'lento' ? 6000 : 2200); return { itens: FILA };
      case '/prospeccao/rascunho': return rascunho(corpo);
      case '/prospeccao/registro': await espera(600); return { ok: true, status: 'contatado' };
      case '/prospeccao/robo':
        await espera(300);
        return { ativo: false, habilitado: false, enviadosHoje: 0, limite: 25, ultimoEnvio: null, proximo: null, log: ['robo.py: modo seguro, nada enviado'] };
      default: throw new ErroApi('Rota inexistente no mock', { status: 404 });
    }
  };
}
