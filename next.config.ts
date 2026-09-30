import type { NextConfig } from "next";

/* Cabeçalhos de segurança (auditoria 2026-09-30): o site estava sem nenhum.
   Sem CSP de scripts para não quebrar mapa, login do Google, rastreio e chat
   servidos pelo allancandido.com; o frame-ancestors impede embutir o site
   em página de terceiro (clickjacking). Geolocalização só no próprio site
   (formulários de contribuição pedem a posição). */
const cabecalhos = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://accounts.google.com" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: cabecalhos }];
  },
};

export default nextConfig;
