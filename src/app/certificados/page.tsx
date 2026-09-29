import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import CertificadosLista from "@/components/CertificadosLista";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Refúgios da Estrada e estabelecimentos verificados · JobPago.com.br", "Refugios de la Ruta y establecimientos verificados · JobPago.com.br", "Road Refuges and verified places · JobPago.com.br"),
    description: L(i, "Refúgios da Estrada (camping, hostel, pousada, hotel) e postos visitados e verificados pessoalmente na Expedição JobPago Paraty → Fortaleza.", "Refugios de la Ruta (camping, hostel, posada, hotel) y estaciones visitadas y verificadas en persona en la Expedición JobPago Paraty → Fortaleza.", "Road Refuges (campsite, hostel, guesthouse, hotel) and gas stations visited and verified in person on the JobPago Expedition, Paraty → Fortaleza."),
    robots: { index: true, follow: true },
  };
}

export default async function CertificadosPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* HERO */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <Icon name="shield" width={30} height={30} /> {t("Selo Verificado", "Sello Verificado", "Verified Seal")}
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            {t("Refúgios da Estrada e lugares verificados", "Refugios de la Ruta y lugares verificados", "Road Refuges and verified places")}
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("Não é adesivo comprado. O selo diz que alguém da JobPago esteve no local, testou a estrutura de verdade — chuveiro, tomada, Wi-Fi, pátio — e anotou a data. Onde dormimos e recomendamos para passar a noite (camping, hostel, pousada, hotel) leva o nome de Refúgio da Estrada. Se a estrutura mudar, o selo cai. Cada pin âmbar no mapa da home é um lugar assim.",
              "No es un sticker comprado. El sello dice que alguien de JobPago estuvo en el lugar, probó la estructura de verdad (ducha, enchufe, Wi-Fi, patio) y anotó la fecha. Donde dormimos y recomendamos pasar la noche (camping, hostel, posada, hotel) se llama Refugio de la Ruta. Si la estructura cambia, el sello se cae. Cada pin ámbar en el mapa de la home es un lugar así.",
              "It’s not a sticker you can buy. The seal means someone from JobPago was there, actually tested the facilities — shower, power, Wi-Fi, yard — and noted the date. Places where we slept and recommend for the night (campsite, hostel, guesthouse, hotel) are called Road Refuges. If the facilities change, the seal comes off. Every amber pin on the home map is one of these places.")}
          </p>
        </div>

        {/* QR CODE ÚNICO */}
        <section className="mt-14 glass-panel border border-amber-400/25 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
          <img
            src="/qrcode-certificados.png"
            alt={t("QR Code para jobpago.com.br/certificados", "Código QR para jobpago.com.br/certificados", "QR code for jobpago.com.br/certificados")}
            width={160}
            height={160}
            className="rounded-2xl border-4 border-white shrink-0"
          />
          <div>
            <h2 className="text-lg font-black text-white">{t("O QR code do selo", "El código QR del sello", "The seal’s QR code")}</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
              {t("Um único QR code, o mesmo em todo adesivo físico entregue na estrada. Ele sempre aponta pra esta página — quem escaneia vê a lista completa de estabelecimentos certificados, então o mesmo adesivo serve pra qualquer parceiro sem precisar gerar um código por local.",
                "Un único código QR, el mismo en todos los stickers entregados en la ruta. Siempre apunta a esta página: quien lo escanea ve la lista completa de establecimientos certificados, así el mismo sticker sirve para cualquier socio.",
                "One single QR code, the same on every sticker handed out on the road. It always points to this page — whoever scans it sees the full list of certified places, so the same sticker works for any partner.")}
            </p>
            <a
              href="/qrcode-certificados.png"
              download
              className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer mt-4"
            >
              <Icon name="check" width={30} height={30} /> {t("Baixar PNG pra impressão", "Descargar PNG para imprimir", "Download PNG for printing")}
            </a>
          </div>
        </section>

        {/* LISTA DE CERTIFICADOS */}
        <CertificadosLista />
      </main>

      <RodapeSimples />
    </div>
  );
}
