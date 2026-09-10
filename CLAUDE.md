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
- **6 Tribos Canônicas**:
  1. 💻 **Devs & Tech**: Programação, sites, automações e suporte técnico.
  2. 🚐 **Van Life & Nômades**: Pontos de parada, energia, água e apoio de viagem.
  3. 🛠️ **Reformas & Reparos**: Manutenção em trânsito, elétrica e pequenas reformas.
  4. 🚚 **Transporte & Fretes**: Carretos, entregas locais e logística ágil.
  5. 📷 **Fotografia & Mídia**: Captação visual, drone, edição de vídeo e conteúdo.
  6. 🎓 **Aulas & Consultoria**: Treinamentos, idiomas, mentoria e consultoria remota.

