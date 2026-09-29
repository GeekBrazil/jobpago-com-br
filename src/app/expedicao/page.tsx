import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "../cidade/CidadeTopo";
import MapaRotaCliente from "./MapaRotaCliente";
import Compartilhar from "@/components/Compartilhar";
import rota from "@/data/expedicao-rota.json";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Expedição JobPago nº 01 — travessia de reconhecimento, Paraty → Fortaleza", "Expedición JobPago nº 01 — travesía de reconocimiento, Paraty → Fortaleza", "JobPago Expedition no. 01 — scouting crossing, Paraty → Fortaleza"),
    description: L(i,
      "O roteiro da Expedição JobPago: 15 paradas, rodovias, praças de pedágio (ANTT) e onde há acostamento informado — pensado para quem vai de carro, de carona ou a pé.",
      "La ruta de la Expedición JobPago: 15 paradas, rutas, peajes (ANTT) y dónde hay banquina registrada, pensada para quien va en auto, a dedo o a pie.",
      "The JobPago Expedition route: 15 stops, highways, toll plazas (ANTT) and where a hard shoulder is recorded — for travelling by car, hitchhiking or on foot."),
    alternates: { canonical: "https://jobpago.com.br/expedicao" },
  };
}

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
type Cls = "s" | "n" | "?";

export default async function ExpedicaoPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const ak = rota.acostamento_km as Record<Cls, number>;
  const pk = rota.pista_km as Record<"d" | "s" | "?", number>;
  const totalAk = ak.s + ak.n + ak["?"];

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">{t("Expedição JobPago", "Expedición JobPago", "JobPago Expedition")}</p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">{t("Paraty → Fortaleza, pelo litoral", "Paraty → Fortaleza, por la costa", "Paraty → Fortaleza, along the coast")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          {nf.format(rota.km_total)} km, {rota.paradas.length} {t("paradas, visitando os negócios da estrada que pedem o selo de verificado.", "paradas, visitando los negocios de la ruta que piden el sello de verificado.", "stops, visiting roadside businesses that ask for the verified seal.")}{" "}
          {t("O roteiro abaixo mostra rodovias, pedágios e onde há acostamento — para quem vai de carro, de carona ou a pé.", "La ruta de abajo muestra rutas, peajes y dónde hay banquina, para quien va en auto, a dedo o a pie.", "The route below shows highways, tolls and where there's a hard shoulder — for driving, hitchhiking or walking.")}
        </p>

        <section className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4" aria-label={t("Resumo do roteiro", "Resumen de la ruta", "Route summary")}>
          {[
            [nf.format(rota.km_total) + " km", t("de Paraty a Fortaleza", "de Paraty a Fortaleza", "from Paraty to Fortaleza")],
            [`${nf.format(rota.horas_carro)} h`, t("de carro, sem paradas", "en auto, sin paradas", "by car, non-stop")],
            [String(rota.pedagios.length), t("praças de pedágio federais", "peajes federales", "federal toll plazas")],
            [`${nf.format(rota.rodovias[0]?.km ?? 0)} km`, `${t("pela", "por la", "on the")} ${rota.rodovias[0]?.rodovia ?? "BR-101"}`],
          ].map(([v, r]) => (
            <div key={r} className="glass-panel rounded-3xl p-5">
              <p className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">{v}</p>
              <p className="mt-1 text-sm text-slate-300">{r}</p>
            </div>
          ))}
        </section>

        <section className="mt-12" aria-labelledby="mapa">
          <div className="mb-5 flex items-baseline gap-4">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-amber-400 shrink-0">Nº 01</span>
            <div>
              <h2 id="mapa" className="text-2xl sm:text-3xl font-black tracking-tight">{t("Travessia de reconhecimento", "Travesía de reconocimiento", "Scouting crossing")}</h2>
              <p className="mt-1 text-sm text-slate-400">{t("A primeira viagem abre o caminho: visitar, verificar e mapear cada ponto de apoio antes de convidar a estrada inteira.", "El primer viaje abre el camino: visitar, verificar y mapear cada punto de apoyo antes de invitar a toda la ruta.", "The first trip opens the way: visit, verify and map every support point before inviting the whole road.")}</p>
            </div>
          </div>
          <MapaRotaCliente
            geometria={rota.geometria as [number, number][]}
            acostamento={rota.acostamento}
            pista={rota.pista}
            pedagios={rota.pedagios}
            paradas={rota.paradas}
            idioma={i}
          />
          <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-300">
            <span><span className="inline-block w-6 h-1.5 rounded bg-blue-400 align-middle mr-2" />{t("pista duplicada", "autovía", "dual carriageway")} ({nf.format(pk.d)} km)</span>
            <span><span className="inline-block w-6 h-1 rounded bg-orange-400 align-middle mr-2" />{t("pista simples", "ruta simple", "single carriageway")} ({nf.format(pk.s)} km)</span>
            <span><span className="inline-block w-6 h-2.5 rounded bg-emerald-400 align-middle mr-2" />{t("acostamento confirmado", "banquina confirmada", "confirmed hard shoulder")} ({nf.format(ak.s)} km)</span>
            <span><span className="inline-block w-6 h-2.5 rounded bg-red-400 align-middle mr-2" />{t("sem acostamento", "sin banquina", "no hard shoulder")} ({nf.format(ak.n)} km)</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-amber-400 align-middle mr-2" />{t("pedágio", "peaje", "toll")}</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-slate-50 align-middle mr-2" />{t("parada", "parada", "stop")}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">{t("No celular, a página rola normalmente; para aproximar o mapa, use dois dedos.", "En el celular la página se desplaza normal; para mover el mapa, usá dos dedos.", "On a phone the page scrolls normally; use two fingers to move the map.")}</p>
        </section>

        {/* CARONA E A PÉ */}
        <section className="mt-14 glass-panel rounded-3xl p-6 sm:p-8" aria-labelledby="a-pe">
          <h2 id="a-pe" className="text-2xl sm:text-3xl font-black">{t("De carona ou a pé: o que conferir", "A dedo o a pie: qué revisar", "Hitchhiking or on foot: what to check")}</h2>
          <ul className="mt-5 space-y-3 text-slate-300">
            <li>
              <strong className="text-white">{t("Acostamento:", "Banquina:", "Hard shoulder:")}</strong>{" "}
              {i === "es"
                ? `solo ${nf.format(ak.s + ak.n)} de los ${nf.format(totalAk)} km tienen banquina registrada en OpenStreetMap (${nf.format(ak.s)} km con, ${nf.format(ak.n)} km sin). En el resto, el mapa muestra si es autovía o ruta simple; la ruta simple suele tener banquina angosta o ninguna. Revisalo en el lugar antes de caminar.`
                : i === "en"
                ? `only ${nf.format(ak.s + ak.n)} of the ${nf.format(totalAk)} km have shoulder data in OpenStreetMap (${nf.format(ak.s)} km with, ${nf.format(ak.n)} km without). Elsewhere the map shows dual or single carriageway — single carriageways usually have a narrow shoulder or none. Check on site before walking.`
                : `só ${nf.format(ak.s + ak.n)} dos ${nf.format(totalAk)} km têm acostamento registrado no OpenStreetMap (${nf.format(ak.s)} km com, ${nf.format(ak.n)} km sem). No resto, o mapa mostra se a pista é duplicada ou simples — pista simples costuma ter acostamento estreito ou nenhum. Confira no local antes de andar.`}
            </li>
            <li>
              <strong className="text-white">{t("A pé na rodovia:", "A pie en la ruta:", "Walking on the highway:")}</strong>{" "}
              {t("pelo Código de Trânsito (art. 68, § 3º), onde não há acostamento o pedestre anda pela borda da pista, em fila única, no sentido contrário ao dos veículos.",
                "según el Código de Tránsito brasileño (art. 68, § 3º), donde no hay banquina el peatón camina por el borde, en fila, en sentido contrario al de los vehículos.",
                "under Brazil's Traffic Code (art. 68, § 3), where there's no shoulder pedestrians walk at the edge of the road, single file, facing oncoming traffic.")}
            </li>
            <li>
              <strong className="text-white">{t("Pontos de carona:", "Dónde hacer dedo:", "Hitchhiking spots:")}</strong>{" "}
              {t("postos de combustível e praças de pedágio com cabine. As praças", "estaciones de servicio y peajes con cabina. Los peajes", "gas stations and toll plazas with booths. The")}
              <em> free flow</em>{" "}
              {t("da Rio-Santos (Paraty, Mangaratiba, Itaguaí) não têm cabine nem parada.", "de la Rio-Santos (Paraty, Mangaratiba, Itaguaí) no tienen cabina ni parada.", "tolls on the Rio-Santos (Paraty, Mangaratiba, Itaguaí) have no booth and no place to stop.")}
            </li>
            <li>
              <strong className="text-white">{t("Emergência na rodovia federal:", "Emergencia en ruta federal:", "Emergency on federal highways:")}</strong>{" "}
              {t("PRF 191. Nas concessionárias, o número fica nas placas e no site de cada uma.", "PRF (policía de rutas) 191. En las rutas concesionadas, el número está en los carteles y en el sitio de cada empresa.", "Highway Police (PRF) 191. On toll roads, the operator's number is on the signs and its website.")}
            </li>
          </ul>
        </section>

        {/* TRECHOS */}
        <section className="mt-14" aria-labelledby="trechos">
          <h2 id="trechos" className="text-2xl sm:text-3xl font-black">{t(`As ${rota.paradas.length} paradas`, `Las ${rota.paradas.length} paradas`, `The ${rota.paradas.length} stops`)}</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {rota.paradas.map((p, k) => {
              const leg = k > 0 ? rota.legs[k - 1] : null;
              return (
                <li key={p.nome} className="glass-panel rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white"><span className="text-amber-400 font-mono mr-2">{String(k + 1).padStart(2, "0")}</span>{p.nome} · {p.uf}</p>
                    {leg && <p className="text-xs text-slate-400 mt-1">{nf.format(leg.km)} km {t("desde a parada anterior", "desde la parada anterior", "from the previous stop")} · {i === "en" ? String(leg.horas) : String(leg.horas).replace(".", ",")} h {t("de carro", "en auto", "by car")}</p>}
                    <Compartilhar compacto card={`/card/expedicao/${k + 1}`} titulo={`${t("Expedição JobPago · parada", "Expedición JobPago · parada", "JobPago Expedition · stop")} ${k + 1}: ${p.nome}`} link="https://jobpago.com.br/expedicao" />
                  </div>
                  {p.ibge && <Link href={`/cidade/${p.ibge}`} className="text-xs font-bold text-amber-300 hover:underline shrink-0">{t("Relatório", "Informe", "Report")} →</Link>}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl p-6" aria-labelledby="rodovias">
            <h2 id="rodovias" className="text-xl font-black">{t("Rodovias do roteiro", "Rutas del recorrido", "Highways on the route")}</h2>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {rota.rodovias.map((r) => (
                  <tr key={r.rodovia} className="border-t border-white/5">
                    <td className="py-2 font-bold text-white">{r.rodovia}</td>
                    <td className="py-2 text-right tabular-nums">{nf.format(r.km)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="glass-panel rounded-3xl p-6" aria-labelledby="pedagios">
            <h2 id="pedagios" className="text-xl font-black">{t("Pedágios federais no caminho", "Peajes federales en el camino", "Federal tolls on the way")}</h2>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {rota.pedagios.map((p) => (
                  <tr key={p.nome + p.km_rota} className="border-t border-white/5">
                    <td className="py-2 text-slate-400 tabular-nums w-16">km {nf.format(p.km_rota)}</td>
                    <td className="py-2 font-bold text-white">{p.nome.trim()}</td>
                    <td className="py-2 text-right text-xs text-slate-400">{p.rodovia} · {p.concessionaria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-400">
              {t("Base da ANTT (só rodovias federais concedidas). Pedágios de rodovias estaduais — como a BA-099 — não entram nela; confira antes de sair. A ANTT não publica tarifa nessa base.",
                "Base de la ANTT (solo rutas federales concesionadas). Los peajes de rutas estaduales, como la BA-099, no figuran; revisalo antes de salir. La ANTT no publica tarifas en esta base.",
                "ANTT data (federal toll roads only). State highway tolls — such as the BA-099 — aren't included; check before you leave. ANTT doesn't publish prices in this dataset.")}
            </p>
          </div>
        </section>

        {rota.cidades.length > 0 && (
          <section className="mt-14" aria-labelledby="cidades">
            <h2 id="cidades" className="text-2xl sm:text-3xl font-black">{rota.cidades.length} {t("cidades no caminho", "ciudades en el camino", "towns on the way")}</h2>
            <p className="mt-2 text-slate-300">{t("Cada uma tem seu relatório: quem está abrindo negócio e quanto se paga para começar.", "Cada una tiene su informe: quién abre negocios y cuánto se paga al empezar.", "Each has its own report: who is opening businesses and what it pays to start.")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {rota.cidades.map((c) =>
                c.ibge ? (
                  <Link key={c.nome + c.uf} href={`/cidade/${c.ibge}`} className="btn-secondary-glass rounded-xl px-3 py-2 text-xs font-bold">
                    {c.nome} <span className="text-slate-400 font-normal">· {c.uf}</span>
                  </Link>
                ) : (
                  <span key={c.nome + c.uf} className="rounded-xl px-3 py-2 text-xs text-slate-400 border border-white/5">{c.nome} · {c.uf}</span>
                )
              )}
            </div>
          </section>
        )}

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-slate-400 space-y-1">
          <p>
            {t("Traçado: OSRM sobre OpenStreetMap. Acostamento e tipo de pista: OpenStreetMap (colaborativo, extrato Geofabrik). Pedágios: Agência Nacional de Transportes Terrestres. Gerado em",
              "Trazado: OSRM sobre OpenStreetMap. Banquina y tipo de ruta: OpenStreetMap (colaborativo, extracto Geofabrik). Peajes: Agencia Nacional de Transportes Terrestres. Generado el",
              "Route: OSRM on OpenStreetMap. Shoulder and carriageway: OpenStreetMap (crowdsourced, Geofabrik extract). Tolls: National Land Transport Agency. Generated")} {rota.gerado_em}.
          </p>
          <p><Link href="/refugio" className="underline hover:text-amber-400">{t("Tem onde dormir no caminho? Peça a visita e seja um Refúgio da Estrada →", "¿Tenés dónde dormir en el camino? Pedí la visita y sé un Refugio de la Ruta →", "Got a place to sleep on the way? Request a visit and become a Road Refuge →")}</Link></p>
          <p><Link href="/expedicoes" className="underline hover:text-amber-400">{t("Expedições de outros viajantes — e como criar a sua →", "Expediciones de otros viajeros, y cómo crear la tuya →", "Other travellers’ expeditions — and how to create yours →")}</Link></p>
        </footer>
      </main>
    </div>
  );
}
