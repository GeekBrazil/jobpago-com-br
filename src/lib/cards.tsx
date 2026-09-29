import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

/* Cards para redes sociais (Instagram feed/stories, X e Facebook), gerados no
   próprio site a partir de dado real — nunca de texto livre, para ninguém usar
   a marca para publicar o que quiser. */

export const FORMATOS = {
  feed: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
  link: { w: 1200, h: 675 },
} as const;
export type Formato = keyof typeof FORMATOS;
export const formatoDe = (v: string | null): Formato => (v === "story" || v === "link" ? v : "feed");

const AMBAR = "#fbbf24";
const FUNDO = "#07090e";

export function card(formato: Formato, conteudo: { selo: string; titulo: string; destaque?: string; subtitulo?: string; linhas?: string[]; rodape: string; medalha?: { texto: string; fundo: string; cor: string } }): ImageResponse {
  const { w, h } = FORMATOS[formato];
  const largo = formato === "link";
  const escala = largo ? 0.62 : 1;
  const px = (n: number) => Math.round(n * escala);
  const el: ReactNode = (
    <div style={{ width: w, height: h, display: "flex", flexDirection: "column", justifyContent: "space-between", background: `linear-gradient(160deg, ${FUNDO} 0%, #111827 60%, #1f1405 100%)`, color: "#f8fafc", padding: px(80), fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: px(46), fontWeight: 900 }}>JobPago<span style={{ color: AMBAR }}>.</span></div>
        <div style={{ display: "flex", fontSize: px(26), fontWeight: 700, color: AMBAR, border: `2px solid ${AMBAR}`, borderRadius: 999, padding: `${px(10)}px ${px(24)}px` }}>{conteudo.selo}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {conteudo.medalha && (
          <div style={{ display: "flex", alignSelf: "flex-start", fontSize: px(30), fontWeight: 900, background: conteudo.medalha.fundo, color: conteudo.medalha.cor, borderRadius: 999, padding: `${px(10)}px ${px(28)}px`, marginBottom: px(28) }}>{conteudo.medalha.texto}</div>
        )}
        <div style={{ display: "flex", fontSize: px(largo ? 84 : 92), fontWeight: 900, lineHeight: 1.05 }}>{conteudo.titulo}</div>
        {conteudo.destaque && <div style={{ display: "flex", fontSize: px(largo ? 120 : 170), fontWeight: 900, color: AMBAR, lineHeight: 1, marginTop: px(36) }}>{conteudo.destaque}</div>}
        {conteudo.subtitulo && <div style={{ display: "flex", fontSize: px(44), color: "#cbd5e1", marginTop: px(20), lineHeight: 1.25 }}>{conteudo.subtitulo}</div>}
        {conteudo.linhas && conteudo.linhas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: px(48) }}>
            {conteudo.linhas.slice(0, largo ? 3 : 5).map((l) => (
              <div key={l} style={{ display: "flex", fontSize: px(38), color: "#e2e8f0", padding: `${px(14)}px 0`, borderTop: "2px solid rgba(255,255,255,0.12)" }}>{l}</div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", fontSize: px(30), color: "#94a3b8" }}>{conteudo.rodape}</div>
    </div>
  );
  return new ImageResponse(el as React.ReactElement, { width: w, height: h, headers: { "Cache-Control": "public, max-age=3600" } });
}
