"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { honra, OFERECE, TIPOS_REFUGIO } from "@/data/honra";
import Compartilhar from "@/components/Compartilhar";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";
import { tTipo, tOferece, tHonra } from "@/lib/traducoesCadastro";

interface Refugio { id: number; nome: string; tipo: string; cidade: string; uf: string; oferece: string[]; preco_noite: string | null; honra: string | null; verificado_em: string | null }
const NOME_TIPO = Object.fromEntries(TIPOS_REFUGIO) as Record<string, string>;
const NOME_OFERECE = Object.fromEntries(OFERECE) as Record<string, string>;

export default function CertificadosLista() {
  const [i] = useIdioma();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const [certificados, setCertificados] = useState<Refugio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/refugios")
      .then((res) => res.json())
      .then((data) => setCertificados(data.refugios ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-16">
      <h2 className="text-xl sm:text-2xl font-black text-white">
        {loading
          ? t("Carregando...", "Cargando...", "Loading...")
          : `${certificados.length} ${certificados.length === 1 ? t("lugar verificado", "lugar verificado", "verified place") : t("lugares verificados", "lugares verificados", "verified places")}`}
      </h2>

      {!loading && certificados.length === 0 && (
        <div className="mt-6 glass-card rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Icon name="shield" width={52} height={52} className="text-amber-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {t("Nenhum refúgio ou estabelecimento verificado ainda", "Todavía no hay refugios ni establecimientos verificados", "No refuges or verified places yet")}
          </h3>
          <p className="text-sm text-slate-400 max-w-md">
            {t("A Expedição Paraty → Fortaleza está começando. Os primeiros selos aparecem aqui assim que o Allan visitar e testar o local pessoalmente.",
              "La Expedición Paraty → Fortaleza está empezando. Los primeros sellos aparecen acá apenas Allan visite y pruebe el lugar en persona.",
              "The Paraty → Fortaleza Expedition is just starting. The first seals appear here as soon as Allan visits and tests each place in person.")}
          </p>
        </div>
      )}

      {!loading && certificados.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificados.map((r) => {
            const h = honra(r.honra);
            return (
              <div key={r.id} className="glass-card glass-amber rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Icon name="shield" width={26} height={26} /> {t("Refúgio verificado", "Refugio verificado", "Verified refuge")}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-xl border ${h.cor}`}>{tHonra(i, h.id, "nome", h.nome)}</span>
                  </div>
                  <h3 className="text-base font-black text-white leading-snug">{r.nome}</h3>
                  <p className="text-xs text-slate-400 mt-1">{tTipo(i, r.tipo, NOME_TIPO[r.tipo] ?? r.tipo)}{r.preco_noite ? ` · ${t("noite", "noche", "night")} ${r.preco_noite}` : ""}</p>
                  {r.oferece?.length > 0 && (
                    <p className="text-xs text-slate-300 leading-relaxed mt-3">{r.oferece.map((o) => tOferece(i, o, NOME_OFERECE[o] ?? o)).join(" · ")}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-4">
                  <Icon name="pin" width={28} height={28} /> {r.cidade} · {r.uf}{r.verificado_em ? ` · ${t("visitado em", "visitado el", "visited")} ${r.verificado_em}` : ""}
                </span>
                <Compartilhar compacto card={`/card/refugio/${r.id}`} titulo={`${r.nome}: ${t("Refúgio da Estrada verificado", "Refugio de la Ruta verificado", "verified Road Refuge")}`} link="https://jobpago.com.br/certificados" />
              </div>
            );
          })}
        </div>
      )}

      {/* CTA PERSISTENTE PRA ESTABELECIMENTO NOVO — fica visível mesmo com a lista cheia */}
      <div className="mt-10 glass-panel border border-amber-400/25 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Icon name="shield" width={40} height={40} className="text-amber-300" /> {t("Seu estabelecimento na rota?", "¿Tu establecimiento está en la ruta?", "Is your place on the route?")}
          </h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
            {t("Camping, hostel, pousada, hotel ou pátio para motorhome. Peça a visita — a gente passa a noite, confere a estrutura e, se aprovar, você entra nesta lista com a data e o QR code no local.",
              "Camping, hostel, posada, hotel o patio para motorhome. Pedí la visita: pasamos la noche, revisamos la estructura y, si aprueba, entrás en esta lista con la fecha y el código QR en el lugar.",
              "Campsite, hostel, guesthouse, hotel or motorhome yard. Request a visit — we spend the night, check the facilities and, if approved, you join this list with the date and the QR code on site.")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/refugio"
            className="btn-primary-amalfi px-6 py-3 rounded-2xl text-sm font-black cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Icon name="tent" width={34} height={34} /> {t("Pedir a visita", "Pedir la visita", "Request a visit")}
          </Link>
          <Link
            href="/parceiros/planos"
            className="btn-secondary-glass px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer flex items-center justify-center whitespace-nowrap"
          >
            {t("Ver Planos", "Ver planes", "See plans")}
          </Link>
        </div>
      </div>
    </section>
  );
}
