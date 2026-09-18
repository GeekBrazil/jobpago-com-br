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

