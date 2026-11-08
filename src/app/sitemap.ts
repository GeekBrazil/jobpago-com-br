import { MetadataRoute } from "next";
import { CIDADES_DESTAQUE } from "@/lib/relatorioCidade";
import { readFileSync } from "fs";
import { join } from "path";

const BASE = "https://www.jobpago.com.br";

const staticRoutes = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/cidade", priority: 0.95, changeFrequency: "daily" as const },
  { path: "/disponibilidade", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/refugio", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/cadastrar-servico", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/expedicao", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/expedicoes", priority: 0.85, changeFrequency: "daily" as const },
  { path: "/viajante", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/viajante/contribuir", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/viajante/questionario", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/como-funciona", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/parceiros/planos", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/certificados", priority: 0.75, changeFrequency: "monthly" as const },
  { path: "/noticias-estrada", priority: 0.85, changeFrequency: "daily" as const },
  { path: "/blog", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/entrar", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/cadastrar", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/privacidade", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/termos", priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Cidades da expedição e destaque (dados da Receita Federal, CAGED e PNCP)
  const ibges = new Set<string>();
  for (const c of CIDADES_DESTAQUE) ibges.add(c.ibge);
  // Cidades extras da rota costeira e polos regionais
  const extras = [
    "2301000", // Aquiraz - CE
    "3555406", // Ubatuba - SP
    "3520400", // Ilhabela - SP
    "3548500", // Santos - SP
    "3302700", // Mangaratiba - RJ
    "3300704", // Cabo Frio - RJ
    "3300233", // Armação dos Búzios - RJ
    "3300209", // Araruama - RJ
    "3202405", // Guarapari - ES
    "3201605", // Conceição da Barra - ES
    "2906907", // Caravelas - BA
    "2900801", // Alcobaça - BA
    "2930709", // Santa Cruz Cabrália - BA
    "2914802", // Itacaré - BA
    "2905602", // Cairu (Morro de São Paulo) - BA
  ];
  for (const ibge of extras) ibges.add(ibge);

  for (const ibge of ibges) {
    entries.push({
      url: `${BASE}/cidade/${ibge}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  // Artigos publicados do blog
  try {
    const raw = readFileSync(join(process.cwd(), "public/data/articles.json"), "utf-8");
    const list = JSON.parse(raw) as Array<{ id: string; status: string; publishedAt?: string }>;
    for (const a of list) {
      if (a.status === "published" && a.id) {
        entries.push({
          url: `${BASE}/blog/${a.id}`,
          lastModified: a.publishedAt ? new Date(a.publishedAt) : now,
          changeFrequency: "monthly",
          priority: 0.75,
        });
      }
    }
  } catch {}

  return entries;
}
