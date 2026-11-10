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
      pt: "Comissão de 18% a 25% nas plataformas de reserva e demora para responder no WhatsApp à noite.",
      es: "Comisión de 18% a 25% en plataformas y demoras de atención en WhatsApp por la noche.",
      en: "Paying 18% to 25% in booking platform commissions and slow WhatsApp replies at night.",
    },
    solucaoIA: {
      pt: "Atendimento 24h no WhatsApp envia fotos dos quartos disponíveis, calcula a diária e gera a chave Pix na hora.",
      es: "Atención 24/7 en WhatsApp envía fotos de habitaciones, cotiza y cobra por Pix al instante.",
      en: "24/7 WhatsApp booking sends room photos, calculates nightly rates, and collects instant Pix.",
    },
    fluxo: [
      { etapa: "1. Contato", desc: { pt: "Cliente consulta datas no WhatsApp", es: "Huésped consulta fechas", en: "Guest asks for dates" } },
      { etapa: "2. Quartos", desc: { pt: "Checa vagas e envia fotos reais", es: "Verifica camas y envía fotos", en: "Checks inventory & photos" } },
      { etapa: "3. Reserva", desc: { pt: "Gera Pix Copia e Cola direto", es: "Genera código Pix directo", en: "Generates direct Pix payment" } },
      { etapa: "4. Check-in", desc: { pt: "Envia localização e guia da cidade", es: "Envía ubicación y guía local", en: "Sends location & local guide" } },
    ],
    economia: "Reservas diretas no WhatsApp sem comissão de plataforma",
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
      pt: "Parar o serviço na escada ou na obra toda hora para responder pedidos de orçamento no celular.",
      es: "Interrumpir el trabajo en la obra para responder presupuestos por teléfono.",
      en: "Stopping work on a ladder or job site to answer quote requests.",
    },
    solucaoIA: {
      pt: "Transcreve o áudio do cliente, calcula o deslocamento por quilômetro e agenda no primeiro horário livre.",
      es: "Transcribe el audio del cliente, calcula el desplazamiento y agenda el primer turno libre.",
      en: "Transcribes client voice notes, calculates travel fee per km, and books open slots.",
    },
    fluxo: [
      { etapa: "1. Áudio", desc: { pt: "Cliente manda áudio explicando o defeito", es: "Cliente envía audio del fallo", en: "Client sends audio of issue" } },
      { etapa: "2. Cálculo", desc: { pt: "Orça visita + quilometragem da rota", es: "Estima visita y kilometraje", en: "Estimates visit + km distance" } },
      { etapa: "3. Agenda", desc: { pt: "Reserva o horário no calendário", es: "Reserva hora en el calendario", en: "Locks time slot on schedule" } },
      { etapa: "4. Recibo", desc: { pt: "Envia recibo Pix e termo de garantia", es: "Envía recibo Pix y garantía", en: "Sends Pix receipt & warranty" } },
    ],
    economia: "Agenda preenchida enquanto você executa o serviço",
  },
  {
    id: "gastronomia",
    icone: "🍕",
    titulo: {
      pt: "Restaurantes, Cafés & Marmitarias",
      es: "Restaurantes, Cafeterías y Viandas",
      en: "Restaurants, Cafes & Kitchens",
    },
    subtitulo: {
      pt: "Alimentação & Delivery Local",
      es: "Comida y Entregas Locales",
      en: "Food Delivery & Local Dining",
    },
    dorPrincipal: {
      pt: "Taxas de até 27% nos aplicativos de entrega e fila de mensagens no horário de almoço e jantar.",
      es: "Comisiones altas en apps de delivery y mensajes acumulados en horas pico.",
      en: "Up to 27% delivery app fees and message bottlenecks at lunch and dinner.",
    },
    solucaoIA: {
      pt: "Cardápio direto no WhatsApp com cálculo de entrega por endereço e pagamento via Pix sem intermediário.",
      es: "Menú directo en WhatsApp, cálculo de envío por dirección y cobro por Pix.",
      en: "Direct WhatsApp menu with delivery calculation by address and Pix checkout.",
    },
    fluxo: [
      { etapa: "1. Cardápio", desc: { pt: "Mostra pratos do dia e adicionais", es: "Muestra platos del día y extras", en: "Shows daily dishes & add-ons" } },
      { etapa: "2. Entrega", desc: { pt: "Calcula taxa de entrega pelo endereço", es: "Calcula envío por dirección", en: "Calculates delivery by address" } },
      { etapa: "3. Pix", desc: { pt: "Recebe direto na conta do restaurante", es: "Cobro directo sin comisión", en: "Direct Pix with 0% commission" } },
      { etapa: "4. Cozinha", desc: { pt: "Gera o pedido pronto para preparo", es: "Envía pedido listo a cocina", en: "Sends order ready for kitchen" } },
    ],
    economia: "Venda direta no WhatsApp sem taxa sobre o pedido",
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
      pt: "Cliente que marca horário, não aparece e deixa a cadeira vazia no melhor turno do dia.",
      es: "Clientes que faltan sin avisar y dejan turnos vacíos.",
      en: "No-shows leaving chairs empty during peak hours.",
    },
    solucaoIA: {
      pt: "Agendamento com sinal via Pix, lembrete automático 2 horas antes e remarcação rápida pelo WhatsApp.",
      es: "Reserva con seña por Pix, recordatorio 2h antes y reprogramación rápida.",
      en: "Booking with Pix deposit, 2-hour reminder, and easy rescheduling.",
    },
    fluxo: [
      { etapa: "1. Horário", desc: { pt: "Cliente escolhe profissional e horário", es: "Elige profesional y turno libre", en: "Client picks staff and time slot" } },
      { etapa: "2. Sinal", desc: { pt: "Cobra sinal via Pix para confirmar vaga", es: "Cobra seña para confirmar turno", en: "Collects deposit to hold slot" } },
      { etapa: "3. Lembrete", desc: { pt: "Aviso no WhatsApp 2h antes do atendimento", es: "Aviso 2h antes por WhatsApp", en: "WhatsApp alert 2 hours prior" } },
      { etapa: "4. Retorno", desc: { pt: "Convite para agendar o próximo retorno", es: "Aviso para agendar próximo turno", en: "Follow-up for next appointment" } },
    ],
    economia: "Cadeiras ocupadas com horário confirmado por sinal",
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
      pt: "Voltar com o caminhão ou a van vazia na estrada por falta de contato nas cidades do trecho.",
      es: "Volver con el vehículo vacío en la ruta sin carga de regreso.",
      en: "Returning with an empty truck or van along the highway.",
    },
    solucaoIA: {
      pt: "Cruza a sua cidade de destino com comércios e moradores do trecho que precisam enviar carga ou mudança.",
      es: "Conecta tu ciudad de destino con negocios del tramo que necesitan flete.",
      en: "Matches your destination town with local businesses needing freight.",
    },
    fluxo: [
      { etapa: "1. Rota", desc: { pt: "Motorista informa cidade de saída e destino", es: "Conductor marca origen y destino", en: "Driver posts origin & destination" } },
      { etapa: "2. Chamado", desc: { pt: "Conecta pedidos de frete na mesma direção", es: "Conecta cargas en el camino", en: "Matches pickups along route" } },
      { etapa: "3. Sinal", desc: { pt: "Pix combinado direto entre as partes", es: "Pix acordado entre las partes", en: "Direct Pix agreed between parties" } },
      { etapa: "4. Entrega", desc: { pt: "Saldo quitado na entrega da carga", es: "Saldo al entregar la carga", en: "Balance paid upon delivery" } },
    ],
    economia: "Aproveitamento da viagem de volta com frete combinado",
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
      pt: "Turistas e moradores passam pela cidade sem encontrar sua loja ou seus produtos na busca do celular.",
      es: "Turistas y vecinos pasan por la ciudad sin encontrar tu tienda en el celular.",
      en: "Tourists and locals search on mobile without finding your shop or products.",
    },
    solucaoIA: {
      pt: "Vitrine leve com fotos, preços e botão direto para o seu WhatsApp, além de convite para avaliação no Google.",
      es: "Vitrina rápida con fotos, precios, botón a WhatsApp y enlace de reseñas en Google.",
      en: "Fast storefront with photos, prices, direct WhatsApp button, and Google review link.",
    },
    fluxo: [
      { etapa: "1. Vitrine", desc: { pt: "Página rápida encontrada na busca da cidade", es: "Página encontrada en búsquedas locales", en: "Fast page found in local search" } },
      { etapa: "2. Catálogo", desc: { pt: "Fotos e preços com botão para o WhatsApp", es: "Fotos y precios directos al chat", en: "Photos & prices with direct chat" } },
      { etapa: "3. Pix", desc: { pt: "Pagamento no balcão ou na entrega", es: "Cobro en tienda o a domicilio", en: "In-store or delivery Pix payment" } },
      { etapa: "4. Avaliação", desc: { pt: "Link direto para o cliente avaliar no Google", es: "Enlace para evaluar en Google", en: "Direct link for Google review" } },
    ],
    economia: "Presença nas buscas locais da cidade e da rota",
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
          <span>{L(idioma, "Ferramentas para Negócios da Rota", "Herramientas para Negocios de la Ruta", "Tools for Local Businesses")}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {L(idioma, "Atendimento 24h, Reservas e Pix Direto no WhatsApp", "Atención 24h, Reservas y Pix Directo en WhatsApp", "24/7 Support, Bookings & Direct Pix on WhatsApp")}
        </h2>
        <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
          {L(
            idioma,
            "Página própria e atendimento automático no WhatsApp para responder clientes a qualquer hora, organizar reservas e receber por Pix sem comissão de aplicativo.",
            "Página propia y atención automática en WhatsApp para responder a cualquier hora, organizar reservas y cobrar por Pix sin comisión.",
            "Your own page and automated WhatsApp booking to answer customers anytime, manage reservations, and get paid via Pix with zero commission."
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
                  {L(idioma, "ONDE O NEGÓCIO PERDE VENDA", "DÓNDE PIERDE VENTAS EL NEGOCIO", "WHERE SALES ARE LOST")}
                </span>
                <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                  {L(idioma, selecionado.dorPrincipal.pt, selecionado.dorPrincipal.es, selecionado.dorPrincipal.en)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-950/25 border border-emerald-500/30 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                  {L(idioma, "COMO RESOLVEMOS NO WHATSAPP", "CÓMO LO RESOLVEMOS EN WHATSAPP", "HOW IT WORKS ON WHATSAPP")}
                </span>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
                  {L(idioma, selecionado.solucaoIA.pt, selecionado.solucaoIA.es, selecionado.solucaoIA.en)}
                </p>
              </div>
            </div>

            {/* Destaque de Economia */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shrink-0">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-bold text-amber-300">
                {selecionado.economia}
              </span>
            </div>
          </div>

          {/* Lado Direito: Fluxo das 4 Etapas */}
          <div className="lg:col-span-7 bg-slate-950/60 rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                {L(idioma, "PASSO A PASSO DO ATENDIMENTO", "PASO A PASO DE LA ATENCIÓN", "STEP-BY-STEP WORKFLOW")}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {L(idioma, "Funciona 24h · Pix Direto", "Funciona 24h · Pix Directo", "24/7 · Direct Pix")}
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

            {/* CTA Integrado */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span>{L(idioma, "Disponível para comércios, pousadas e serviços da rota.", "Disponible para comercios, posadas y servicios de la ruta.", "Available for local shops, inns, and service providers.")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/allan"
                  className="btn-secondary-glass rounded-xl px-4 py-2.5 text-xs font-bold text-amber-300 border-amber-500/30 hover:border-amber-400"
                >
                  {L(idioma, "Ver Perfil Allan (Software, IA, Drone & 360°)", "Ver Perfil Allan (Software, IA, Dron y 360°)", "Allan's Profile (Software, AI, Drone & 360°)")} →
                </Link>
                <Link
                  href="/cadastrar-servico?tipo=contratante"
                  className="btn-primary-amalfi rounded-xl px-5 py-2.5 text-xs font-black shadow-lg shadow-amber-500/20"
                >
                  {L(idioma, "Solicitar para o meu negócio", "Solicitar para mi negocio", "Request for my business")} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
