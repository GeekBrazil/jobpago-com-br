"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { honra, OFERECE, TIPOS_REFUGIO } from "@/data/honra";
import Compartilhar from "@/components/Compartilhar";

interface Refugio { id: number; nome: string; tipo: string; cidade: string; uf: string; oferece: string[]; preco_noite: string | null; honra: string | null; verificado_em: string | null }
const NOME_TIPO = Object.fromEntries(TIPOS_REFUGIO) as Record<string, string>;
const NOME_OFERECE = Object.fromEntries(OFERECE) as Record<string, string>;

export default function CertificadosLista() {
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
          ? "Carregando..."
          : `${certificados.length} ${certificados.length === 1 ? "lugar verificado" : "lugares verificados"}`}
      </h2>

      {!loading && certificados.length === 0 && (
        <div className="mt-6 glass-card rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Icon name="shield" width={52} height={52} className="text-amber-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            Nenhum refúgio ou estabelecimento verificado ainda
          </h3>
          <p className="text-sm text-slate-400 max-w-md">
            A Expedição Paraty → Fortaleza está começando. Os
            primeiros selos aparecem aqui assim que o Allan visitar e testar
            o local pessoalmente.
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
                      <Icon name="shield" width={26} height={26} /> Refúgio verificado
                    </span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-xl border ${h.cor}`}>{h.nome}</span>
                  </div>
                  <h3 className="text-base font-black text-white leading-snug">{r.nome}</h3>
                  <p className="text-xs text-slate-400 mt-1">{NOME_TIPO[r.tipo] ?? r.tipo}{r.preco_noite ? ` · noite ${r.preco_noite}` : ""}</p>
                  {r.oferece?.length > 0 && (
                    <p className="text-xs text-slate-300 leading-relaxed mt-3">{r.oferece.map((o) => NOME_OFERECE[o] ?? o).join(" · ")}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-4">
                  <Icon name="pin" width={28} height={28} /> {r.cidade} · {r.uf}{r.verificado_em ? ` · visitado em ${r.verificado_em}` : ""}
                </span>
                <Compartilhar compacto card={`/card/refugio/${r.id}`} titulo={`${r.nome}: Refúgio da Estrada verificado`} link="https://jobpago.com.br/certificados" />
              </div>
            );
          })}
        </div>
      )}

      {/* CTA PERSISTENTE PRA ESTABELECIMENTO NOVO — fica visível mesmo com a lista cheia */}
      <div className="mt-10 glass-panel border border-amber-400/25 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Icon name="shield" width={40} height={40} className="text-amber-300" /> Seu estabelecimento na rota?
          </h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
            Camping, hostel, pousada, hotel ou pátio para motorhome. Peça a
            visita — a gente passa a noite, confere a estrutura e, se aprovar,
            você entra nesta lista com a data e o QR code no local.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/refugio"
            className="btn-primary-amalfi px-6 py-3 rounded-2xl text-sm font-black cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Icon name="tent" width={34} height={34} /> Pedir a visita
          </Link>
          <Link
            href="/parceiros/planos"
            className="btn-secondary-glass px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer flex items-center justify-center whitespace-nowrap"
          >
            Ver Planos
          </Link>
        </div>
      </div>
    </section>
  );
}
