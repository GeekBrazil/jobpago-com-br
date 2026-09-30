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
    title: L(i, "Lugares visitados · JobPago · renda na viagem", "Lugares visitados · JobPago · ingresos en el viaje", "Visited places · JobPago · income on the go"),
    description: L(i, "Camping, hostel, pousada, hotel e postos por onde a Expedição JobPago Paraty → Fortaleza passou, com a data e o que havia no dia da visita.", "Camping, hostel, posada, hotel y estaciones por donde pasó la Expedición JobPago Paraty → Fortaleza, con la fecha y lo que había el día de la visita.", "Campsites, hostels, guesthouses, hotels and gas stations the JobPago Expedition, Paraty → Fortaleza, passed through, with the date and what was there on the day."),
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
            <Icon name="shield" width={30} height={30} /> {t("Registro de visita", "Registro de visita", "Visit record")}
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            {t("Lugares visitados", "Lugares visitados", "Visited places")}
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("Alguém da expedição esteve ali e anotou o que havia — chuveiro, tomada, Wi-Fi, pátio — com data. Wi-Fi entra com a velocidade medida naquele dia. É um registro, não uma garantia: confira sempre com o estabelecimento. Lugares para passar a noite (camping, hostel, pousada, hotel) aparecem como Lugar para dormir. O registro de visita não é vendido; parceiros pagantes aparecem sempre identificados como Parceiro. Cada pin âmbar no mapa da home é um lugar assim.",
              "Alguien de la expedición estuvo ahí y anotó lo que había (ducha, enchufe, Wi-Fi, patio), con fecha. El Wi-Fi entra con la velocidad medida ese día. Es un registro, no una garantía: consultá siempre con el establecimiento. Los lugares para pasar la noche (camping, hostel, posada, hotel) aparecen como Lugar para dormir. El registro de visita no se vende; los socios que pagan aparecen siempre identificados como Socio. Cada pin ámbar en el mapa de la home es un lugar así.",
              "Someone from the expedition was there and noted what they found — shower, power, Wi-Fi, yard — with the date. Wi-Fi is listed with the speed measured that day. It's a record, not a guarantee: always check with the business. Places to spend the night (campsite, hostel, guesthouse, hotel) are listed as Places to sleep. The visit record isn't sold; paying partners are always labeled as Partner. Every amber pin on the home map is one of these places.")}
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
            <h2 className="text-lg font-black text-white">{t("O QR code do adesivo", "El código QR del sticker", "The sticker’s QR code")}</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
              {t("Um único QR code, o mesmo em todo adesivo físico entregue na rota. Ele sempre aponta pra esta página — quem escaneia vê a lista completa de lugares visitados, então o mesmo adesivo serve pra qualquer parceiro sem precisar gerar um código por local.",
                "Un único código QR, el mismo en todos los stickers entregados en la ruta. Siempre apunta a esta página: quien lo escanea ve la lista completa de lugares visitados, así el mismo sticker sirve para cualquier socio.",
                "One single QR code, the same on every sticker handed out along the route. It always points to this page — whoever scans it sees the full list of visited places, so the same sticker works for any partner.")}
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
