import type { Metadata } from "next";
import Link from "next/link";
import CidadeTopo from "../cidade/CidadeTopo";
import MapaRotaCliente from "./MapaRotaCliente";
import Compartilhar from "@/components/Compartilhar";
import rota from "@/data/expedicao-rota.json";

export const metadata: Metadata = {
  title: "Expedição JobPago nº 01 — travessia de reconhecimento, Paraty → Fortaleza",
  description:
    "O roteiro da Expedição JobPago: 15 paradas, rodovias, praças de pedágio (ANTT) e onde há acostamento informado — pensado para quem vai de carro, de carona ou a pé.",
  alternates: { canonical: "https://jobpago.com.br/expedicao" },
};

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
type Cls = "s" | "n" | "?";

export default function ExpedicaoPage() {
  const ak = rota.acostamento_km as Record<Cls, number>;
  const pk = rota.pista_km as Record<"d" | "s" | "?", number>;
  const totalAk = ak.s + ak.n + ak["?"];

  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Expedição JobPago</p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">Paraty → Fortaleza, pelo litoral</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          {nf.format(rota.km_total)} km, {rota.paradas.length} paradas, visitando os negócios da estrada que pedem o selo de verificado.
          O roteiro abaixo mostra rodovias, pedágios e onde há acostamento — para quem vai de carro, de carona ou a pé.
        </p>

        <section className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4" aria-label="Resumo do roteiro">
          {[
            [nf.format(rota.km_total) + " km", "de Paraty a Fortaleza"],
            [`${nf.format(rota.horas_carro)} h`, "de carro, sem paradas"],
            [String(rota.pedagios.length), "praças de pedágio federais"],
            [`${nf.format(rota.rodovias[0]?.km ?? 0)} km`, `pela ${rota.rodovias[0]?.rodovia ?? "BR-101"}`],
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
              <h2 id="mapa" className="text-2xl sm:text-3xl font-black tracking-tight">Travessia de reconhecimento</h2>
              <p className="mt-1 text-sm text-slate-400">A primeira viagem abre o caminho: visitar, verificar e mapear cada ponto de apoio antes de convidar a estrada inteira.</p>
            </div>
          </div>
          <MapaRotaCliente
            geometria={rota.geometria as [number, number][]}
            acostamento={rota.acostamento}
            pista={rota.pista}
            pedagios={rota.pedagios}
            paradas={rota.paradas}
          />
          <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-300">
            <span><span className="inline-block w-6 h-1.5 rounded bg-blue-400 align-middle mr-2" />pista duplicada ({nf.format(pk.d)} km)</span>
            <span><span className="inline-block w-6 h-1 rounded bg-orange-400 align-middle mr-2" />pista simples ({nf.format(pk.s)} km)</span>
            <span><span className="inline-block w-6 h-2.5 rounded bg-emerald-400 align-middle mr-2" />acostamento confirmado ({nf.format(ak.s)} km)</span>
            <span><span className="inline-block w-6 h-2.5 rounded bg-red-400 align-middle mr-2" />sem acostamento ({nf.format(ak.n)} km)</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-amber-400 align-middle mr-2" />pedágio</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-slate-50 align-middle mr-2" />parada</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">No celular, a página rola normalmente; para aproximar o mapa, use dois dedos.</p>
        </section>

        {/* CARONA E A PÉ */}
        <section className="mt-14 glass-panel rounded-3xl p-6 sm:p-8" aria-labelledby="a-pe">
          <h2 id="a-pe" className="text-2xl sm:text-3xl font-black">De carona ou a pé: o que conferir</h2>
          <ul className="mt-5 space-y-3 text-slate-300">
            <li>
              <strong className="text-white">Acostamento:</strong> só {nf.format(ak.s + ak.n)} dos {nf.format(totalAk)} km têm acostamento
              registrado no OpenStreetMap ({nf.format(ak.s)} km com, {nf.format(ak.n)} km sem). No resto, o mapa mostra se a pista é duplicada
              ou simples — pista simples costuma ter acostamento estreito ou nenhum. Confira no local antes de andar.
            </li>
            <li>
              <strong className="text-white">A pé na rodovia:</strong> pelo Código de Trânsito (art. 68, § 3º), onde não há acostamento
              o pedestre anda pela borda da pista, em fila única, no sentido contrário ao dos veículos.
            </li>
            <li>
              <strong className="text-white">Pontos de carona:</strong> postos de combustível e praças de pedágio com cabine. As praças
              <em> free flow</em> da Rio-Santos (Paraty, Mangaratiba, Itaguaí) não têm cabine nem parada.
            </li>
            <li>
              <strong className="text-white">Emergência na rodovia federal:</strong> PRF 191. Nas concessionárias, o número fica nas placas e no site de cada uma.
            </li>
          </ul>
        </section>

        {/* TRECHOS */}
        <section className="mt-14" aria-labelledby="trechos">
          <h2 id="trechos" className="text-2xl sm:text-3xl font-black">As {rota.paradas.length} paradas</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {rota.paradas.map((p, i) => {
              const leg = i > 0 ? rota.legs[i - 1] : null;
              return (
                <li key={p.nome} className="glass-panel rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white"><span className="text-amber-400 font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>{p.nome} · {p.uf}</p>
                    {leg && <p className="text-xs text-slate-400 mt-1">{nf.format(leg.km)} km desde a parada anterior · {String(leg.horas).replace(".", ",")} h de carro</p>}
                    <Compartilhar compacto card={`/card/expedicao/${i + 1}`} titulo={`Expedição JobPago · parada ${i + 1}: ${p.nome}`} link="https://jobpago.com.br/expedicao" />
                  </div>
                  {p.ibge && <Link href={`/cidade/${p.ibge}`} className="text-xs font-bold text-amber-300 hover:underline shrink-0">Relatório →</Link>}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl p-6" aria-labelledby="rodovias">
            <h2 id="rodovias" className="text-xl font-black">Rodovias do roteiro</h2>
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
            <h2 id="pedagios" className="text-xl font-black">Pedágios federais no caminho</h2>
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
              Base da ANTT (só rodovias federais concedidas). Pedágios de rodovias estaduais — como a BA-099 — não entram nela; confira antes de sair. A ANTT não publica tarifa nessa base.
            </p>
          </div>
        </section>

        {rota.cidades.length > 0 && (
          <section className="mt-14" aria-labelledby="cidades">
            <h2 id="cidades" className="text-2xl sm:text-3xl font-black">{rota.cidades.length} cidades no caminho</h2>
            <p className="mt-2 text-slate-300">Cada uma tem seu relatório: quem está abrindo negócio e quanto se paga para começar.</p>
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
            Traçado: OSRM sobre OpenStreetMap. Acostamento e tipo de pista: OpenStreetMap (colaborativo, extrato Geofabrik).
            Pedágios: Agência Nacional de Transportes Terrestres. Gerado em {rota.gerado_em}.
          </p>
          <p><Link href="/refugio" className="underline hover:text-amber-400">Tem onde dormir no caminho? Peça a visita e seja um Refúgio da Estrada →</Link></p>
        </footer>
      </main>
    </div>
  );
}
