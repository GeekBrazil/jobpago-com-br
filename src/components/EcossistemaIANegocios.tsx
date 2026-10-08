"use client";

import { useState } from "react";
import Link from "next/link";
import { L, type Idioma } from "@/lib/i18n";

interface Props {
  idioma: Idioma;
}

interface NegocioTipo {
  id: string;
  icone: string;
  titulo: { pt: string; es: string; en: string };
  subtitulo: { pt: string; es: string; en: string };
  dorPrincipal: { pt: string; es: string; en: string };
  solucaoIA: { pt: string; es: string; en: string };
  fluxo: Array<{ etapa: string; desc: { pt: string; es: string; en: string } }>;
  economia: string;
}

const NEGOCIOS: NegocioTipo[] = [
  {
    id: "turismo",
    icone: "🏨",
    titulo: {
      pt: "Pousadas, Hotéis & Chalés",
      es: "Posadas, Hoteles y Cabañas",
      en: "Inns, Boutique Hotels & Lodges",
    },
    subtitulo: {
      pt: "Turismo, Hospedagem e Passeios",
      es: "Turismo, Hospedaje y Excursiones",
      en: "Hospitality & Coastal Tours",
    },
    dorPrincipal: {
      pt: "Perda de 18% a 25% de comissão no Booking e demora no atendimento de WhatsApp à noite.",
      es: "Pérdida de 18% a 25% de comisión en plataformas y demoras de atención en WhatsApp.",
      en: "Losing 18% to 25% in OTA commissions and slow WhatsApp responses at night.",
    },
    solucaoIA: {
      pt: "Agente SDR 24h envia fotos dos quartos certos, orça a diária e gera chave Pix com confirmação instantânea.",
      es: "Agente IA 24/7 envía fotos de habitaciones, cotiza y cobra por Pix al instante.",
      en: "24/7 AI agent sends room photos, calculates nightly rates, and collects instant Pix.",
    },
    fluxo: [
      { etapa: "1. Contato", desc: { pt: "Cliente pede quarto no feriado", es: "Huésped consulta fechas", en: "Guest asks for dates" } },
      { etapa: "2. Triagem", desc: { pt: "IA checa leitos e envia fotos reais", es: "IA verifica camas y envía fotos", en: "AI checks inventory & photos" } },
      { etapa: "3. Reserva", desc: { pt: "Gera Pix Copia e Cola dinâmico", es: "Genera código Pix dinámico", en: "Generates dynamic Pix payment" } },
      { etapa: "4. Pós-Venda", desc: { pt: "Envia Maps e guia da cidade no check-in", es: "Envía Maps y guía de la ciudad", en: "Sends Maps & local travel guide" } },
    ],
    economia: "R$ 3.800/mês economizados em comissões e recepção",
  },
  {
    id: "tecnicos",
    icone: "⚡",
    titulo: {
      pt: "Eletricistas, Ar-Condicionado & Obras",
      es: "Electricistas, Aire y Mantenimiento",
      en: "Electricians, HVAC & Maintenance",
    },
    subtitulo: {
      pt: "Prestadores de Serviços & Reparos",
      es: "Técnicos y Reparaciones Rápidas",
      en: "Field Techs & Home Repairs",
    },
    dorPrincipal: {
      pt: "Perder tempo respondendo orçamentos enquanto está no telhado ou trabalhando na obra.",
      es: "Perder tiempo respondiendo mensajes mientras está trabajando en la obra.",
      en: "Wasting time answering calls and quotes while on the job or on a ladder.",
    },
    solucaoIA: {
      pt: "IA escuta o áudio do cliente, calcula o valor do deslocamento por Km e agenda o horário disponível na rota.",
      es: "IA escucha audios del cliente, calcula desplazamiento y agenda el horario libre.",
      en: "AI transcribes voice notes, calculates travel fee per km, and books open slots.",
    },
    fluxo: [
      { etapa: "1. Áudio", desc: { pt: "Cliente manda áudio do problema", es: "Cliente envía audio del fallo", en: "Client sends audio of issue" } },
      { etapa: "2. Cálculo", desc: { pt: "IA orça estimativa + Km de deslocamento", es: "IA estima costo y kilometraje", en: "AI estimates labor + km distance" } },
      { etapa: "3. Agenda", desc: { pt: "Bloqueia horário no calendário do técnico", es: "Reserva hora en el calendario", en: "Locks time slot on schedule" } },
      { etapa: "4. Recibo", desc: { pt: "Dispara recibo Pix e garantia em PDF", es: "Envía recibo Pix y garantía PDF", en: "Sends Pix receipt & PDF warranty" } },
    ],
    economia: "Até 12 horas livres por semana sem atendimento manual",
  },
  {
    id: "gastronomia",
    icone: "🍕",
    titulo: {
      pt: "Restaurantes, Cafés & Marmitarias",
      es: "Restaurantes, Cafeterías y Viandas",
      en: "Restaurants, Cafes & Cloud Kitchens",
    },
    subtitulo: {
      pt: "Alimentação & Delivery Local",
      es: "Comida y Entregas Locales",
      en: "Food Delivery & Local Dining",
    },
    dorPrincipal: {
      pt: "Taxas de 27% no iFood que engolem o lucro e mensagens acumuladas nos horários de pico.",
      es: "Comisiones abusivas de apps de delivery y saturación en WhatsApp en horas pico.",
      en: "27% platform delivery fees eating profit margins and peak-hour WhatsApp chaos.",
    },
    solucaoIA: {
      pt: "Cardápio inteligente no WhatsApp com carrinho de compras, cálculo de entrega por CEP e Pix direto.",
      es: "Menú interactivo en WhatsApp, cálculo de delivery y cobro directo por Pix.",
      en: "Smart WhatsApp menu with checkout, delivery fee calculation, and direct Pix.",
    },
    fluxo: [
      { etapa: "1. Cardápio", desc: { pt: "IA apresenta opções e adicionais", es: "Menú interactivo guiado por IA", en: "AI presents menu & add-ons" } },
      { etapa: "2. Pedido", desc: { pt: "Calcula frete e endereço exato", es: "Calcula costo de envío por zona", en: "Calculates delivery by address" } },
      { etapa: "3. Baixa", desc: { pt: "Pix direto sem taxa de aplicativo", es: "Pix sin comisiones de apps", en: "Direct Pix with 0% commission" } },
      { etapa: "4. Cozinha", desc: { pt: "Imprime comanda e avisa motoboy", es: "Envía comanda a cocina y cadete", en: "Prints ticket & alerts driver" } },
    ],
    economia: "+22% de margem líquida recuperada sobre as vendas",
  },
  {
    id: "beleza",
    icone: "✂️",
    titulo: {
      pt: "Barbearias, Salões & Estética",
      es: "Barberías, Salones y Estética",
      en: "Barbershops, Salons & Aesthetics",
    },
    subtitulo: {
      pt: "Agendamentos & Beleza",
      es: "Turnos y Cuidado Personal",
      en: "Personal Care & Appointments",
    },
    dorPrincipal: {
      pt: "Faltas sem aviso prévio (no-show) e recepcionista atendendo telefone durante o dia.",
      es: "Clientes que faltan sin avisar y teléfono sonando sin parar.",
      en: "No-shows hurting revenue and phone ringing non-stop during client treatments.",
    },
    solucaoIA: {
      pt: "Agendamento autônomo com sinal via Pix de 30%, lembrete 2h antes e remarcação sem atrito.",
      es: "Agendamiento con seña por Pix, recordatorio 2h antes y reprogramación automática.",
      en: "Self-booking with 30% Pix deposit, 2-hour reminder, and frictionless rescheduling.",
    },
    fluxo: [
      { etapa: "1. Vagas", desc: { pt: "Cliente escolhe profissional e hora", es: "Elige profesional y turno libre", en: "Client picks staff and time slot" } },
      { etapa: "2. Sinal", desc: { pt: "Cobra sinal Pix de R$ 20 para segurar vaga", es: "Cobra seña para asegurar turno", en: "Collects deposit to hold slot" } },
      { etapa: "3. Lembrete", desc: { pt: "Confirmação 2h antes no WhatsApp", es: "Recordatorio 2h antes por chat", en: "WhatsApp alert 2 hours prior" } },
      { etapa: "4. Fidelidade", desc: { pt: "Reativação a cada 20 dias com desconto", es: "Recurrencia cada 20 días con promo", en: "Auto-re-engagement every 20 days" } },
    ],
    economia: "Redução de 92% das faltas e cadeiras vazias",
  },
  {
    id: "fretes",
    icone: "🚚",
    titulo: {
      pt: "Fretes, Carretos & Vans",
      es: "Fletes, Mudanzas y Camiones",
      en: "Freight, Moving & Vans",
    },
    subtitulo: {
      pt: "Transporte & Logística Rodoviária",
      es: "Transporte y Logística de Ruta",
      en: "Road Haulage & Regional Transit",
    },
    dorPrincipal: {
      pt: "Voltar com o caminhão ou van vazio na estrada sem saber onde tem carga para pegar.",
      es: "Volver con el vehículo vacío en la ruta sin encontrar fletes de regreso.",
      en: "Deadheading (empty return trips) along highway routes without return loads.",
    },
    solucaoIA: {
      pt: "Radar de fretes na rota da expedição: a IA cruza sua cidade de destino com negócios precisando de frete.",
      es: "Cruce inteligente de rutas y cargas entre viajeros y negocios locales.",
      en: "AI route matchmaking: pairs your highway trajectory with local transport tasks.",
    },
    fluxo: [
      { etapa: "1. Rota", desc: { pt: "Motorista declara cidade de ida e volta", es: "Conductor marca origen y destino", en: "Driver declares origin & route" } },
      { etapa: "2. Match", desc: { pt: "IA conecta frete na mesma direção", es: "IA conecta cargas en el camino", en: "AI matches pickups along route" } },
      { etapa: "3. Sinal", desc: { pt: "Pix antecipado para abastecimento", es: "Pix inicial para combustible", en: "Advance Pix for fuel costs" } },
      { etapa: "4. Entrega", desc: { pt: "Quitação com foto do canhoto assinado", es: "Saldo al entregar con foto de remito", en: "Final payout on signed POD photo" } },
    ],
    economia: "Eliminação de viagens vazias na estrada",
  },
  {
    id: "comercio",
    icone: "🛍️",
    titulo: {
      pt: "Comércio Local, Ateliês & Lojas",
      es: "Comercio de Barrio y Artesanías",
      en: "Local Retail, Boutiques & Crafts",
    },
    subtitulo: {
      pt: "Varejo Físico e Vitrines Online",
      es: "Tiendas Físicas y Vitrinas Web",
      en: "Brick-and-Mortar & Online Showcases",
    },
    dorPrincipal: {
      pt: "Não ser encontrado no Google Maps por turistas e moradores que pesquisam no celular.",
      es: "No aparecer en búsquedas de Google Maps de turistas y vecinos.",
      en: "Being invisible on Google Maps searches when tourists and locals look on mobile.",
    },
    solucaoIA: {
      pt: "Vitrine web rápida gerada em 1 hora, catálogo fotográfico e motor de avaliações 5 estrelas.",
      es: "Página web de alta conversión en 1 hora con reseñas 5 estrellas en Google.",
      en: "High-speed storefront generated in 1 hour with 5-star Google review engine.",
    },
    fluxo: [
      { etapa: "1. Vitrine", desc: { pt: "Página leve com SEO local em Prado/Rota", es: "Página con SEO local optimizado", en: "Fast page with local SEO" } },
      { etapa: "2. Catálogo", desc: { pt: "Fotos e preços com botão WhatsApp", es: "Fotos y precios directos al chat", en: "Photos & pricing with direct chat" } },
      { etapa: "3. Pix", desc: { pt: "Pagamento presencial ou remoto", es: "Cobro presencial o a distancia", en: "In-person or remote Pix checkout" } },
      { etapa: "4. Review", desc: { pt: "Convite automático de avaliação Google", es: "Solicitud de reseña 5 estrellas", en: "Automated 5-star Google review invite" } },
    ],
    economia: "+45% de clientes novos vindos da busca orgânica",
  },
];

export default function EcossistemaIANegocios({ idioma }: Props) {
  const [selecionado, setSelecionado] = useState(NEGOCIOS[0]);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto relative z-10 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{L(idioma, "Engenharia de IA para Negócios Locais", "Ingeniería de IA para Negocios Locales", "AI Engineering for Local Businesses")}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {L(idioma, "Ecossistema de IA do Pequeno Negócio", "Ecosistema de IA del Pequeño Negocio", "Small Business AI Operating Ecosystem")}
        </h2>
        <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
          {L(
            idioma,
            "Mais do que um site: uma esteira autônoma que atende 24h por dia no WhatsApp, bloqueia overbooking, cobra via Pix com 0% de comissão e conquista avaliações 5 estrelas no Google.",
            "Más que una web: un sistema autónomo que atiende 24/7 en WhatsApp, cobra por Pix con 0% de comisión y genera reseñas 5 estrellas.",
            "More than a website: an autonomous engine operating 24/7 on WhatsApp, collecting Pix with 0% commission, and earning 5-star Google reviews."
          )}
        </p>
      </div>

      {/* Seletor de Tipo de Negócio */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
        {NEGOCIOS.map((n) => {
          const ativo = n.id === selecionado.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelecionado(n)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                ativo
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]"
                  : "glass-panel text-slate-300 hover:text-white hover:border-amber-500/30"
              }`}
            >
              <span className="text-base">{n.icone}</span>
              <span>{L(idioma, n.titulo.pt, n.titulo.es, n.titulo.en)}</span>
            </button>
          );
        })}
      </div>

      {/* Card Principal do Negócio Selecionado */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-amber-500/30 relative z-10 shadow-2xl">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Lado Esquerdo: Diagnóstico e Solução */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold">
              <span>{selecionado.icone}</span>
              <span>{L(idioma, selecionado.subtitulo.pt, selecionado.subtitulo.es, selecionado.subtitulo.en)}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {L(idioma, selecionado.titulo.pt, selecionado.titulo.es, selecionado.titulo.en)}
            </h3>

            {/* Dor vs Solução */}
            <div className="space-y-3">
              <div className="rounded-2xl bg-rose-950/20 border border-rose-500/20 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block mb-1">
                  {L(idioma, "A DOR QUE DRENA SEU LUCRO", "EL PROBLEMA QUE FRENA TU GANANCIA", "THE PROBLEM DRAINING PROFIT")}
                </span>
                <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                  {L(idioma, selecionado.dorPrincipal.pt, selecionado.dorPrincipal.es, selecionado.dorPrincipal.en)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-950/25 border border-emerald-500/30 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                  {L(idioma, "A SOLUÇÃO COM ENGENHARIA DE IA", "LA SOLUCIÓN CON INGENIERÍA DE IA", "THE AI SOLUTION")}
                </span>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
                  {L(idioma, selecionado.solucaoIA.pt, selecionado.solucaoIA.es, selecionado.solucaoIA.en)}
                </p>
              </div>
            </div>

            {/* Destaque de Economia */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shrink-0">
                💰
              </div>
              <span className="text-xs sm:text-sm font-bold text-amber-300">
                {selecionado.economia}
              </span>
            </div>
          </div>

          {/* Lado Direito: Gráfico de Fluxo Autônomo das 4 Etapas */}
          <div className="lg:col-span-7 bg-slate-950/60 rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                {L(idioma, "CICLO DE EXECUÇÃO AUTOMÁTICA", "CICLO DE EJECUCIÓN AUTOMÁTICA", "AUTOMATED EXECUTION CYCLE")}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                100% Autônomo · Sem Funcionário Noturno
              </span>
            </div>

            {/* Diagrama dos Passos */}
            <div className="grid sm:grid-cols-2 gap-4">
              {selecionado.fluxo.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 relative group hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {p.etapa}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono text-amber-300">
                      {idx + 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {L(idioma, p.desc.pt, p.desc.es, p.desc.en)}
                  </p>
                </div>
              ))}
            </div>

            {/* Comparativo de Custos: Tradicional vs Com IA */}
            <div className="pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-3 font-bold">
                {L(idioma, "Comparativo Mensal de Custo Operacional", "Comparativo Mensual de Costo Operativo", "Monthly Operational Cost Benchmark")}
              </span>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Tradicional (2 recepcionistas + comissões de app)</span>
                    <span className="text-rose-400 font-mono font-bold">R$ 5.800/mês</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full w-[88%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-300 font-bold">Com Ecossistema IA JobPago (1 operador + Pix Direto)</span>
                    <span className="text-emerald-400 font-mono font-black">R$ 850/mês</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[16%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Integrado */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span>Disponível para qualquer negócio da rota ou remoto.</span>
              </div>
              <Link
                href="/cadastrar-servico?tipo=contratante"
                className="btn-primary-amalfi rounded-xl px-5 py-2.5 text-xs font-black shadow-lg shadow-amber-500/20"
              >
                {L(idioma, "Ativar meu Mini-Sistema de IA", "Activar mi Mini-Sistema de IA", "Activate my Business AI System")} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
