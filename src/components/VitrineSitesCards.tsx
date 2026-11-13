"use client";

import { useEffect, useState } from "react";

interface PreviewMeta {
  url: string;
  dominio: string;
  titulo: string;
  descricao: string;
  screenshotUrl: string;
}

export function normalizarLinkSite(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function CardSiteComPrint({
  url,
  onRemover,
}: {
  url: string;
  onRemover?: () => void;
}) {
  const urlNormalizada = normalizarLinkSite(url) || url;
  let dominioInicial = urlNormalizada;
  try {
    const u = new URL(urlNormalizada);
    dominioInicial = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname.replace(/\/$/, "") : "");
  } catch {
    // mantém string original
  }

  const [meta, setMeta] = useState<PreviewMeta>({
    url: urlNormalizada,
    dominio: dominioInicial,
    titulo: dominioInicial,
    descricao: "Carregando informações e print automático do site...",
    screenshotUrl: `/api/screenshot?url=${encodeURIComponent(urlNormalizada)}`,
  });

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/site-preview?url=${encodeURIComponent(urlNormalizada)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.ok) {
          setMeta({
            url: d.url,
            dominio: d.dominio,
            titulo: d.titulo || dominioInicial,
            descricao: d.descricao || "Site verificado e publicado na vitrine do JobPago.",
            screenshotUrl: d.screenshotUrl,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [urlNormalizada, dominioInicial]);

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-cyan-500/35 flex flex-col justify-between group hover:scale-[1.01] transition-all bg-slate-950/60">
      <div>
        {/* Barra Superior de Navegador (igual ao jobpago.com.br/allan) */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="truncate max-w-[180px] text-slate-300">{meta.dominio}</span>
          {onRemover ? (
            <button
              type="button"
              onClick={onRemover}
              className="text-rose-400 hover:text-rose-300 font-bold text-xs px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 cursor-pointer"
              title="Remover este site"
            >
              ✕
            </button>
          ) : (
            <span className="text-amber-300">↗</span>
          )}
        </div>

        {/* Print Automático do Site */}
        <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
          <img
            src={meta.screenshotUrl}
            alt={meta.titulo}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-transform transition-opacity duration-500 motion-reduce:transform-none"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
          <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-white/20 text-[10px] font-mono font-bold text-cyan-200 uppercase">
            PRINT AO VIVO
          </span>
        </div>

        <div className="p-5">
          <h4 className="text-base sm:text-lg font-black text-white line-clamp-1">{meta.titulo}</h4>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed line-clamp-2">{meta.descricao}</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <a
          href={meta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full btn-secondary-glass py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 border-amber-500/30 hover:border-amber-400 flex items-center justify-center gap-1.5"
        >
          <span>Abrir Site ao Vivo ↗</span>
        </a>
      </div>
    </div>
  );
}

export function VitrineSitesCards({
  sites,
  tituloSecao = "Vitrine de Sites & Projetos (Print Automático)",
}: {
  sites?: string[] | null;
  tituloSecao?: string;
}) {
  const lista = (sites || []).map((s) => normalizarLinkSite(s)).filter((s): s is string => Boolean(s));
  if (!lista.length) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
          🖥️ {tituloSecao} ({lista.length})
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((url) => (
          <CardSiteComPrint key={url} url={url} />
        ))}
      </div>
    </div>
  );
}

export function CampoSitesPortfolio({
  sites,
  onChange,
  rotulo = "Seus Sites, Portfólio ou Loja Online (Print Automático em Cards)",
  subtitulo = "Cole o link de qualquer site que você criou ou do seu negócio. O JobPago tira o print da tela automaticamente e monta os cards interativos no seu perfil (igual ao jobpago.com.br/allan).",
}: {
  sites: string[];
  onChange: (novos: string[]) => void;
  rotulo?: string;
  subtitulo?: string;
}) {
  const [inputUrl, setInputUrl] = useState("");
  const [erroUrl, setErroUrl] = useState("");

  function adicionarSite() {
    setErroUrl("");
    const norm = normalizarLinkSite(inputUrl);
    if (!norm) {
      setErroUrl("Digite um endereço válido (ex.: meusite.com.br ou https://minhapousada.com.br)");
      return;
    }
    if (sites.includes(norm)) {
      setErroUrl("Este site já foi adicionado à sua vitrine.");
      return;
    }
    if (sites.length >= 9) {
      setErroUrl("Você pode adicionar até 9 sites na vitrine.");
      return;
    }
    onChange([...sites, norm]);
    setInputUrl("");
  }

  function removerSite(url: string) {
    onChange(sites.filter((s) => s !== url));
  }

  return (
    <div className="rounded-2xl bg-slate-950/60 border border-cyan-500/30 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
          📸 VITRINE DE SITES COM PRINT AUTOMÁTICO
        </span>
        <span className="text-[11px] font-mono text-slate-400">{sites.length}/9 cards</span>
      </div>
      <p className="text-sm font-bold text-white mt-1">{rotulo}</p>
      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{subtitulo}</p>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionarSite();
            }
          }}
          placeholder="Ex.: visiteprado.com.br ou https://meusite.com.br"
          className="flex-1 rounded-xl bg-slate-900/90 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={adicionarSite}
          className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer transition-colors"
        >
          + Gerar Card com Print
        </button>
      </div>

      {erroUrl && <p className="mt-2 text-xs text-rose-300 font-bold">{erroUrl}</p>}

      {sites.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sites.map((url) => (
            <CardSiteComPrint key={url} url={url} onRemover={() => removerSite(url)} />
          ))}
        </div>
      )}
    </div>
  );
}

