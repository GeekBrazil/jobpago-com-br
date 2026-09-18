@AGENTS.md

# jobpago.com.br — Contexto para o Agente

> **Plataforma de Microtarefas e Vagas Rápidas com Pagamento via PIX.**

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

## Expedição JobPago (Angra dos Reis → Fortaleza)

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

## Pendências de UX conhecidas (não implementadas ainda)

- **Mapa difícil de rolar no celular**: o gesto de scroll da página fica
  "preso" dentro do `MapaServicos.tsx` (Leaflet captura o touch/scroll pra
  pan do mapa), dificultando continuar rolando a home no mobile. Pedido do
  Allan em 2026-09-18, ainda não implementado.
- **Painel de waypoints do traçador de rota sem opção de esconder**: o card
  "Traçar Minha Rota" (lista de waypoints + botões Calcular Rota/Copiar
  Lista/Limpar) fica sempre visível sobre o mapa quando o modo de traçado
  está ativo, cobrindo a rota desenhada. Falta um botão de
  minimizar/esconder esse painel pra ver o mapa por baixo. Pedido do Allan
  em 2026-09-18, ainda não implementado.

