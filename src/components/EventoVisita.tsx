"use client";

import { useEffect } from "react";

/* Loga 1 evento de "visita" por carregamento de página no endpoint central
   do allancandido.com (jobpago não tem Postgres acessível por HTTP público
   pra isso — ver eventos_site em allancandido.com/api/eventos). */
export default function EventoVisita() {
  useEffect(() => {
    try {
      const payload = JSON.stringify({ site: "jobpago", tipo: "visita" });
      const url = "https://allancandido.com/api/eventos";
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "text/plain" }));
      } else {
        fetch(url, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
      }
    } catch {
      // rastreio nunca pode quebrar a página
    }
  }, []);

  return null;
}
