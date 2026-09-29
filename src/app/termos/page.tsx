// RASCUNHO - REVISAR COM ADVOGADO ANTES DE PUBLICAR
// Este documento representa uma minuta preliminar da estrutura de Termos de Uso
// para plataforma de marketplace passivo (sem custódia financeira).

import Link from "next/link";
import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Termos de Uso", "Términos de Uso", "Terms of Use") + " · JobPago.com.br",
    description: L(i, "Termos de uso e diretrizes operacionais da plataforma JobPago.com.br — Marketplace Passivo.", "Términos de uso de la plataforma JobPago.com.br, marketplace pasivo.", "Terms of use of the JobPago.com.br platform — passive marketplace."),
    robots: { index: true, follow: true },
  };
}

export default async function TermosPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-white/10">
        <Link href="/" className="text-xs font-black text-cyan-400 hover:underline uppercase tracking-widest block mb-6">
          ← {t("Voltar para o JobPago", "Volver a JobPago", "Back to JobPago")}
        </Link>

        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
          <strong>{t("Aviso de Minuta Preliminar:", "Aviso de borrador preliminar:", "Preliminary draft notice:")}</strong>{" "}
          {t("Este documento é uma minuta preliminar em revisão jurídica e ainda não constitui a versão final dos Termos de Uso do JobPago.", "Este documento es un borrador en revisión jurídica y todavía no es la versión final de los Términos de Uso de JobPago.", "This document is a preliminary draft under legal review and is not yet the final version of JobPago's Terms of Use.")}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6">{t("Termos de Uso", "Términos de Uso", "Terms of Use")}</h1>
        <p className="text-xs text-slate-400 mb-8">{t("Última atualização: Agosto de 2026", "Última actualización: agosto de 2026", "Last updated: August 2026")}</p>
        {i !== "pt" && (
          <p className="mb-6 text-xs text-slate-400">
            {t("", "Traducción para facilitar la lectura. En caso de diferencia, vale la versión en portugués.", "Translation provided for convenience. If there is any difference, the Portuguese version prevails.")}
          </p>
        )}

        {i === "pt" ? (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Natureza do Serviço (Marketplace Passivo)</h2>
              <p>
                O <strong>JobPago.com.br</strong> atua exclusivamente como plataforma de conexão (marketplace passivo) entre contratantes e prestadores de serviços, nômades digitais e viajantes. A plataforma <strong>não é parte</strong> de nenhum contrato de prestação de serviços celebrado entre os usuários.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Ausência de Intermediação e Custódia Financeira</h2>
              <p>
                O JobPago <strong>não processa, não retém, não custodia e não garante pagamentos</strong>. Todo e qualquer valor (via PIX, Bitcoin, transferência bancária ou espécie) é negociado, ajustado e transferido <strong>direta e exclusivamente entre contratante e prestador</strong>, sem incidência de taxas de intermediação da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Responsabilidade das Partes</h2>
              <p>
                A negociação de escopo, prazos, preços, qualidade, execução e pagamento dos serviços é de responsabilidade estrita e exclusiva dos usuários envolvidos. O JobPago não se responsabiliza por eventuais inadimplementos, atrasos ou controvérsias comerciais.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Identificação do Responsável</h2>
              <p>
                Plataforma mantida e operada por <strong>Allan Candido</strong> (allan@jobpago.com.br).
              </p>
            </section>
          </div>
        ) : i === "es" ? (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Naturaleza del servicio (marketplace pasivo)</h2>
              <p><strong>JobPago.com.br</strong> actúa exclusivamente como plataforma de conexión (marketplace pasivo) entre contratantes y prestadores de servicios, nómades digitales y viajeros. La plataforma <strong>no es parte</strong> de ningún contrato de servicios celebrado entre los usuarios.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Sin intermediación ni custodia financiera</h2>
              <p>JobPago <strong>no procesa, no retiene, no custodia y no garantiza pagos</strong>. Todo valor (PIX, Bitcoin, transferencia o efectivo) se negocia y transfiere <strong>directa y exclusivamente entre contratante y prestador</strong>, sin tarifas de intermediación de la plataforma.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Responsabilidad de las partes</h2>
              <p>El alcance, plazos, precios, calidad, ejecución y pago de los servicios son responsabilidad exclusiva de los usuarios involucrados. JobPago no responde por incumplimientos, atrasos o disputas comerciales.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Responsable</h2>
              <p>Plataforma mantenida y operada por <strong>Allan Candido</strong> (allan@jobpago.com.br).</p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Nature of the service (passive marketplace)</h2>
              <p><strong>JobPago.com.br</strong> acts solely as a connection platform (passive marketplace) between clients and service providers, digital nomads and travellers. The platform <strong>is not a party</strong> to any service contract between users.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. No intermediation or custody of funds</h2>
              <p>JobPago <strong>does not process, hold, keep in custody or guarantee payments</strong>. Any amount (PIX, Bitcoin, bank transfer or cash) is negotiated and transferred <strong>directly and exclusively between client and provider</strong>, with no platform intermediation fees.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Responsibility of the parties</h2>
              <p>Scope, deadlines, prices, quality, delivery and payment are the sole responsibility of the users involved. JobPago is not liable for defaults, delays or commercial disputes.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Operator</h2>
              <p>Platform maintained and operated by <strong>Allan Candido</strong> (allan@jobpago.com.br).</p>
            </section>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-500 text-center">
          © {new Date().getFullYear()} JobPago.com.br · {t("Todos os direitos reservados.", "Todos los derechos reservados.", "All rights reserved.")}
        </div>
      </div>
    </div>
  );
}
