@AGENTS.md

# jobpago.com.br — Contexto para o Agente

> **Plataforma de Microtarefas e Vagas Rápidas com Pagamento via PIX.**

## Deploy — build SEMPRE no PC do Allan (site no VPS — regra de 2026-09-25)

`npm run deploy` = `scripts/deploy-pc.sh`: imagem montada no PC a partir do
commit → `docker save | ssh docker load` no VPS → Coolify publica sem rebuild
("Build step skipped"). O auto-deploy do Coolify está desligado: push não
compila nada. Nunca interromper o deploy nem usar `timeout` nele. Mesmo
esquema do allancandido.com (ver o CLAUDE.md de lá e o vault).
A regra vale porque o site roda no VPS (Coolify); site na Vercel NÃO segue
esta regra e compila na Vercel normalmente.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Lucide Icons |
| Estilo | Tailwind CSS 4, CSS keyframes customizados |
| Deploy | Coolify/Hetzner (migrado da Vercel em 2026-09-09 — Vercel Hobby proíbe uso comercial) |
| Banco | Postgres na VPS, database `jobpago` — leads gravados lá (ver `src/lib/db.ts`) |

## Regras Críticas

- **Nunca** adicionar `Co-Authored-By: Claude` em commits — autoria exclusiva de Allan Candido.
- **Deploy Obrigatório: `npm run deploy`.** Executa `git push origin main` + dispara deploy no Coolify via API (token em `~/.config/coolify/api_token`, app uuid `n14b1n041063tx65wnna7p0w`) + `scripts/verify-deploy.mjs` pra auditar externamente o conteúdo real publicado. `git push` isolado não atualiza o Coolify sozinho (só se o GitHub App tiver auto-deploy configurado — confirmar antes de assumir).
- **DNS**: `jobpago.com.br` continua com nameservers da Vercel (`ns1/ns2.vercel-dns.com`) — só os registros DNS individuais (`A` de `@` e `www`) foram trocados pra apontar pra VPS. `www.jobpago.com.br` é o domínio "de verdade" (resolve direto); a raiz sem www redireciona 307 pra `www` (comportamento aceito, não é bug).
- **ADMIN_SECRET**: painel em `/admin` (não confundir com `/secretos`, que é outra coisa) — lista os leads (cadastros de anunciante/candidato) direto do Postgres. Segredo em `~/.config/jobpago/admin_secret`.
- Identidade visual: Tema escuro ultra-moderno (`#07090e`), acentos em Verde PIX (`#10b981` / `#059669`) e gradientes vibrantes.

## Posicionamento de Produção

- **Público-Alvo**: Renda Online + Vida Nômade (estrada / motorhome / van life). Marketplace passivo e pagamentos diretos via PIX sem taxas.
- **7 Categorias** — fonte única em `src/data/categorias.ts` (`CATEGORIAS`), não documentar de cabeça: esse arquivo é a verdade, isso aqui é só um resumo pra orientação rápida.
  1. 🚐 **Nômade & Infra**: Motorhomes, 220V & Camping.
  2. 🚛 **Estrada & Cargas**: Chapa, socorro mecânico, frete de retorno e guincho.
  3. 💻 **Tecnologia & TI**: Full-Stack, Automação & IA.
  4. 🚚 **Transporte & Fretes**: Carretos & Mudanças.
  5. 🎥 **Vídeo & Conteúdo**: Drone, Edição & Redes Sociais.
  6. 🎓 **Aulas & Consultoria**: Mentorias & Consultorias.
  7. 🎨 **Design & Mídia**: Identidade Visual & Social.
- **Critério pra categoria caber no escopo**: tem que servir quem trabalha/vive na estrada — exigir um ativo ou vantagem de nômade (van, mobilidade, trabalho remoto), não só coincidir geograficamente com a região onde o Allan mora. Foi esse critério que tirou "Reformas & Reparos" em 2026-09-18: a descrição tinha genericado pra "Eletricistas & Manutenção" (a tribo original, ainda mais antiga, era "Manutenção em trânsito") e a única vaga cadastrada era conserto elétrico residencial comum — nenhuma relação com estrada, van ou trabalho remoto. Categoria e vaga de exemplo removidas juntas.

## Expedição JobPago (Paraty → Fortaleza, pelo litoral — trajeto trocado em 2026-09-28)

Viagem real que o Allan vai fazer, visitando estabelecimentos (postos, pousadas,
camping, oficinas) que pedem selo de verificação. Peças já construídas (18/09/2026),
todas com fonte única em `src/data/`:

- `/parceiros/planos` — 4 níveis de patrocínio pra **estabelecimento** (Permuta,
  Local, Regional, Master), dados em `planos-parceiro.ts`. Não tem checkout de
  propósito — todo acordo fecha no WhatsApp. Também tem a régua de contribuição
  PIX (`ReguaContribuicao.tsx`) pra quem quer apoiar **sem** ter estabelecimento.
- `/certificados` — lista pública de quem já foi verificado, com QR code único
  (`public/qrcode-certificados.png`, mesmo adesivo físico serve pra qualquer
  parceiro — não gerar um código por local). Campo `isVerifiedPartner` no tipo
  `Job`/`MapPoint` liga o selo ao card, ao modal e ao pin âmbar no mapa.
- `/noticias-estrada` — onde entram as publicações prometidas nas faixas de
  contribuição/patrocínio (`apoiadores.ts`, array `NOTICIAS_ESTRADA` — o Allan
  edita à mão depois de confirmar o PIX, sem admin UI ainda).
- Mapa da home (`MapaServicos.tsx`) tem um traçador manual de rota: botão
  "Traçar Minha Rota", cada clique empilha um waypoint com geocodificação
  reversa via Nominatim, "Calcular Rota" desenha o trajeto real via OSRM
  (multi-ponto), "Copiar Lista de Cidades" exporta os nomes resolvidos — feito
  pra alimentar prospecção de CNPJ por município (ver próximo item).
- **CNPJ por trajeto**: banco local `cnpj_nacional` (Postgres, container
  `postgres` do stack n8n-ollama, notebook do Allan) já tem 28M+ empresas
  categorizadas por CNAE (`pousada`, `posto_combustivel`,
  `camping_estacionamento`, `oficina_mecanica`, `turismo_passeio`, etc.), mas
  **zero geocodificadas** — filtrar por `municipio` (nome já resolvido), não
  por coordenada. Query e números reais por estado documentados no relatório
  de auditoria (Claude Docs, "O Que Falta na Estrada"). Primeiro contato em
  massa com esses CNPJs **não está automatizado de propósito** — precisa de
  lista de municípios da rota + aprovação da mensagem antes de qualquer disparo.

## Dados públicos na JobPago (2026-09-28)

- `/cidade` e `/cidade/[ibge]` — relatório da cidade: empresas abertas por setor (Receita), salário de entrada por setor (Novo CAGED) e quantas compras públicas estão abertas. O **detalhe das compras é pago**: a página mostra só a pergunta e a contagem, com botão para `allancandido.com/compras-publicas?cidade={ibge}` (plano de R$ 79,90/ano). Dados vêm da API pncp-etl (`/relatorio-cidade/{ibge}`), envs `PNCP_API_URL` e `PNCP_API_KEY` no Coolify.
- Home (2026-09-28): **sem vitrine de vagas** (as 7 inventadas saíram; `/api/jobs` não aceita mais publicação aberta — 410). Logo no topo, dois cartões: "Tenho um negócio" (→ `/cadastrar-servico?tipo=contratante`) e "Quero renda" (→ `/disponibilidade`, cadastro não público na tabela `disponibilidades` do banco `jobpago`, também vira lead na Central).
- Home: seção "Quanto se ganha de verdade fazendo X em {cidade}?" (`RendaNaCidade.tsx`, `/api/renda`), começa em Paraty.
- `/expedicao` — mapa do roteiro (Leaflet): pista duplicada/simples e acostamento confirmado (OpenStreetMap), pedágios federais (ANTT, sem tarifa; estaduais como a BA-099 não entram), 15 paradas e 155 cidades no caminho com link para o relatório. Dados em `src/data/expedicao-rota.json`, gerados por `scripts/expedicao/` (ver README lá).

## Refúgio da Estrada e Alta Honra (2026-09-29)

- **Refúgio da Estrada** = selo de lugar verificado para dormir. Candidatura em `/refugio` → tabela `refugios` (banco `jobpago`) → o Allan aprova na aba Refúgios da Central de Prospecção (`~/central-prospeccao`) → `/api/refugios` (GET) lista só os verificados, sem contato, e `/certificados` mostra.
- **Alta Honra** = como o estabelecimento apoia a expedição (`src/data/honra.ts`): Ouro (dinheiro + permuta), Prata (dinheiro), Bronze (permuta), Verificado (só a visita). **O selo de verificado nunca é vendido.**

## Idiomas: o site inteiro é PT/ES/EN (2026-09-29)

- Idioma do servidor: `?lang=` (o `src/proxy.ts` põe o header `x-jp-lang` e o cookie `jp_lang`) > cookie > Accept-Language > pt (`src/lib/idiomaServidor.ts`). No navegador: `useIdioma()` (IdiomaProvider no layout); botão flutuante `IdiomaFlutuante`.
- Texto novo **sempre** nas três línguas: `L(i, pt, es, en)` (`src/lib/i18n.ts`). Listas vindas de `src/data/` (categorias, Honra, tipos de Refúgio, planos de parceiro, faixas PIX, setores do CAGED) são traduzidas pelo id em `src/lib/traducoesCadastro.ts` — o português continua no arquivo de dados.
- APIs recebem `idioma` no corpo e devolvem o erro nessa língua (`msg()`).
- Ficam só em português: texto dos artigos do blog, `/admin`, e as mensagens pré-preenchidas que chegam no WhatsApp do Allan. Privacidade e termos traduzidos com aviso de que vale a versão em português.

## Viajante, contribuições e cards (2026-09-29)

- `/viajante` (painel), `/viajante/contribuir?tipo=`, `/viajante/questionario`, `/refugio` e `/disponibilidade` — PT/ES/EN (`src/lib/textosEstrada.ts`; espanhol e inglês de tipos, estrutura, Alta Honra e categorias em `src/lib/traducoesCadastro.ts`; as APIs devolvem o erro no `idioma` do corpo). Reputação em `contribuicoes` (banco `jobpago`), regras em `src/lib/reputacao.ts`; pontos só quando o Allan confirma na aba Contribuições da Central. Foto de fachada: GPS do celular com aviso antes; a foto passa por `allancandido.com/api/pontos-fotograficos`.
- Cards em `/card/{cidade|refugio|expedicao}/…?formato=feed|story|link` (`src/lib/cards.tsx`): só de dado real, nunca texto livre.
- **Indicação** (fase 2): `/i/{código}` guarda o 1º código por 60 dias (`src/lib/indicacaoCliente.ts`); `IndicacaoNoWhats` põe "Indicação: CÓDIGO" em todo wa.me do Allan (com `encodeURIComponent` — `searchParams.set` trocaria espaço por +); `/viajante/indicar`; regras em `src/lib/indicacao.ts` (50% 1ª mensalidade / 15% anual, 30 dias, só planos JobPago). Comissões e comboio controlados na aba Indicações da Central.
- **Expedições dos viajantes** (fase 3): `/viajante/expedicao`, `/expedicoes`, `/expedicoes/{slug}`, `/api/expedicao`, `/api/patrocinio`, regras em `src/lib/expedicoes.ts` (listas sem banco em `expedicoesListas.ts` — o formulário do navegador importa dali). **Nunca mostrar posição atual:** sem datas exatas, diário com 24 h de atraso, roteiro ocultável. Patrocínio passa pela JobPago: 85% ao viajante (aba Expedições da Central).

## UX do mapa em touch (2026-09-18)

- **Mapa não prende mais o scroll da página no celular**: `dragging` do
  Leaflet fica desligado em telas `pointer: coarse`, só reativa com 2 dedos
  no mapa (dica visual aparece quando detecta 1 dedo tentando arrastar).
  Tap continua normal — handler separado do Leaflet, não afetado por
  `dragging.disable()`.
- Painel de waypoints do traçador de rota tem opção de esconder (botão
  "−" no cabeçalho do painel, vira uma pill compacta clicável).

