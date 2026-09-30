// RASCUNHO - REVISAR COM ADVOGADO ANTES DE PUBLICAR
// Minuta dos Termos de Uso: marketplace passivo entre usuários + serviços próprios
// da JobPago (planos de parceiro), patrocínio de expedições com repasse e indicação.

import Link from "next/link";
import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import { REGRAS } from "@/lib/indicacao";
import { REPASSE } from "@/lib/expedicoes";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Termos de Uso", "Términos de Uso", "Terms of Use") + " · JobPago.com.br",
    description: L(i, "Termos de uso da JobPago: tarefas entre usuários, planos de parceiro, patrocínio de expedições e programa de indicação.", "Términos de uso de JobPago: tareas entre usuarios, planes de socio, patrocinio de expediciones y programa de recomendación.", "JobPago terms of use: tasks between users, partner plans, expedition sponsorship and referral programme."),
    robots: { index: true, follow: true },
  };
}

type Secao = { titulo: string; texto: React.ReactNode };

// TODO: revisão por advogado (minuta; seções 7 a 11 incluídas em 29/09/2026 sem revisão jurídica).
export default async function TermosPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const repasse = Math.round(REPASSE * 100), taxa = 100 - repasse;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const b = (x: string) => <strong className="text-white">{x}</strong>;

  const secoes: Secao[] = [
    {
      titulo: t("1. O que é a JobPago", "1. Qué es JobPago", "1. What JobPago is"),
      texto: <>{t(
        "A JobPago.com.br é uma plataforma que conecta negócios, prestadores de serviço, nômades digitais e viajantes. Ela tem duas frentes, tratadas de forma diferente nestes termos: (a) a conexão entre usuários para tarefas e serviços — em que a JobPago não é parte do acordo nem do pagamento; e (b) serviços da própria JobPago — planos de parceiro, patrocínio de expedições e programa de indicação — em que a JobPago é parte e recebe pagamento.",
        "JobPago.com.br es una plataforma que conecta negocios, prestadores de servicios, nómades digitales y viajeros. Tiene dos frentes, tratados de forma distinta en estos términos: (a) la conexión entre usuarios para tareas y servicios, donde JobPago no es parte del acuerdo ni del pago; y (b) los servicios propios de JobPago (planes de socio, patrocinio de expediciones y programa de recomendación), donde JobPago es parte y recibe pagos.",
        "JobPago.com.br is a platform connecting businesses, service providers, digital nomads and travellers. It has two sides, treated differently in these terms: (a) connecting users for tasks and services — where JobPago is not a party to the agreement or the payment; and (b) JobPago's own services — partner plans, expedition sponsorship and the referral programme — where JobPago is a party and receives payment.")}</>,
    },
    {
      titulo: t("2. Tarefas e serviços entre usuários", "2. Tareas y servicios entre usuarios", "2. Tasks and services between users"),
      texto: <>{t("Nas tarefas e serviços combinados entre usuários, a JobPago", "En las tareas y servicios acordados entre usuarios, JobPago", "For tasks and services agreed between users, JobPago")} {b(t("não processa, não retém, não custodia e não garante pagamentos", "no procesa, no retiene, no custodia y no garantiza pagos", "does not process, hold, keep in custody or guarantee payments"))}. {t(
        "O valor é negociado e pago direto entre contratante e prestador (Pix, transferência ou outro meio), sem comissão da plataforma. Escopo, prazo, preço, qualidade, execução e pagamento são responsabilidade exclusiva das partes; a JobPago não responde por inadimplência, atraso ou disputa entre elas.",
        "El valor se negocia y se paga directo entre contratante y prestador (Pix, transferencia u otro medio), sin comisión de la plataforma. Alcance, plazo, precio, calidad, ejecución y pago son responsabilidad exclusiva de las partes; JobPago no responde por incumplimientos, atrasos o disputas entre ellas.",
        "The price is negotiated and paid directly between client and provider (Pix, transfer or other means), with no platform commission. Scope, deadline, price, quality, delivery and payment are the sole responsibility of the parties; JobPago is not liable for defaults, delays or disputes between them.")}</>,
    },
    {
      titulo: t("3. Planos de parceiro (serviço da JobPago)", "3. Planes de socio (servicio de JobPago)", "3. Partner plans (a JobPago service)"),
      texto: <>{t(
        "Os planos de parceiro (Permuta, Parceiro Local, Patrocínio Regional e Master) são serviços de divulgação prestados pela própria JobPago ao estabelecimento. Valor, forma de pagamento e entregas são combinados por escrito (WhatsApp ou e-mail) antes do pagamento, que é feito à JobPago.",
        "Los planes de socio (Canje, Socio Local, Patrocinio Regional y Master) son servicios de difusión prestados por JobPago al establecimiento. Valor, forma de pago y entregas se acuerdan por escrito (WhatsApp o e-mail) antes del pago, que se hace a JobPago.",
        "Partner plans (Exchange, Local Partner, Regional Sponsorship and Master) are promotion services provided by JobPago itself to the business. Price, payment method and deliverables are agreed in writing (WhatsApp or e-mail) before payment, which is made to JobPago.")}{" "}
        {b(t("O registro de visita", "El registro de visita", "The visit record"))}{" "}
        {t("informa o que foi encontrado na data indicada e não constitui certificação, recomendação ou garantia de segurança, qualidade ou disponibilidade. Parceiros pagantes são identificados como tal.", "informa lo que se encontró en la fecha indicada y no constituye certificación, recomendación ni garantía de seguridad, calidad o disponibilidad. Los socios que pagan se identifican como tales.", "states what was found on the date shown and is not a certification, recommendation or guarantee of safety, quality or availability. Paying partners are identified as such.")}</>,
    },
    {
      titulo: t("4. Patrocínio de expedições de viajantes", "4. Patrocinio de expediciones de viajeros", "4. Sponsorship of traveller expeditions"),
      texto: <>{t(
        "Quando uma empresa patrocina a expedição de um viajante publicada na JobPago, o pagamento é feito à JobPago, que atua como intermediária:",
        "Cuando una empresa patrocina la expedición de un viajero publicada en JobPago, el pago se hace a JobPago, que actúa como intermediaria:",
        "When a company sponsors a traveller's expedition published on JobPago, payment is made to JobPago, acting as intermediary:")}{" "}
        {b(t(`${repasse}% do valor é repassado ao viajante e ${taxa}% fica com a JobPago`, `el ${repasse}% del valor se transfiere al viajero y el ${taxa}% queda para JobPago`, `${repasse}% of the amount is passed on to the traveller and ${taxa}% is kept by JobPago`))}{" "}
        {t(
          "como remuneração pela prospecção, negociação e acompanhamento. O repasse é feito depois da confirmação do recebimento, na forma cadastrada pelo viajante. Valor, contrapartidas (menção, vídeo, logo, visita), prazos e o que acontece se a expedição for interrompida ficam em contrato simples assinado antes do pagamento. A JobPago não garante audiência, alcance ou a realização completa da viagem, e nunca publica a posição atual do viajante.",
          "como remuneración por la búsqueda, negociación y seguimiento. La transferencia se hace después de confirmar la recepción, en la forma registrada por el viajero. Valor, contrapartidas (mención, video, logo, visita), plazos y qué ocurre si la expedición se interrumpe quedan en un contrato simple firmado antes del pago. JobPago no garantiza audiencia, alcance ni la realización completa del viaje, y nunca publica la posición actual del viajero.",
          "as payment for finding, negotiating and following up the deal. The transfer is made after receipt is confirmed, using the payout method registered by the traveller. Amount, benefits (mention, video, logo, visit), deadlines and what happens if the expedition is interrupted are set in a simple contract signed before payment. JobPago does not guarantee audience, reach or completion of the trip, and never publishes the traveller's current position.")}</>,
    },
    {
      titulo: t("5. Programa de indicação", "5. Programa de recomendación", "5. Referral programme"),
      texto: <>{t(
        `Quem indica um estabelecimento pelo próprio link recebe comissão sobre planos de parceiro da JobPago: ${pct(REGRAS.mensal)} da primeira mensalidade, ou ${pct(REGRAS.anual)} do plano anual ou do pagamento único. Vale o primeiro link aberto pelo estabelecimento, por ${REGRAS.janelaDias} dias. A comissão é liberada ${REGRAS.carenciaDias} dias depois do pagamento do estabelecimento (prazo de reembolso ou estorno) e paga por Pix, Wise ou PayPal a partir de R$ ${REGRAS.minimoPagamento}. Não há comissão sobre planos de outros sites nem sobre tarefas entre usuários.`,
        `Quien recomienda un establecimiento con su propio enlace recibe comisión sobre los planes de socio de JobPago: ${pct(REGRAS.mensal)} de la primera mensualidad, o ${pct(REGRAS.anual)} del plan anual o del pago único. Vale el primer enlace abierto por el establecimiento, por ${REGRAS.janelaDias} días. La comisión se libera ${REGRAS.carenciaDias} días después del pago del establecimiento (plazo de reembolso o contracargo) y se paga por Pix, Wise o PayPal a partir de R$ ${REGRAS.minimoPagamento}. No hay comisión sobre planes de otros sitios ni sobre tareas entre usuarios.`,
        `People who refer a business with their own link earn commission on JobPago partner plans: ${pct(REGRAS.mensal)} of the first monthly fee, or ${pct(REGRAS.anual)} of an annual plan or one-off payment. The first link the business opened counts, for ${REGRAS.janelaDias} days. Commission is released ${REGRAS.carenciaDias} days after the business pays (refund/chargeback window) and paid via Pix, Wise or PayPal from R$ ${REGRAS.minimoPagamento}. No commission on other sites' plans or on tasks between users.`)}</>,
    },
    {
      titulo: t("6. Tributos", "6. Impuestos", "6. Taxes"),
      texto: <>{t(
        "Cada parte responde pelos próprios tributos. Nos repasses de patrocínio e nas comissões, a JobPago pode pedir os dados necessários para o recibo ou nota e reter o que a lei exigir.",
        "Cada parte responde por sus propios impuestos. En las transferencias de patrocinio y en las comisiones, JobPago puede pedir los datos necesarios para el recibo o factura y retener lo que exija la ley.",
        "Each party is responsible for its own taxes. For sponsorship transfers and commissions, JobPago may request the details needed for a receipt or invoice and withhold what the law requires.")}</>,
    },
    {
      titulo: t("7. Quem pode usar", "7. Quién puede usar", "7. Who can use it"),
      texto: <>{t(
        "A JobPago é destinada a maiores de 18 anos. Ao se cadastrar, o usuário declara ter 18 anos ou mais.",
        "JobPago está destinada a mayores de 18 años. Al registrarse, el usuario declara tener 18 años o más.",
        "JobPago is intended for people aged 18 or over. By signing up, users declare they are 18 or older.")}</>,
    },
    {
      titulo: t("8. Serviços proibidos", "8. Servicios prohibidos", "8. Prohibited services"),
      texto: <>{t(
        "É proibido anunciar, oferecer ou procurar: serviços de natureza sexual ou de acompanhante; conteúdo adulto; qualquer atividade envolvendo menores de 18 anos; transporte remunerado de pessoas sem autorização legal; e qualquer atividade ilegal. Anúncios assim são removidos e a conta é encerrada. Suspeita de exploração sexual de crianças e adolescentes é comunicada às autoridades.",
        "Está prohibido anunciar, ofrecer o buscar: servicios de naturaleza sexual o de acompañante; contenido adulto; cualquier actividad que involucre a menores de 18 años; transporte remunerado de personas sin autorización legal; y cualquier actividad ilegal. Esos anuncios se eliminan y la cuenta se cierra. La sospecha de explotación sexual de niños, niñas y adolescentes se comunica a las autoridades.",
        "It is forbidden to advertise, offer or seek: sexual or escort services; adult content; any activity involving people under 18; paid passenger transport without legal authorisation; and any illegal activity. Such listings are removed and the account is closed. Suspected sexual exploitation of children and adolescents is reported to the authorities.")}</>,
    },
    {
      titulo: t("9. Licenças do prestador", "9. Licencias del prestador", "9. Provider licences"),
      texto: <>{t(
        "Cada prestador é responsável por ter as licenças e registros exigidos pela sua atividade, como o RNTRC da ANTT para frete remunerado de cargas e o cadastro do drone no SISANT (ANAC) e as autorizações de voo no SARPAS (DECEA).",
        "Cada prestador es responsable de tener las licencias y registros exigidos por su actividad, como el RNTRC de la ANTT para el flete remunerado de cargas y el registro del dron en el SISANT (ANAC) y las autorizaciones de vuelo en el SARPAS (DECEA).",
        "Each provider is responsible for holding the licences and registrations their activity requires, such as the ANTT RNTRC for paid freight, and drone registration in SISANT (ANAC) plus flight authorisations in SARPAS (DECEA).")}</>,
    },
    {
      titulo: t("10. Localização", "10. Ubicación", "10. Location"),
      texto: <>{t(
        "A JobPago não exibe a localização em tempo real de usuários. Prestadores aparecem no máximo com a cidade.",
        "JobPago no muestra la ubicación en tiempo real de los usuarios. Los prestadores aparecen como máximo con la ciudad.",
        "JobPago does not show users' real-time location. Providers are shown at most by town.")}</>,
    },
    {
      titulo: t("11. Denúncias", "11. Denuncias", "11. Reports"),
      texto: <>{t(
        "Para denunciar um anúncio, um usuário ou um lugar, escreva para jobpago@allancandido.com com o link ou o nome e a cidade. A denúncia é analisada em até 5 dias úteis; conteúdo que envolva menores é retirado assim que recebido. Exploração sexual de criança ou adolescente também pode ser denunciada no Disque 100 (gratuito, 24 horas).",
        "Para denunciar un anuncio, un usuario o un lugar, escribí a jobpago@allancandido.com con el enlace o el nombre y la ciudad. La denuncia se analiza en hasta 5 días hábiles; el contenido que involucre a menores se retira apenas se recibe. La explotación sexual de niños, niñas y adolescentes en Brasil también se puede denunciar al Disque 100 (gratuito, 24 horas).",
        "To report a listing, a user or a place, write to jobpago@allancandido.com with the link or the name and town. Reports are reviewed within 5 business days; content involving minors is taken down as soon as it is received. Child sexual exploitation in Brazil can also be reported to Disque 100 (free, 24 hours).")}</>,
    },
    {
      titulo: t("12. Responsável", "12. Responsable", "12. Operator"),
      texto: <>{t("Plataforma mantida e operada por", "Plataforma mantenida y operada por", "Platform maintained and operated by")} {b("Allan Candido")} — 62.685.514 ALLAN CANDIDO · CNPJ 62.685.514/0001-85 · Rua Leontino Antonio de Souza, 85, Água Santa, Angra dos Reis/RJ, CEP 23915-505 (jobpago@allancandido.com)</>,
    },
  ];

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
        <p className="text-xs text-slate-400 mb-8">{t("Última atualização: 29 de setembro de 2026", "Última actualización: 29 de septiembre de 2026", "Last updated: 29 September 2026")}</p>
        {i !== "pt" && (
          <p className="mb-6 text-xs text-slate-400">
            {t("", "Traducción para facilitar la lectura. En caso de diferencia, vale la versión en portugués.", "Translation provided for convenience. If there is any difference, the Portuguese version prevails.")}
          </p>
        )}

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          {secoes.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-lg font-bold text-white mb-2">{s.titulo}</h2>
              <p>{s.texto}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-500 text-center">
          © {new Date().getFullYear()} JobPago.com.br · {t("Todos os direitos reservados.", "Todos los derechos reservados.", "All rights reserved.")}
        </div>
      </div>
    </div>
  );
}
