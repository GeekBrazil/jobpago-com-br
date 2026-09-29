import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import CertificadosLista from "@/components/CertificadosLista";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";

export const metadata: Metadata = {
  title: "Refúgios da Estrada e estabelecimentos verificados · JobPago.com.br",
  description:
    "Refúgios da Estrada (camping, hostel, pousada, hotel) e postos visitados e verificados pessoalmente na Expedição JobPago Paraty → Fortaleza.",
  robots: { index: true, follow: true },
};

export default function CertificadosPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* HERO */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <Icon name="shield" width={30} height={30} /> Selo Verificado
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            Refúgios da Estrada e lugares verificados
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Não é adesivo comprado. O selo diz que alguém da JobPago esteve no
            local, testou a estrutura de verdade — chuveiro, tomada, Wi-Fi,
            pátio — e anotou a data. Onde dormimos e recomendamos para passar a
            noite (camping, hostel, pousada, hotel) leva o nome de Refúgio da Estrada. Se a estrutura mudar, o selo cai. Cada
            pin âmbar no mapa da home é um lugar assim.
          </p>
        </div>

        {/* QR CODE ÚNICO */}
        <section className="mt-14 glass-panel border border-amber-400/25 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
          <img
            src="/qrcode-certificados.png"
            alt="QR Code para jobpago.com.br/certificados"
            width={160}
            height={160}
            className="rounded-2xl border-4 border-white shrink-0"
          />
          <div>
            <h2 className="text-lg font-black text-white">O QR code do selo</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-lg">
              Um único QR code, o mesmo em todo adesivo físico entregue na
              estrada. Ele sempre aponta pra esta página — quem escaneia vê a
              lista completa de estabelecimentos certificados, não uma vaga
              individual, então o mesmo adesivo serve pra qualquer parceiro
              sem precisar gerar um código por local.
            </p>
            <a
              href="/qrcode-certificados.png"
              download
              className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer mt-4"
            >
              <Icon name="check" width={30} height={30} /> Baixar PNG pra impressão
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
