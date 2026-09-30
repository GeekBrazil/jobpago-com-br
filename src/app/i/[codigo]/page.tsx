import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CidadeTopo from "../../cidade/CidadeTopo";
import GuardaIndicacao from "./GuardaIndicacao";
import { garantirTabelasIndicacao, codigoValido } from "@/lib/indicacao";
import { NIVEIS_HONRA } from "@/data/honra";
import { tHonra } from "@/lib/traducoesCadastro";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Você foi indicado para a JobPago", "Te recomendaron para JobPago", "You were referred to JobPago"),
    description: L(i,
      "Negócios da rota entram no mapa da Expedição JobPago com o registro de visita. Veja como participar.",
      "Los negocios de la ruta entran en el mapa de la Expedición JobPago con el registro de visita. Mirá cómo participar.",
      "Businesses along the route join the JobPago Expedition map with a visit record. See how to take part."),
    robots: { index: false },
  };
}

export default async function IndicacaoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params;
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const codigo = bruto.toUpperCase();
  if (!codigoValido(codigo)) notFound();
  const pool = await garantirTabelasIndicacao();
  const r = pool ? await pool.query(`SELECT u.nome FROM indicadores i JOIN usuarios u ON u.id = i.usuario_id WHERE i.codigo = $1`, [codigo]) : null;
  const nome = r?.rows[0]?.nome?.split(" ")[0];
  if (!nome) notFound();

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <GuardaIndicacao codigo={codigo} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{t("Indicação de", "Recomendación de", "Referral from")} {nome}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{t(`${nome} indicou o seu negócio para a JobPago`, `${nome} recomendó tu negocio a JobPago`, `${nome} referred your business to JobPago`)}</h1>
        <p className="mt-4 text-lg text-slate-300">
          {t("A JobPago liga negócios locais e da rota a quem está passando e a quem faz as tarefas do dia a dia. Na Expedição nº 01 (Paraty → Fortaleza, saída em 15 de outubro), a gente visita e verifica os lugares da rota.",
            "JobPago conecta negocios del barrio y de la ruta con quien está de paso y con quien hace las tareas del día a día. En la Expedición nº 01 (Paraty → Fortaleza, salida el 15 de octubre) visitamos y verificamos los lugares del recorrido.",
            "JobPago connects local and roadside businesses with people passing through and people who do everyday tasks. On Expedition no. 01 (Paraty → Fortaleza, leaving 15 October), we visit and verify places along the route.")}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/refugio" className="glass-panel rounded-3xl p-6 border border-amber-400/40 hover:border-amber-400">
            <p className="font-black text-white text-lg">{t("Tem onde dormir?", "¿Tenés dónde dormir?", "Got a place to sleep?")}</p>
            <p className="mt-1 text-sm text-slate-300">{t("Camping, hostel, pousada, hotel ou pátio: peça a visita e seja um Pouso visitado.", "Camping, hostel, posada, hotel o patio: pedí la visita y sé una Parada visitada.", "Campsite, hostel, guesthouse, hotel or yard: request a visit and become a Visited stopover.")}</p>
          </Link>
          <Link href="/parceiros/planos" className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-amber-400/60">
            <p className="font-black text-white text-lg">{t("Outro tipo de negócio?", "¿Otro tipo de negocio?", "Another kind of business?")}</p>
            <p className="mt-1 text-sm text-slate-300">{t("Veja os planos de parceiro: destaque identificado, minisite, perfil no Google e vídeo no local.", "Mirá los planes de socio: destacado identificado, minisitio, perfil en Google y video en el lugar.", "See the partner plans: labeled featured spot, mini-site, Google profile and on-site video.")}</p>
          </Link>
        </div>
        <section className="mt-10">
          <h2 className="text-xl font-black">{t("Alta Honra", "Alto Honor", "High Honour")}</h2>
          <p className="mt-2 text-sm text-slate-300">{t("O registro de visita não é vendido. Parceiros pagantes aparecem sempre identificados como Parceiro. A Honra mostra como o lugar apoia a expedição:", "El registro de visita no se vende. Los socios que pagan aparecen siempre identificados como Socio. El Honor muestra cómo el lugar apoya la expedición:", "The visit record isn't sold. Paying partners are always labeled as Partner. Honour shows how the place supports the expedition:")}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {NIVEIS_HONRA.map((n) => <li key={n.id} className="text-sm"><span className={`inline-block text-xs font-black px-2 py-0.5 rounded-full border mr-2 ${n.cor}`}>{tHonra(i, n.id, "nome", n.nome)}</span>{tHonra(i, n.id, "como", n.como)}</li>)}
          </ul>
        </section>
        <p className="mt-10 text-xs text-slate-400">
          {t(`Transparência: ${nome} recebe uma comissão se você fechar um plano de parceiro da JobPago. É assim que a gente remunera quem apresenta a rede — o preço para você é o mesmo.`,
            `Transparencia: ${nome} recibe una comisión si contratás un plan de socio de JobPago. Así remuneramos a quien presenta la red; el precio para vos es el mismo.`,
            `Transparency: ${nome} earns a commission if you take a JobPago partner plan. That's how we reward people who grow the network — your price is the same.`)}
        </p>
      </main>
    </div>
  );
}
