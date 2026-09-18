"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import {
  FAIXAS_CONTRIBUICAO,
  VALOR_MIN_SLIDER,
  VALOR_MAX_SLIDER,
  faixaAtual,
} from "@/data/apoiadores";
import { WHATSAPP } from "@/data/planos-parceiro";

const TONS: Record<string, { texto: string; bg: string; borda: string }> = {
  slate: { texto: "text-slate-300", bg: "bg-white/5", borda: "border-white/15" },
  emerald: { texto: "text-emerald-300", bg: "bg-emerald-500/15", borda: "border-emerald-500/30" },
  amber: { texto: "text-amber-300", bg: "bg-amber-500/15", borda: "border-amber-500/30" },
  cyan: { texto: "text-cyan-300", bg: "bg-cyan-500/15", borda: "border-cyan-500/30" },
};

export default function ReguaContribuicao() {
  const [valor, setValor] = useState(100);
  const faixa = faixaAtual(valor);
  const pct = ((valor - VALOR_MIN_SLIDER) / (VALOR_MAX_SLIDER - VALOR_MIN_SLIDER)) * 100;

  const linkWhatsappContribuicao = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá Allan! Quero contribuir com R$ ${valor} pra Expedição JobPago.`
  )}`;

  return (
    <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-10">
      <p className="text-sm text-slate-400 max-w-2xl">
        Arraste pra escolher quanto quer contribuir com a Expedição. Cada
        faixa desbloqueia uma insígnia — combinado no WhatsApp, sem checkout.
      </p>

      <div className="mt-10 px-2">
        <div className="relative">
          {/* MARCADORES DA RÉGUA */}
          <div className="absolute -top-9 left-0 right-0 h-8">
            {FAIXAS_CONTRIBUICAO.map((f) => {
              const left = ((f.valorMinimo - VALOR_MIN_SLIDER) / (VALOR_MAX_SLIDER - VALOR_MIN_SLIDER)) * 100;
              const atingida = valor >= f.valorMinimo;
              const tom = TONS[f.tom];
              return (
                <div
                  key={f.id}
                  style={{ left: `${left}%` }}
                  className="absolute -translate-x-1/2 flex flex-col items-center"
                >
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg border whitespace-nowrap transition-all ${
                      atingida ? `${tom.bg} ${tom.texto} ${tom.borda}` : "bg-white/5 text-slate-500 border-white/10"
                    }`}
                  >
                    R$ {f.valorMinimo}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRILHA */}
          <div className="relative h-2 rounded-full bg-white/10 overflow-visible">
            <div
              className="absolute h-2 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
              style={{ width: `${pct}%` }}
            />
            {FAIXAS_CONTRIBUICAO.map((f) => {
              const left = ((f.valorMinimo - VALOR_MIN_SLIDER) / (VALOR_MAX_SLIDER - VALOR_MIN_SLIDER)) * 100;
              const atingida = valor >= f.valorMinimo;
              return (
                <div
                  key={f.id}
                  style={{ left: `${left}%` }}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
                    atingida ? "bg-amber-400 border-amber-200" : "bg-slate-700 border-slate-500"
                  }`}
                />
              );
            })}
          </div>

          <input
            type="range"
            min={VALOR_MIN_SLIDER}
            max={VALOR_MAX_SLIDER}
            step={10}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className="w-full h-2 mt-2 appearance-none bg-transparent cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(16,185,129,0.4)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:-mt-2 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(16,185,129,0.4)] [&::-moz-range-thumb]:cursor-grab"
          />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white font-mono">R$ {valor}</span>
            {faixa ? (
              <span
                className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${TONS[faixa.tom].bg} ${TONS[faixa.tom].texto} ${TONS[faixa.tom].borda}`}
              >
                <Icon name="medal" width={13} height={13} /> {faixa.insignia}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500">Arraste pra desbloquear uma insígnia</span>
            )}
          </div>

          <a
            href={linkWhatsappContribuicao}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-emerald w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-black cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Icon name="chat" width={15} height={15} /> Contribuir via PIX
          </a>
        </div>

        {faixa && (
          <p className="mt-4 text-xs text-slate-400">{faixa.recompensa}</p>
        )}
      </div>
    </div>
  );
}
