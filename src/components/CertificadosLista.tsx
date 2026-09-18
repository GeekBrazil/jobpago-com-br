"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import type { Job } from "@/app/page";
import { WHATSAPP } from "@/data/planos-parceiro";

const PEDIR_SELO_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Olá Allan! Tenho um estabelecimento na rota e quero pedir o Selo JobPago Verificado."
)}`;

export default function CertificadosLista() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setJobs(data.jobs);
      })
      .finally(() => setLoading(false));
  }, []);

  const certificados = jobs.filter((j) => j.isVerifiedPartner);

  return (
    <section className="mt-16">
      <h2 className="text-xl sm:text-2xl font-black text-white">
        {loading
          ? "Carregando..."
          : `${certificados.length} estabelecimento${certificados.length === 1 ? "" : "s"} certificado${certificados.length === 1 ? "" : "s"}`}
      </h2>

      {!loading && certificados.length === 0 && (
        <div className="mt-6 glass-card rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Icon name="shield" width={26} height={26} className="text-amber-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            Nenhum estabelecimento certificado ainda
          </h3>
          <p className="text-sm text-slate-400 max-w-md">
            A Expedição Angra dos Reis → Fortaleza está começando. Os
            primeiros selos aparecem aqui assim que o Allan visitar e testar
            o local pessoalmente.
          </p>
        </div>
      )}

      {!loading && certificados.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificados.map((job) => (
            <div key={job.id} className="glass-card glass-amber rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Icon name="shield" width={13} height={13} /> Verificado
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white/5 text-emerald-300 border border-white/10">
                    {job.category}
                  </span>
                </div>
                <h3 className="text-base font-black text-white leading-snug mb-2">{job.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{job.description}</p>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1 mt-4">
                <Icon name="pin" width={14} height={14} /> {job.location}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA PERSISTENTE PRA ESTABELECIMENTO NOVO — fica visível mesmo com a lista cheia */}
      <div className="mt-10 glass-panel border border-amber-400/25 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Icon name="shield" width={20} height={20} className="text-amber-300" /> Seu estabelecimento na rota?
          </h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
            Posto, pousada, camping ou oficina. Peça o Selo JobPago
            Verificado — o Allan visita, testa a estrutura e, se aprovar,
            você entra nesta lista com data e QR code no local.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <a
            href={PEDIR_SELO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-emerald px-6 py-3 rounded-2xl text-sm font-black cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Icon name="chat" width={17} height={17} /> Pedir Meu Selo
          </a>
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
