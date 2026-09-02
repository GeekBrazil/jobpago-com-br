import Link from "next/link";
import type { Metadata } from "next";
import { PLANOS, linkWhatsapp, WHATSAPP } from "@/data/planos-parceiro";

export const metadata: Metadata = {
  title: "Parceiros da Expedição · JobPago.com.br",
  description:
    "Quatro formas de fazer parte da Expedição JobPago, de Angra dos Reis a Fortaleza: permuta, parceiro local, patrocínio regional e master. Selo verificado em campo, com data.",
  robots: { index: true, follow: true },
};

const ACENTO = {
  emerald: { borda: "border-emerald-500/30", texto: "text-emerald-300", chip: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" },
  amber: { borda: "border-amber-400/40", texto: "text-amber-300", chip: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
  cyan: { borda: "border-cyan-500/30", texto: "text-cyan-300", chip: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300" },
  slate: { borda: "border-white/12", texto: "text-slate-300", chip: "bg-white/5 border-white/15 text-slate-300" },
} as const;

export default function PlanosParceiroPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <Link
          href="/"
          className="text-xs font-black text-emerald-400 hover:underline uppercase tracking-widest inline-block mb-8"
        >
          ← Voltar para o JobPago
        </Link>

        {/* ── ABERTURA ── */}
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Angra dos Reis → Fortaleza
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            Parceiros da Expedição
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Estou percorrendo o litoral parando em pousadas, restaurantes de estrada,
            postos, oficinas e cafés. Onde eu paro, eu testo: ducha, tomada, Wi-Fi,
            pátio. O que passa no teste entra no mapa do JobPago com selo, data e a
            lista do que foi verificado.
          </p>
        </header>

        {/* ── O QUE O SELO SIGNIFICA ── */}
        <section
          aria-labelledby="selo"
          className="mt-12 glass-panel rounded-3xl border border-white/10 p-6 sm:p-8"
        >
          <h2 id="selo" className="text-lg sm:text-xl font-black text-white">
            O que o selo significa
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Não é adesivo comprado. O selo diz que alguém esteve ali, testou a
            estrutura e anotou a data. Wi-Fi entra com velocidade medida e data da
            última verificação, não com &quot;temos internet&quot;. Se a estrutura mudar,
            o selo cai — é isso que faz ele valer alguma coisa para quem está na estrada.
          </p>
        </section>

        {/* ── OS QUATRO NÍVEIS ── */}
        <section aria-labelledby="niveis" className="mt-14">
          <h2 id="niveis" className="text-xl sm:text-2xl font-black text-white">
            Quatro formas de entrar
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Do que não custa dinheiro ao que é conversa. Todo acordo é fechado no
            WhatsApp — não há checkout aqui de propósito.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {PLANOS.map((p) => {
              const a = ACENTO[p.tom];
              return (
                <article
                  key={p.id}
                  className={`glass-panel rounded-3xl border ${a.borda} p-6 flex flex-col ${
                    p.destaque ? "md:scale-[1.02] shadow-2xl" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${a.chip}`}
                    >
                      Nível {p.nivel}
                    </span>
                    {p.destaque && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        Mais procurado
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-black text-white">{p.nome}</h3>

                  <p className={`mt-1.5 text-sm font-bold ${a.texto}`}>
                    {p.valor ?? "Sob consulta"}
                  </p>

                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{p.resumo}</p>

                  <ul className="mt-5 space-y-2.5 text-sm text-slate-300 flex-1">
                    {p.entregaveis.map((e) => (
                      <li key={e} className="flex gap-2.5">
                        <span aria-hidden="true" className={a.texto}>
                          ✓
                        </span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={linkWhatsapp(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 btn-primary-emerald text-sm px-5 py-3 rounded-2xl text-center font-bold min-h-[44px] flex items-center justify-center"
                  >
                    {p.valor === null ? "Conversar sobre este nível" : "Quero este nível"}
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── LIMITE DO ACORDO ── */}
        <section
          aria-labelledby="limite"
          className="mt-14 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6"
        >
          <h2 id="limite" className="text-sm font-black text-amber-300 uppercase tracking-wider">
            O que este acordo não é
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Patrocínio e parceria são acordos comerciais diretos entre você e o JobPago,
            referentes a divulgação e verificação em campo. Não têm relação com os
            serviços anunciados na plataforma: ali o valor continua sendo{" "}
            <strong className="text-white">combinado e pago direto entre as partes</strong>,
            via PIX, sem comissão retida e sem custódia do JobPago. Ver os{" "}
            <Link href="/termos" className="text-emerald-400 hover:underline font-medium">
              Termos de Uso
            </Link>
            .
          </p>
        </section>

        {/* ── FECHO ── */}
        <section className="mt-14 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Está na rota entre Angra e Fortaleza?
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Me chama no WhatsApp com o nome do estabelecimento e a cidade. Se estiver
            no caminho, eu passo, testo e a gente decide o nível olhando a estrutura.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
              "Olá Allan! Meu estabelecimento está na rota da Expedição JobPago e quero saber sobre a parceria."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 btn-primary-emerald inline-flex items-center justify-center gap-2 text-sm px-7 py-3.5 rounded-2xl font-bold min-h-[44px]"
          >
            Falar no WhatsApp
          </a>
        </section>
      </main>
    </div>
  );
}
