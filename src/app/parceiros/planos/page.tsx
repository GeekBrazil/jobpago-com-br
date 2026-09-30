import Link from "next/link";
import type { Metadata } from "next";
import { PLANOS, linkWhatsapp, WHATSAPP } from "@/data/planos-parceiro";
import ReguaContribuicao from "@/components/ReguaContribuicao";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import { tPlano } from "@/lib/traducoesCadastro";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Parceiros da Expedição · JobPago.com.br", "Socios de la Expedición · JobPago.com.br", "Expedition partners · JobPago.com.br"),
    description: L(i,
      "Quatro formas de fazer parte da Expedição JobPago, de Paraty a Fortaleza: permuta, parceiro local, patrocínio regional e master. Registro de visita com data; parceiros pagantes sempre identificados.",
      "Cuatro formas de ser parte de la Expedición JobPago, de Paraty a Fortaleza: canje, socio local, patrocinio regional y master. Registro de visita con fecha; los socios que pagan siempre identificados.",
      "Four ways to be part of the JobPago Expedition, Paraty to Fortaleza: exchange, local partner, regional sponsorship and master. Visit record with a date; paying partners always labeled."),
    robots: { index: true, follow: true },
  };
}

const ACENTO = {
  amber: { borda: "border-amber-400/40", texto: "text-amber-300", chip: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
  cyan: { borda: "border-cyan-500/30", texto: "text-cyan-300", chip: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300" },
  slate: { borda: "border-white/12", texto: "text-slate-300", chip: "bg-white/5 border-white/15 text-slate-300" },
} as const;

export default async function PlanosParceiroPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <Link
          href="/"
          className="text-xs font-black text-amber-400 hover:underline uppercase tracking-widest inline-block mb-8"
        >
          ← {t("Voltar para o JobPago", "Volver a JobPago", "Back to JobPago")}
        </Link>

        {/* ── ABERTURA ── */}
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Paraty → Fortaleza
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            {t("Parceiros da Expedição", "Socios de la Expedición", "Expedition partners")}
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("Estou percorrendo o litoral parando em pousadas, restaurantes de estrada, postos, oficinas e cafés. Onde eu paro, registro o que encontrei: ducha, tomada, Wi-Fi, pátio. O lugar entra no mapa com a data da visita e a lista do que havia no dia.",
              "Estoy recorriendo la costa parando en posadas, paradores, estaciones de servicio, talleres y cafés. Donde paro, registro lo que encontré: ducha, enchufe, Wi-Fi, patio. El lugar entra en el mapa con la fecha de la visita y la lista de lo que había ese día.",
              "I'm travelling the coast stopping at guesthouses, roadside restaurants, gas stations, mechanics and cafés. Wherever I stop, I record what I found: shower, power, Wi-Fi, yard. The place goes on the map with the visit date and the list of what was there that day.")}
          </p>

          <Link
            href="/certificados"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:underline"
          >
            {t("Ver lugares visitados →", "Ver lugares visitados →", "See visited places →")}
          </Link>
        </header>

        {/* ── O QUE O SELO SIGNIFICA ── */}
        <section
          aria-labelledby="selo"
          className="mt-12 glass-panel rounded-3xl border border-white/10 p-6 sm:p-8"
        >
          <h2 id="selo" className="text-lg sm:text-xl font-black text-white">
            {t("O que o registro significa", "Qué significa el registro", "What the record means")}
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            {t("Alguém da expedição esteve ali e anotou o que havia, com data. Wi-Fi entra com a velocidade medida naquele dia. É um registro, não uma garantia: confira sempre com o estabelecimento. O registro de visita não é vendido. Parceiros pagantes aparecem em destaque e são sempre identificados como Parceiro.",
              "Alguien de la expedición estuvo ahí y anotó lo que había, con fecha. El Wi-Fi figura con la velocidad medida ese día. Es un registro, no una garantía: consultá siempre con el establecimiento. El registro de visita no se vende. Los socios que pagan aparecen destacados y siempre identificados como Socio.",
              "Someone from the expedition was there and noted what they found, with the date. Wi-Fi is listed with the speed measured that day. It's a record, not a guarantee: always check with the business. The visit record isn't sold. Paying partners are featured and always labeled as Partner.")}
          </p>
        </section>

        {/* ── OS QUATRO NÍVEIS ── */}
        <section aria-labelledby="niveis" className="mt-14">
          <h2 id="niveis" className="text-xl sm:text-2xl font-black text-white">
            {t("Quatro formas de entrar", "Cuatro formas de entrar", "Four ways in")}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {t("Do que não custa dinheiro ao que é conversa. Todo acordo é fechado no WhatsApp — não há checkout aqui de propósito.", "Desde lo que no cuesta dinero hasta lo que es conversación. Todo acuerdo se cierra por WhatsApp; acá no hay checkout a propósito.", "From free to by-conversation. Every deal is closed on WhatsApp — there's no checkout here, on purpose.")}
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {PLANOS.map((orig) => {
              const p = tPlano(i, orig);
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
                      {t("Nível", "Nivel", "Level")} {p.nivel}
                    </span>
                    {p.destaque && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {t("Mais procurado", "El más elegido", "Most popular")}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-black text-white">{p.nome}</h3>

                  <p className={`mt-1.5 text-sm font-bold ${a.texto}`}>
                    {p.valor ?? t("Sob consulta", "A consultar", "On request")}
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
                    href={linkWhatsapp(orig)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 btn-primary-amalfi text-sm px-5 py-3 rounded-2xl text-center font-bold min-h-[44px] flex items-center justify-center"
                  >
                    {p.valor === null ? t("Conversar sobre este nível", "Conversar sobre este nivel", "Talk about this level") : t("Quero este nível", "Quiero este nivel", "I want this level")}
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── RÉGUA DE CONTRIBUIÇÃO PIX (sem estabelecimento) ── */}
        <section aria-labelledby="regua" className="mt-14">
          <h2 id="regua" className="text-xl sm:text-2xl font-black text-white">
            {t("Não tem estabelecimento na rota?", "¿No tenés un establecimiento en la ruta?", "No place on the route?")}
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            {t("Você também pode apoiar a Expedição como pessoa física, sem precisar ter um posto, pousada ou camping.", "También podés apoyar la Expedición como persona, sin tener una estación, posada o camping.", "You can also support the Expedition as an individual, without owning a gas station, guesthouse or campsite.")}
          </p>
          <div className="mt-6">
            <ReguaContribuicao />
          </div>
          <Link
            href="/noticias-estrada"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
          >
            {t("Ver Notícias da Estrada →", "Ver Noticias de la Ruta →", "See Road News →")}
          </Link>
        </section>

        {/* ── LIMITE DO ACORDO ── */}
        <section
          aria-labelledby="limite"
          className="mt-14 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6"
        >
          <h2 id="limite" className="text-sm font-black text-amber-300 uppercase tracking-wider">
            {t("O que este acordo não é", "Lo que este acuerdo no es", "What this agreement is not")}
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            {t("Patrocínio e parceria são acordos comerciais diretos entre você e o JobPago, referentes a divulgação e verificação em campo. Não têm relação com os serviços anunciados na plataforma: ali o valor continua sendo",
              "Patrocinio y alianza son acuerdos comerciales directos entre vos y JobPago, sobre difusión y verificación en el lugar. No tienen relación con los servicios publicados en la plataforma: ahí el valor sigue siendo",
              "Sponsorship and partnership are direct commercial agreements between you and JobPago, covering promotion and on-site verification. They're unrelated to the services listed on the platform: there, the price is still")}{" "}
            <strong className="text-white">{t("combinado e pago direto entre as partes", "acordado y pagado directo entre las partes", "agreed and paid directly between the parties")}</strong>,{" "}
            {t("via PIX, sem comissão retida e sem custódia do JobPago. Ver os", "por PIX, sin comisión retenida y sin custodia de JobPago. Ver los", "via PIX, with no commission withheld and no custody by JobPago. See the")}{" "}
            <Link href="/termos" className="text-amber-400 hover:underline font-medium">
              {t("Termos de Uso", "Términos de Uso", "Terms of Use")}
            </Link>
            .
          </p>
        </section>

        {/* ── FECHO ── */}
        <section className="mt-14 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t("Está na rota entre Paraty e Fortaleza?", "¿Estás en la ruta entre Paraty y Fortaleza?", "On the route between Paraty and Fortaleza?")}
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t("Me chama no WhatsApp com o nome do estabelecimento e a cidade. Se estiver no caminho, eu passo, registro o que encontrei e a gente decide o nível olhando a estrutura.", "Escribime por WhatsApp con el nombre del establecimiento y la ciudad. Si está en el camino, paso, registro lo que encontré y decidimos el nivel mirando la estructura.", "Message me on WhatsApp with the place's name and town. If it's on the way, I'll stop by, record what I find and we'll pick the level by looking at the facilities.")}
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
              "Olá Allan! Meu estabelecimento está na rota da Expedição JobPago e quero saber sobre a parceria."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 btn-primary-amalfi inline-flex items-center justify-center gap-2 text-sm px-7 py-3.5 rounded-2xl font-bold min-h-[44px]"
          >
            {t("Falar no WhatsApp", "Hablar por WhatsApp", "Chat on WhatsApp")}
          </a>
        </section>
      </main>
    </div>
  );
}
