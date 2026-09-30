// RASCUNHO - REVISAR COM ADVOGADO ANTES DE PUBLICAR
// Este documento representa uma minuta preliminar da Política de Privacidade
// para plataforma de marketplace passivo em conformidade com as diretrizes gerais da LGPD.

import Link from "next/link";
import type { Metadata } from "next";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Política de Privacidade", "Política de Privacidad", "Privacy Policy") + " · JobPago.com.br",
    description: L(i, "Política de Privacidade e tratamento de dados pessoais no JobPago.com.br.", "Política de privacidad y tratamiento de datos personales en JobPago.com.br.", "Privacy policy and personal data processing at JobPago.com.br."),
    robots: { index: true, follow: true },
  };
}

export default async function PrivacidadePage() {
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
          {t("Este documento é uma minuta preliminar em revisão jurídica e ainda não constitui a versão final da Política de Privacidade do JobPago.", "Este documento es un borrador en revisión jurídica y todavía no es la versión final de la Política de Privacidad de JobPago.", "This document is a preliminary draft under legal review and is not yet the final version of JobPago's Privacy Policy.")}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6">{t("Política de Privacidade", "Política de Privacidad", "Privacy Policy")}</h1>
        <p className="text-xs text-slate-400 mb-8">{t("Última atualização: 29 de setembro de 2026", "Última actualización: 29 de septiembre de 2026", "Last updated: 29 September 2026")}</p>
        {i !== "pt" && (
          <p className="mb-6 text-xs text-slate-400">
            {t("", "Traducción para facilitar la lectura. En caso de diferencia, vale la versión en portugués.", "Translation provided for convenience. If there is any difference, the Portuguese version prevails.")}
          </p>
        )}

        {i === "pt" ? (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Identificação do Controlador</h2>
              <p>
                O controlador dos dados pessoais coletados nesta plataforma é <strong>Allan Candido</strong>, com contato pelo e-mail <strong>allan@jobpago.com.br</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Dados Coletados e Finalidade</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Cadastro de serviço</strong> (quem busca renda): nome, WhatsApp, e-mail opcional, cidade e UF (ou &quot;viajando&quot;), áreas de atuação, modo e horário. Finalidade: chamar a pessoa quando um negócio publicar tarefa compatível. Não é exibido publicamente.</li>
                <li><strong>Candidatura a Pouso visitado</strong> (camping, hostel, pousada, hotel, pátio): nome e tipo do lugar, cidade, o que oferece, preço da noite, forma de apoio à expedição, nome do responsável, WhatsApp, e-mail e site opcionais. Finalidade: combinar a visita. Só nome, tipo, cidade, estrutura, preço e nível de Honra dos lugares <em>verificados</em> ficam públicos.</li>
                <li><strong>Cadastro de tarefa ou serviço</strong>: nome, WhatsApp, e-mail e descrição. Finalidade: encaminhar o pedido pelo WhatsApp a quem combina com ele.</li>
                <li><strong>Botão de WhatsApp</strong>: antes de abrir a conversa, a pessoa escolhe o assunto (ex.: &quot;Sou negócio&quot;, &quot;Quero renda&quot;) e pode informar o nome. Finalidade: direcionar o atendimento.</li>
                <li><strong>Navegação</strong>: páginas vistas, tempo na página, rolagem, cliques e de onde veio a visita (ex.: Instagram, Google). Sem cookie e sem guardar o endereço IP; o navegador recebe um identificador aleatório. Finalidade: medir e melhorar o site.</li>
                <li><strong>Contato com empresas</strong>: usamos dados públicos do cadastro de CNPJ da Receita Federal (nome da empresa, cidade, setor, data de abertura e e-mail cadastrado) para convidar empresas ativas a usar a JobPago, com base no legítimo interesse (art. 7º, IX, da LGPD). Não enviamos a empresário individual nem MEI, limitamos a dois contatos por empresa e todo e-mail tem descadastro em um clique, respeitado para sempre.</li>
                <li><strong>Programa de indicação</strong>: para quem gera o link, guardamos o código, a forma de receber (chave Pix ou e-mail do Wise/PayPal) e o país; contamos quantas vezes o link foi aberto (sem identificar quem abriu). No navegador de quem abre o link, o código fica guardado por 60 dias para ligar um eventual fechamento a quem indicou. Finalidade: calcular e pagar a comissão.</li>
                <li><strong>Expedição do viajante</strong>: nome, tema, origem, destino, paradas planejadas, mês de saída, modo e veículo, redes sociais com seguidores informados, diário e a forma de receber o patrocínio. Ficam públicos, depois da aprovação, o nome e tema, o trajeto, o modo, as redes e o diário — <strong>nunca a posição atual</strong>: não publicamos datas exatas, o diário só aparece 24 horas depois de escrito e o roteiro planejado pode ser escondido. A forma de receber nunca é pública.</li>
                <li><strong>Proposta de patrocínio</strong>: empresa, contato, e-mail, valor e contrapartida pretendidos. Finalidade: negociar o patrocínio, que passa pela JobPago com repasse de 85% ao viajante.</li>
                <li><strong>Contribuições do viajante</strong> (conta JobPago): foto de fachada, relato de pernoite, teste de internet, preço de combustível, condição da estrada, indicação de lugar e o questionário do viajante. Para confirmar que a contribuição é do lugar, pedimos a <strong>localização do celular no momento do envio</strong> — só com o seu consentimento, avisado na tela. Fotos só aparecem no mapa depois de revisadas, sem rosto nem placa identificável. O questionário não é público. Finalidade: manter a informação da rota verdadeira e calcular a sua reputação (nível e pontos), que fica guardada na sua conta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Compartilhamento e Ausência de Dados Bancários</h2>
              <p>
                Como o JobPago é um marketplace passivo e não processa pagamentos, a plataforma <strong>não armazena nem processa dados de cartão de crédito, senhas bancárias ou chaves PIX privadas</strong>. Os dados de contato não ficam expostos em vitrine pública: são usados só para pôr as duas partes em contato, que então combinam o serviço diretamente.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Direitos do Titular (LGPD)</h2>
              <p>
                O titular dos dados pode solicitar a qualquer momento a confirmação de existência de tratamento, acesso, correção ou exclusão definitiva de seus dados de cadastro enviando solicitação para <strong>allan@jobpago.com.br</strong>.
              </p>
            </section>
          </div>
        ) : i === "es" ? (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Responsable del tratamiento</h2>
              <p>El responsable de los datos personales recogidos en esta plataforma es <strong>Allan Candido</strong>, contacto: <strong>allan@jobpago.com.br</strong>.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Datos recogidos y finalidad</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Registro de servicio</strong> (quien busca ingresos): nombre, WhatsApp, e-mail opcional, ciudad y estado (o &quot;en la ruta&quot;), áreas, modalidad y horario. Finalidad: contactar a la persona cuando un negocio publique una tarea compatible. No se muestra públicamente.</li>
                <li><strong>Solicitud de Parada visitada</strong> (camping, hostel, posada, hotel, patio): nombre y tipo del lugar, ciudad, qué ofrece, precio por noche, forma de apoyo a la expedición, responsable, WhatsApp, e-mail y sitio opcionales. Finalidad: acordar la visita. Solo el nombre, tipo, ciudad, estructura, precio y nivel de Honor de los lugares <em>verificados</em> son públicos.</li>
                <li><strong>Registro de tarea o servicio</strong>: nombre, WhatsApp, e-mail y descripción. Finalidad: enviar el pedido por WhatsApp a quien coincide.</li>
                <li><strong>Botón de WhatsApp</strong>: antes de abrir la conversación, la persona elige el asunto y puede dar su nombre. Finalidad: dirigir la atención.</li>
                <li><strong>Navegación</strong>: páginas vistas, tiempo en la página, desplazamiento, clics y origen de la visita. Sin cookies y sin guardar la dirección IP; el navegador recibe un identificador aleatorio. Finalidad: medir y mejorar el sitio.</li>
                <li><strong>Contacto con empresas</strong>: usamos datos públicos del registro de empresas (CNPJ) de la Receita Federal de Brasil para invitar a empresas activas, con base en el interés legítimo (art. 7º, IX, de la LGPD). No escribimos a empresarios individuales ni MEI, limitamos a dos contactos por empresa y todo e-mail tiene baja en un clic, respetada para siempre.</li>
                <li><strong>Programa de recomendación</strong>: de quien genera el enlace guardamos el código, la forma de cobro (clave Pix o e-mail de Wise/PayPal) y el país; contamos cuántas veces se abrió el enlace (sin identificar a quién lo abrió). En el navegador de quien abre el enlace, el código queda guardado 60 días. Finalidad: calcular y pagar la comisión.</li>
                <li><strong>Expedición del viajero</strong>: nombre, tema, origen, destino, paradas, mes de salida, modo y vehículo, redes con seguidores informados, diario y forma de cobro del patrocinio. Tras la aprobación son públicos el nombre y tema, el trayecto, el modo, las redes y el diario, <strong>nunca la posición actual</strong>: no publicamos fechas exactas, el diario aparece 24 horas después de escrito y la ruta planeada puede ocultarse. La forma de cobro nunca es pública.</li>
                <li><strong>Propuesta de patrocinio</strong>: empresa, contacto, e-mail, monto y contrapartida. Finalidad: negociar el patrocinio, que pasa por JobPago con repase del 85% al viajero.</li>
                <li><strong>Contribuciones del viajero</strong> (cuenta JobPago): foto de fachada, relato de pernocte, prueba de internet, precio de combustible, estado de la ruta, recomendación de lugar y el cuestionario del viajero. Para confirmar que la contribución es del lugar, pedimos la <strong>ubicación del celular al enviar</strong>, solo con tu consentimiento, avisado en pantalla. Las fotos aparecen en el mapa solo después de revisadas, sin rostros ni patentes identificables. El cuestionario no es público. Finalidad: mantener la información de la ruta verdadera y calcular tu reputación.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Uso compartido y ausencia de datos bancarios</h2>
              <p>La plataforma <strong>no almacena ni procesa datos de tarjeta, contraseñas bancarias ni claves PIX privadas</strong>. Los datos de contacto no se exponen públicamente: se usan solo para poner a las dos partes en contacto.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Derechos del titular (LGPD)</h2>
              <p>Podés pedir en cualquier momento la confirmación del tratamiento, acceso, corrección o eliminación definitiva de tus datos escribiendo a <strong>allan@jobpago.com.br</strong>.</p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Data controller</h2>
              <p>The controller of the personal data collected on this platform is <strong>Allan Candido</strong>, contact: <strong>allan@jobpago.com.br</strong>.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Data collected and purpose</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Service sign-up</strong> (people looking for income): name, WhatsApp, optional e-mail, town and state (or &quot;travelling&quot;), fields, mode and hours. Purpose: contacting the person when a business posts a matching task. Not shown publicly.</li>
                <li><strong>Visited stopover application</strong> (campsite, hostel, guesthouse, hotel, yard): place name and type, town, what it offers, price per night, how it supports the expedition, person in charge, WhatsApp, optional e-mail and website. Purpose: arranging the visit. Only the name, type, town, facilities, price and Honour level of <em>verified</em> places are public.</li>
                <li><strong>Task or service request</strong>: name, WhatsApp, e-mail and description. Purpose: forwarding the request on WhatsApp to matching people.</li>
                <li><strong>WhatsApp button</strong>: before opening the chat, the person picks a subject and may give their name. Purpose: routing the conversation.</li>
                <li><strong>Browsing</strong>: pages viewed, time on page, scrolling, clicks and where the visit came from. No cookies and no IP address stored; the browser gets a random identifier. Purpose: measuring and improving the site.</li>
                <li><strong>Contacting businesses</strong>: we use public data from Brazil&apos;s company register (CNPJ, Receita Federal) to invite active companies, based on legitimate interest (LGPD art. 7, IX). We don&apos;t contact sole traders or MEIs, we limit contact to two messages per company, and every e-mail has a one-click unsubscribe that is honoured permanently.</li>
                <li><strong>Referral programme</strong>: for link owners we store the code, the payout method (Pix key or Wise/PayPal e-mail) and country; we count how many times the link was opened (without identifying who opened it). In the visitor&apos;s browser the code is kept for 60 days. Purpose: calculating and paying commission.</li>
                <li><strong>Traveller expedition</strong>: name, theme, origin, destination, planned stops, departure month, mode and vehicle, social networks with reported followers, diary and sponsorship payout method. After approval, the name and theme, route, mode, networks and diary are public — <strong>never the current position</strong>: we don&apos;t publish exact dates, the diary appears 24 hours after it&apos;s written and the planned route can be hidden. The payout method is never public.</li>
                <li><strong>Sponsorship proposal</strong>: company, contact, e-mail, intended amount and benefits. Purpose: negotiating the sponsorship, which goes through JobPago with 85% passed on to the traveller.</li>
                <li><strong>Traveller contributions</strong> (JobPago account): storefront photo, overnight report, internet test, fuel price, road condition, place recommendation and the traveller questionnaire. To confirm the contribution is from the place, we ask for <strong>the phone&apos;s location at the time of sending</strong> — only with your consent, shown on screen. Photos appear on the map only after review, with no identifiable faces or number plates. The questionnaire is not public. Purpose: keeping route information accurate and calculating your reputation.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Sharing and no banking data</h2>
              <p>The platform <strong>does not store or process card data, bank passwords or private PIX keys</strong>. Contact details are never shown publicly: they are only used to put the two parties in touch.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Your rights (LGPD)</h2>
              <p>You may at any time request confirmation of processing, access, correction or permanent deletion of your data by writing to <strong>allan@jobpago.com.br</strong>.</p>
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
