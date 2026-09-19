import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  content: string;
  coverImage?: string;
  publishedAt: string;
  status: "published" | "draft";
}

function getArticleById(id: string): Article | null {
  try {
    const raw = readFileSync(join(process.cwd(), "public/data/articles.json"), "utf-8");
    const list: Article[] = JSON.parse(raw);
    return list.find((a) => a.id === id && a.status === "published") ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) return { title: "Artigo não encontrado · JobPago" };
  return { title: `${article.title} · JobPago`, description: article.summary };
}

export default async function ArticlePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) notFound();

  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-black">
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-black text-white">
              JobPago<span className="text-emerald-400">.</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">/ blog</span>
          </Link>

          <Link
            href="/blog"
            className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            ← Voltar para o Blog
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {article.category}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {new Date(article.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-4">
          {article.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
          {article.summary}
        </p>

        {article.coverImage && (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full max-h-96 object-cover rounded-2xl mb-8 border border-white/10"
          />
        )}

        <hr className="border-white/10 mb-8" />

        <article
          className="text-slate-300 leading-relaxed space-y-4 text-base"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
          <Link href="/blog" className="text-xs font-bold text-slate-400 hover:text-white">
            ← Todos os artigos
          </Link>
          <Link href="/parceiros/planos" className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 text-black">
            Conhecer JobPago Pro →
          </Link>
        </div>
      </main>
    </div>
  );
}
