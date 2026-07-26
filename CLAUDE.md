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
  - Hero interativo com busca por palavras-chave e localização.
  - Filtros por Categoria (Design, Redação, Programação, Video & Edição, Assistente Virtual) e Faixa de Valor (R$ 50 até R$ 500+).
  - Feed de Vagas/Tarefas em cards detalhados (status, recompensa PIX, badges de urgência e tempo estimado).
  - Modal de **Publicar Tarefa / Anunciar Vaga**: Formulário completo para inclusão de título, descrição, categoria, valor em PIX e contato.
  - Modal de **Candidatura Direta**: Formulário express para envio de dados de contato (WhatsApp/E-mail) e chave PIX para recebimento.
  - Seções de Como Funciona, Garantia de Pagamento e FAQ.
