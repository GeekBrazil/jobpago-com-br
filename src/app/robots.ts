import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: ["Googlebot", "Google-Extended", "OAI-SearchBot", "GPTBot", "PerplexityBot", "ClaudeBot", "Applebot"],
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: "https://www.jobpago.com.br/sitemap.xml",
  };
}
