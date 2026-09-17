"use client";

import { useEffect, useState } from "react";

const DIFY_TOKEN = "4Rz4ImMNKgmYq5GN";
const DIFY_BASE_URL = "https://dify.allancandido.com";

/* Só injeta o widget do Dify se o Allan estiver online (notebook ligado
   com o Dify rodando) — evita mostrar um chat quebrado pro visitante.
   Status consultado em allancandido.com (sempre no ar), não direto no
   túnel do Dify. */
export default function DifyChatWidget() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("https://allancandido.com/api/dify-status")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setOnline(!!d.online); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!online) return;
    if (document.getElementById("dify-chatbot-config")) return;

    (window as unknown as { difyChatbotConfig: Record<string, unknown> }).difyChatbotConfig = {
      token: DIFY_TOKEN,
      baseUrl: DIFY_BASE_URL,
      inputs: { site: "jobpago" },
      dynamicScript: true,
    };
    const script = document.createElement("script");
    script.src = `${DIFY_BASE_URL}/embed.min.js`;
    script.id = "dify-chatbot-config";
    script.defer = true;
    document.body.appendChild(script);
  }, [online]);

  return null;
}
