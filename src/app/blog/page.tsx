import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import BlogAdminIngestion from "@/components/blog/BlogAdminIngestion";

export const metadata: Metadata = {
  title: "Blog & Notícias da Estrada · JobPago.com.br",
  description:
    "Artigos, análises de rotas, infraestrutura rodoviária e notícias da expedição pelo Brasil.",
  robots: { index: true, follow: true },
};

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  coverImage?: string;
  publishedAt: string;
  status: "published" | "draft";
  featured?: boolean;
}

function getArticles(): Article[] {
  try {
    const raw = readFileSync(join(process.cwd(), "public/data/articles.json"), "utf-8");
    return (JSON.parse(raw) as Article[]).filter((a) => a.status === "published");
  } catch {
    return [];
  }
}

export default function BlogPage() {
  const articles = getArticles();

  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-black">
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:border-emerald-400 transition-colors">
              <img
                src="/icon_flutuante-96.webp"
                width={96}
                height={96}
                alt="JobPago Logo"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                JobPago<span className="text-emerald-400">.</span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                Blog &amp; Estrada
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            ← Voltar para a Home
          </Link>
        </div>
      </header>

      {/* Painel de Ingestão Exclusivo para o Administrador */}
      <BlogAdminIngestion />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Conteúdo Autoral &amp; Estrada
        </span>

        <h1 className="mt-4 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
          Blog JobPago
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Artigos, estudos sobre rentabilidade do transporte, paradas estratégicas e tecnologia rodoviária.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.id}`}
              className="group glass-card rounded-2xl p-6 border border-white/5 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {article.coverImage && (
                  <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-900">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(article.publishedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Ler artigo completo</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
