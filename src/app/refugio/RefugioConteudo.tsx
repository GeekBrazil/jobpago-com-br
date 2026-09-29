"use client";

import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import SeletorIdioma from "@/components/SeletorIdioma";
import FormRefugio from "./FormRefugio";
import { NIVEIS_HONRA } from "@/data/honra";
import { tHonra } from "@/lib/traducoesCadastro";
import type { Idioma } from "@/lib/textosEstrada";

const L = (i: Idioma, pt: string, es: string, en: string) => (i === "es" ? es : i === "en" ? en : pt);

export default function RefugioConteudo() {
  const [idioma, setIdioma] = useIdioma();
  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{L(idioma, "Expedição nº 01 · saída 15 de outubro", "Expedición nº 01 · salida 15 de octubre", "Expedition no. 01 · departs 15 October")}</p>
        <SeletorIdioma idioma={idioma} onChange={setIdioma} />
      </div>
      <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{L(idioma, "Seja um Refúgio da Estrada", "Sé un Refugio de la Ruta", "Become a Road Refuge")}</h1>
      <p className="mt-4 text-lg text-slate-300 max-w-2xl">
        {L(idioma,
          "Camping, hostel, pousada, hotel ou pátio para motorhome entre Paraty e Fortaleza: peça a visita. A gente passa a noite, confere o que está combinado e, se estiver tudo certo, seu lugar entra no mapa com o selo e a data da visita.",
          "Camping, hostel, posada, hotel o patio para motorhome entre Paraty y Fortaleza: pedí la visita. Pasamos la noche, revisamos lo acordado y, si todo está bien, tu lugar entra al mapa con el sello y la fecha de la visita.",
          "Campsite, hostel, guesthouse, hotel or motorhome yard between Paraty and Fortaleza: ask for a visit. We spend the night, check what was agreed and, if all is right, your place goes on the map with the seal and the visit date.")}
      </p>

      <section className="mt-12" aria-labelledby="honra">
        <h2 id="honra" className="text-2xl sm:text-3xl font-black">{L(idioma, "Alta Honra: como seu lugar apoia a estrada", "Alto Honor: cómo tu lugar apoya la ruta", "High Honour: how your place supports the road")}</h2>
        <p className="mt-2 text-slate-300 max-w-2xl">
          {L(idioma,
            "O selo de verificado não se compra — só entra quem passou na visita. A Honra mostra, identificada no selo, quanto o lugar apoia a expedição.",
            "El sello de verificado no se compra: solo entra quien pasó la visita. El Honor muestra, identificado en el sello, cuánto apoya el lugar a la expedición.",
            "The verified seal can't be bought — only places that pass the visit get it. Honour shows, marked on the seal, how much the place supports the expedition.")}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {NIVEIS_HONRA.map((n) => (
            <div key={n.id} className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${n.cor}`}>{tHonra(idioma, n.id, "nome", n.nome)}</span>
                <span className="text-xs font-mono text-slate-400">{tHonra(idioma, n.id, "como", n.como)}</span>
              </div>
              <p className="mt-3 text-sm text-slate-200">{tHonra(idioma, n.id, "desc", n.desc)}</p>
              <p className="mt-2 text-sm text-slate-400"><span className="text-slate-300 font-bold">{L(idioma, "Ganha:", "Gana:", "Gets:")}</span> {tHonra(idioma, n.id, "ganha", n.ganha)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          {L(idioma, "Valores dos planos em", "Valores de los planes en", "Plan prices at")} <Link href="/parceiros/planos" className="underline hover:text-amber-400">{L(idioma, "Parceiros", "Socios", "Partners")}</Link>.{" "}
          {L(idioma, "O que conferimos na visita está em", "Lo que revisamos en la visita está en", "What we check on the visit is at")}{" "}
          <Link href="/#refugio-estrada" className="underline hover:text-amber-400">{L(idioma, "Refúgio da Estrada", "Refugio de la Ruta", "Road Refuge")}</Link>.
        </p>
      </section>

      <section className="mt-14" aria-labelledby="cadastro">
        <h2 id="cadastro" className="text-2xl sm:text-3xl font-black">{L(idioma, "Pedir a visita", "Pedir la visita", "Ask for a visit")}</h2>
        <p className="mt-2 text-slate-300">{L(idioma, "Leva 2 minutos. A gente responde pelo WhatsApp para combinar a data.", "Lleva 2 minutos. Respondemos por WhatsApp para acordar la fecha.", "Takes 2 minutes. We reply on WhatsApp to set a date.")}</p>
        <FormRefugio idioma={idioma} />
      </section>
    </>
  );
}
