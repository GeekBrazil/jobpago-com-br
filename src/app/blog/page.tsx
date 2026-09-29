import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import BlogAdminIngestion from "@/components/blog/BlogAdminIngestion";
import TopoSimples from "@/components/TopoSimples";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Blog & Notícias da Estrada · JobPago.com.br", "Blog y Noticias de la Ruta · JobPago.com.br", "Blog & Road News · JobPago.com.br"),
    description: L(i,
      "Artigos, análises de rotas, infraestrutura rodoviária e notícias da expedição pelo Brasil.",
      "Artículos, análisis de rutas, infraestructura vial y noticias de la expedición por Brasil (artículos en portugués).",
      "Articles, route analysis, road infrastructure and expedition news across Brazil (articles in Portuguese)."),
    robots: { index: true, follow: true },
  };
}

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

export default async function BlogPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const articles = getArticles();

  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      {/* Painel de Ingestão Exclusivo para o Administrador */}
      <BlogAdminIngestion />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {t("Conteúdo Autoral & Estrada", "Contenido propio y ruta", "Original content & road")}
        </span>

        <h1 className="mt-4 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
          Blog JobPago
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          {t("Artigos, estudos sobre rentabilidade do transporte, paradas estratégicas e tecnologia rodoviária.", "Artículos, estudios sobre rentabilidad del transporte, paradas estratégicas y tecnología vial. Los artículos están en portugués.", "Articles and studies on transport profitability, strategic stops and road technology. Articles are in Portuguese.")}
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.id}`}
              className="group glass-card rounded-2xl p-6 border border-white/5 hover:border-amber-500/40 transition-all flex flex-col justify-between"
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
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(article.publishedAt).toLocaleDateString(i === "en" ? "en-GB" : i === "es" ? "es-AR" : "pt-BR")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400">
                <span>{t("Ler artigo completo", "Leer el artículo completo", "Read the full article")}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
