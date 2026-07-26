@AGENTS.md

# jobpago.com.br — Contexto para o Agente

> **Plataforma de Microtarefas e Vagas Rápidas com Pagamento via PIX.**

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Lucide Icons |
| Estilo | Tailwind CSS 4, CSS keyframes customizados |
| Deploy | Vercel (Hobby) |

## Regras Críticas

- **Nunca** adicionar `Co-Authored-By: Claude` em commits — autoria exclusiva de Allan Candido.
- **Deploy = Git.** A Vercel builda o `origin/main` (integração GitHub). Padrão: `npm run build` → `git commit` → **`git push origin main`**.
- Identidade visual: Tema escuro ultra-moderno (`#07090e`), acentos em Verde PIX (`#10b981` / `#059669`) e gradientes vibrantes.

## O que está em Produção

- **Página Principal (`src/app/page.tsx`)**:
  - **Mapa Interativo de Serviços GPS (`MapaServicos.tsx`)**: Renderização dinâmica em Leaflet (Dark Matter) com geolocalização do usuário, marcadores coloridos por categoria e cálculo de rota exata em tempo real (OSRM).
  - **Categoria Nômade & Infraestrutura**: Mapeamento de pontos de apoio com banheiros/chuveiro quente, tomadas dedicadas de alta carga (110V, 220V, 32A para bikes elétricas, notebooks e motorhomes), vagas seguras para vans/camping e Wi-Fi de alta velocidade.
  - **Categoria "Serviços Secretos" ㊙️**: Seção temática em estética Anime Maximalista / Cyberpunk Neon, integrando sessões de cosplay, banhos aromáticos sensoriais, fetiches e experiências exclusivas com **Smart Contract P2P** confidencial e pagamentos descentralizados em **Bitcoin (BTC) / Lightning Network**.
  - Hero interativo com busca por palavras-chave e localização.
  - Modal de anúncio de tarefas e candidatura rápida com chave PIX ou BTC.
