import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    "name": "JobPago — Renda na Viagem & Serviços Locais",
    "short_name": "JobPago",
    "description": "Renda na viagem para nômades e serviços locais com Pix direto e sem comissão.",
    "start_url": "/?utm_source=pwa",
    "scope": "/",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#060913",
    "theme_color": "#060913",
    "lang": "pt-BR",
    "icons": [
        {
            "src": "/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
        },
        {
            "src": "/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
        }
    ]
};
}
