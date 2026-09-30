import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { CATEGORIAS } from "@/data/categorias";
import TopoSimples from "@/components/TopoSimples";
import RodapeSimples from "@/components/RodapeSimples";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import { tCategoria, tCategoriaDesc } from "@/lib/traducoesCadastro";

export async function generateMetadata(): Promise<Metadata> {
  const i = await idiomaServidor();
  return {
    title: L(i, "Como Funciona · JobPago.com.br", "Cómo funciona · JobPago.com.br", "How it works · JobPago.com.br"),
    description: L(i,
      "Entenda como o JobPago conecta quem precisa contratar e quem presta serviço na viagem, sem comissão e com pagamento direto por PIX.",
      "Entendé cómo JobPago conecta a quien necesita contratar con quien presta servicios en la ruta, sin comisión y con pago directo por PIX.",
      "How JobPago connects people who need to hire with people who provide services while travelling — no commission, paid directly via PIX."),
    robots: { index: true, follow: true },
  };
}

export default async function ComoFuncionaPage() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  return (
    <div className="min-h-screen text-slate-100 selection:bg-amber-500 selection:text-black">
      <TopoSimples />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* HERO */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("Guia Rápido", "Guía rápida", "Quick guide")}
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            {t("Como Funciona o JobPago", "Cómo funciona JobPago", "How JobPago works")}
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("A JobPago liga o negócio local e da rota a quem faz a tarefa — fotos, Instagram, cardápio, frete, apoio na viagem. Sem comissão sobre o seu trabalho e sem checkout na plataforma: o valor é combinado e pago direto por PIX entre as duas partes.", "JobPago conecta el negocio del barrio y de la ruta con quien hace la tarea: fotos, Instagram, menú, flete, apoyo en la ruta. Sin comisión sobre tu trabajo y sin checkout en la plataforma: el valor se acuerda y se paga directo por PIX entre las dos partes.", "JobPago connects local and roadside businesses with the people who do the tasks — photos, Instagram, menus, freight, roadside help. No commission on your work and no checkout on the platform: the price is agreed and paid directly via PIX between the two parties.")}
          </p>
        </div>

        {/* DOIS LADOS, UMA REDE */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-black text-white">{t("Dois lados, uma rede", "Dos lados, una red", "Two sides, one network")}</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            {t("Não importa se você precisa contratar ou se você é quem presta o serviço — cada lado tem sua porta de entrada.", "No importa si necesitás contratar o si sos quien presta el servicio: cada lado tiene su puerta de entrada.", "Whether you need to hire or you're the one providing the service, each side has its own way in.")}
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel border border-amber-500/20 rounded-3xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Icon name="building" width={44} height={44} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white">{t("Quem precisa contratar", "Quien necesita contratar", "Who needs to hire")}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
                <li className="flex gap-2.5">
                  <Icon name="check" width={36} height={36} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <Link href="/cadastrar-servico?tipo=contratante" className="text-amber-400 underline hover:text-amber-300">{t("Publica uma tarefa", "Publica una tarea", "Posts a task")}</Link>{t(": descreve o que precisa e a gente chama quem faz, da cidade ou remoto.", ": describe lo que necesita y llamamos a quien lo hace, de la ciudad o remoto.", ": describes what's needed and we call someone to do it, local or remote.")}
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Icon name="check" width={36} height={36} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {t("Vê o", "Mira el", "Sees the")} <Link href="/cidade" className="text-amber-400 underline hover:text-amber-300">{t("relatório da sua cidade", "informe de su ciudad", "town report")}</Link>{t(": quem está abrindo negócio e os valores de referência de cada setor.", ": quién abre negocios y los valores de referencia de cada sector.", ": who is opening businesses and reference rates for each sector.")}
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mb-4">
                <Icon name="briefcase" width={44} height={44} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-black text-white">{t("Quem presta o serviço", "Quien presta el servicio", "Who provides the service")}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
                <li className="flex gap-2.5">
                  <Icon name="check" width={36} height={36} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <Link href="/disponibilidade" className="text-amber-400 underline hover:text-amber-300">{t("Cadastra o seu serviço", "Registra su servicio", "Registers their service")}</Link>{t(": o que você faz e de onde trabalha — da cidade, remoto ou viajando.", ": qué hace y desde dónde trabaja: en la ciudad, remoto o viajando.", ": what you do and where you work from — local, remote or while travelling.")}
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Icon name="check" width={36} height={36} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {t("Quando um negócio publicar uma tarefa que combina, a gente te chama no WhatsApp. Sem vitrine: seu contato não fica exposto.", "Cuando un negocio publique una tarea que coincida, te llamamos por WhatsApp. Sin vidriera: tu contacto no queda expuesto.", "When a business posts a matching task, we message you on WhatsApp. No public listing: your contact isn't exposed.")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* DOIS CAMINHOS PRA FECHAR NEGÓCIO */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-black text-white">{t("Dois caminhos pra fechar negócio", "Dos caminos para cerrar un trato", "Two ways to close a deal")}</h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                {t("Caminho 01", "Camino 01", "Path 01")}
              </span>
              <h3 className="text-base font-black text-white mt-1">{t("Tarefa do negócio", "Tarea del negocio", "Business task")}</h3>
              <div className="flex flex-col gap-4 border-l border-white/10 pl-5 mt-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 1</span>
                  <p className="text-sm text-white font-bold mt-0.5">{t("Tarefa publicada", "Tarea publicada", "Task posted")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("O negócio diz o que precisa, o prazo e a faixa de valor.", "El negocio dice qué necesita, el plazo y el rango de valor.", "The business says what it needs, the deadline and the price range.")}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 2</span>
                  <p className="text-sm text-white font-bold mt-0.5">{t("A gente chama quem faz", "Llamamos a quien lo hace", "We call someone to do it")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("Quem cadastrou serviço naquela área recebe o contato. Sem vitrine: ninguém fica com o telefone exposto.", "Quien registró su servicio en esa área recibe el contacto. Sin vidriera: nadie queda con el teléfono expuesto.", "People who registered a service in that area get the contact. No public listing: nobody's phone is exposed.")}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 3</span>
                  <p className="text-sm text-white font-bold mt-0.5">{t("Combinado & PIX direto", "Acuerdo y PIX directo", "Agreed & direct PIX")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("Valor, prazo e entrega são negociados entre vocês. O PIX vai direto pra sua chave.", "Valor, plazo y entrega se negocian entre ustedes. El PIX va directo a tu clave.", "Price, deadline and delivery are agreed between you. The PIX goes straight to your key.")}</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                {t("Caminho 02", "Camino 02", "Path 02")}
              </span>
              <h3 className="text-base font-black text-white mt-1">{t("Cadastro & Despacho", "Registro y envío", "Sign-up & dispatch")}</h3>
              <div className="flex flex-col gap-4 border-l border-white/10 pl-5 mt-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 1</span>
                  <p className="text-sm text-white font-bold mt-0.5">{t("Cadastro & validação", "Registro y validación", "Sign-up & validation")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("WhatsApp com DDD e e-mail validados, pra contato direto dos dois lados.", "WhatsApp y e-mail validados, para un contacto directo de los dos lados.", "Validated WhatsApp and e-mail, for direct contact on both sides.")}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 2</span>
                  <p className="text-sm text-white font-bold mt-0.5">{t("Envio pelo JobPago", "Envío por JobPago", "Sent by JobPago")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("A gente lê o pedido e despacha no WhatsApp pra rede que bate com o perfil que você descreveu.", "Leemos el pedido y lo enviamos por WhatsApp a la red que coincide con el perfil que describiste.", "We read the request and send it on WhatsApp to the people matching the profile you described.")}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 3</span>
                  <p className="text-sm text-white font-bold mt-0.5">{t("PIX instantâneo", "PIX instantáneo", "Instant PIX")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("Negociação de valor e entrega combinada, sem taxa de intermediação.", "Valor y entrega acordados, sin tarifa de intermediación.", "Price and delivery agreed, no middleman fee.")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PIX DIRETO, SEM COMISSÃO */}
        <section className="mt-16 glass-panel border border-amber-500/20 rounded-3xl p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Icon name="bolt" width={44} height={44} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">{t("PIX direto, sem comissão", "PIX directo, sin comisión", "Direct PIX, no commission")}</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                {t("O JobPago não guarda seu dinheiro nem cobra porcentagem sobre o que você ganha. Não existe checkout dentro da plataforma: o valor combinado é pago direto na chave PIX de quem prestou o serviço, sem passar pela mão de ninguém no meio.", "JobPago no guarda tu dinero ni cobra porcentaje sobre lo que ganás. No hay checkout dentro de la plataforma: el valor acordado se paga directo a la clave PIX de quien prestó el servicio, sin intermediarios.", "JobPago doesn't hold your money or take a cut of what you earn. There's no checkout on the platform: the agreed price is paid straight to the provider's PIX key, with no one in between.")}
              </p>
            </div>
          </div>
        </section>

        {/* ALTA HONRA */}
        <section className="mt-10 glass-panel glass-amber border border-amber-400/25 rounded-3xl p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Icon name="shield" width={44} height={44} className="text-amber-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-black text-white">{t("Alta Honra: reputação de quem ajuda na viagem", "Alto Honor: reputación de quien ayuda en el viaje", "High Honour: reputation for helping travellers")}</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                {t("A reputação começa a contar com as primeiras tarefas fechadas e os primeiros Pousos visitados na Expedição nº 01 — até lá, todo mundo começa do zero. Apoio de cortesia (chuveiro, tomada, recarga, mentoria de graça pra quem tá viajando), confirmado por quem recebeu, é o que mais pontua — cada nível pede 40% a mais de XP que o anterior, então nível alto é reputação real, não cadastro.", "La reputación empieza a contar con las primeras tareas cerradas y las primeras Paradas visitadas en la Expedición nº 01; hasta entonces, todos empiezan de cero. El apoyo de cortesía (ducha, enchufe, carga, mentoría gratis para quien está en la ruta), confirmado por quien lo recibió, es lo que más suma: cada nivel pide 40% más de XP que el anterior, así que un nivel alto es reputación real, no un registro.", "Reputation starts counting with the first closed tasks and the first Visited stopovers on Expedition no. 01 — until then, everyone starts from zero. Courtesy help (shower, power, charging, free mentoring for travellers), confirmed by whoever received it, scores the most — each level needs 40% more XP than the last, so a high level is real reputation, not just a sign-up.")}
              </p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <div className="glass-card border border-amber-400/20 rounded-2xl p-4">
                  <span className="text-amber-300 font-black text-sm">+200 XP · +50 PTS</span>
                  <p className="text-xs text-slate-400 mt-1">{t("Oferecer um serviço 100% cortesia.", "Ofrecer un servicio 100% de cortesía.", "Offer a service 100% free.")}</p>
                </div>
                <div className="glass-card border border-amber-400/20 rounded-2xl p-4">
                  <span className="text-amber-300 font-black text-sm">+150 XP · +10 PTS</span>
                  <p className="text-xs text-slate-400 mt-1">{t("Tarefa concluída e paga, confirmada pelas duas partes.", "Tarea terminada y pagada, confirmada por las dos partes.", "Task completed and paid, confirmed by both parties.")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIAS */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-black text-white">{t("7 categorias, 1 mapa", "7 categorías, 1 mapa", "7 categories, 1 map")}</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            {t("Cada categoria reúne quem oferece e quem procura. Encontre a sua.", "Cada categoría reúne a quien ofrece y a quien busca. Encontrá la tuya.", "Each category brings together people offering and people looking. Find yours.")}
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIAS.map((cat) => (
              <div key={cat.id} className="glass-card rounded-2xl p-5 border border-white/10">
                <Icon name={cat.icone} width={56} height={56} />
                <h3 className="text-sm font-black text-white mt-3">{tCategoria(i, cat.id, cat.nome)}</h3>
                <p className="text-xs text-slate-400 mt-1">{tCategoriaDesc(i, cat.id, cat.descricao)}</p>
                {cat.aviso && <p className="text-[11px] text-amber-200/80 mt-2 leading-snug">{cat.aviso[i]}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mt-16 text-center glass-panel border border-white/10 rounded-3xl p-8 sm:p-12">
          <h2 className="text-xl sm:text-2xl font-black text-white">{t("Pronto pra começar?", "¿Listo para empezar?", "Ready to start?")}</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            {t("Explore o mapa ou cadastre sua demanda — os dois caminhos levam pra mesma rede.", "Explorá el mapa o registrá lo que necesitás: los dos caminos llevan a la misma red.", "Explore the map or post what you need — both paths lead to the same network.")}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/#mapa-gps"
              className="btn-primary-amalfi w-full sm:w-auto px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm sm:text-base font-black shadow-lg cursor-pointer"
            >
              <Icon name="compass" width={36} height={36} /> {t("Explorar Mapa & Serviços", "Explorar mapa y servicios", "Explore map & services")}
            </Link>
            <Link
              href="/cadastrar-servico"
              className="btn-secondary-glass w-full sm:w-auto px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base font-bold cursor-pointer"
            >
              <Icon name="handshake" width={36} height={36} /> {t("Oferecer ou Contratar", "Ofrecer o contratar", "Offer or hire")}
            </Link>
          </div>
        </section>
      </main>

      <RodapeSimples />
    </div>
  );
}
