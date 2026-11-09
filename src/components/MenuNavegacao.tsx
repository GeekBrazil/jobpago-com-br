"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";

export default function MenuNavegacao() {
  const [aberto, setAberto] = useState(false);
  const [idioma] = useIdioma();

  useEffect(() => {
    if (!aberto) return;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  const secoes = [
    {
      titulo: L(idioma, "Mapas e Rotas", "Mapas y Rutas", "Maps & Routes"),
      itens: [
        {
          href: "/#mapa-gps",
          icone: "🗺️",
          nome: L(idioma, "Mapa GPS da Rota", "Mapa GPS de la Ruta", "Route GPS Map"),
          desc: L(idioma, "Serviços, apoio nômade, pousos e fotos geolocalizadas", "Servicios, apoyo nómade y fotos geolocalizadas", "Services, nomad support and geolocated photos"),
        },
        {
          href: "/expedicao",
          icone: "🧭",
          nome: L(idioma, "Mapa da Expedição (Fortaleza → Paraty)", "Mapa de la Expedición", "Expedition Map (Fortaleza → Paraty)"),
          desc: L(idioma, "As 15 paradas oficiais pelo litoral brasileiro", "Las 15 paradas oficiales por la costa", "The 15 official coastal stops"),
        },
        {
          href: "/cidade",
          icone: "🏙️",
          nome: L(idioma, "Relatório da sua Cidade", "Informe de tu Ciudad", "Your Town Report"),
          desc: L(idioma, "Empresas abrindo, salários e compras públicas por município", "Empresas que abren, sueldos y compras públicas", "New businesses, salaries and public procurement"),
        },
        {
          href: "/expedicoes",
          icone: "🚐",
          nome: L(idioma, "Expedições de Viajantes", "Expediciones de Viajeros", "Traveller Expeditions"),
          desc: L(idioma, "Roteiros de quem está na estrada e patrocínio direto", "Rutas de viajeros y patrocinio directo", "Active traveller routes and direct sponsorship"),
        },
      ],
    },
    {
      titulo: L(idioma, "Para Viajantes (Renda e Pontos)", "Para Viajeros (Ingresos y Puntos)", "For Travellers (Income & Points)"),
      itens: [
        {
          href: "/viajante",
          icone: "🛡️",
          nome: L(idioma, "Painel do Viajante e Pontos", "Panel del Viajero y Puntos", "Traveller Dashboard & Points"),
          desc: L(idioma, "Veja seu nível, pontos acumulados e recompensas", "Tu nivel, puntos acumulados y recompensas", "Your level, points and unlocked rewards"),
        },
        {
          href: "/viajante/contribuir",
          icone: "⭐",
          nome: L(idioma, "Contribuir na Rota (+30 a +120 pts)", "Contribuir en la Ruta (+Puntos)", "Contribute on the Route (+Points)"),
          desc: L(idioma, "Foto de fachada, condição da estrada, internet, combustível e pernoite", "Foto, estado de ruta, internet, combustible y pernocte", "Photos, road conditions, internet, fuel and overnight stays"),
        },
        {
          href: "/viajante/questionario",
          icone: "📋",
          nome: L(idioma, "Questionário do Viajante (+150 pts)", "Cuestionario del Viajero (+150 pts)", "Traveller Questionnaire (+150 pts)"),
          desc: L(idioma, "Conte como você viaja e ganhe 150 pontos na hora", "Contanos cómo viajás y sumá 150 puntos al instante", "Tell us how you travel and earn 150 points instantly"),
        },
        {
          href: "/disponibilidade",
          icone: "🛠️",
          nome: L(idioma, "Oferecer Meu Serviço", "Ofrecer Mi Servicio", "Offer My Service"),
          desc: L(idioma, "Avise onde você está e o que sabe fazer (Pix direto)", "Avisá dónde estás y qué sabés hacer", "List where you are and what you do (direct Pix)"),
        },
        {
          href: "/viajante/indicar",
          icone: "🤝",
          nome: L(idioma, "Indicar Estabelecimento (50% Comissão)", "Recomendar Lugar (50% Comisión)", "Refer a Business (50% Commission)"),
          desc: L(idioma, "Ganhe comissão indicando pousadas, campings e negócios", "Ganar comisión recomendando negocios", "Earn commission referring local businesses"),
        },
      ],
    },
    {
      titulo: L(idioma, "Para Estabelecimentos e Negócios", "Para Establecimientos y Negocios", "For Local Businesses"),
      itens: [
        {
          href: "/refugio",
          icone: "🏨",
          nome: L(idioma, "Pedir Visita (Lugar para Dormir / Apoio)", "Pedir Visita (Dónde Dormir)", "Request Visit (Place to Sleep)"),
          desc: L(idioma, "Cadastre pousada, camping, hostel ou ponto de apoio na rota", "Registrá posada, camping, hostel o punto de apoyo", "Register your guesthouse, camping or support point"),
        },
        {
          href: "/cadastrar-servico",
          icone: "📢",
          nome: L(idioma, "Contratar ou Publicar Tarefa", "Contratar o Publicar Tarea", "Hire or Post a Task"),
          desc: L(idioma, "Encontre quem resolva fotos, vídeos, redes sociais, frete ou TI", "Encontrá quién haga fotos, redes, flete o sistemas", "Find someone for photos, social media, freight or tech"),
        },
        {
          href: "/parceiros/planos",
          icone: "🏅",
          nome: L(idioma, "Planos de Parceiro (Selo de Honra)", "Planes de Socio (Sello de Honor)", "Partner Plans (Honour Seal)"),
          desc: L(idioma, "Destaque Ouro, Prata e Bronze no mapa da rota", "Destaque Oro, Plata y Bronce en el mapa", "Gold, Silver and Bronze highlight on the map"),
        },
        {
          href: "/certificados",
          icone: "📜",
          nome: L(idioma, "Certificados e Registros de Visita", "Certificados y Registros", "Certificates & Visit Records"),
          desc: L(idioma, "Como funciona o QR Code impresso dos parceiros visitados", "Cómo funciona el QR impreso de socios visitados", "How the printed QR code for visited partners works"),
        },
      ],
    },
    {
      titulo: L(idioma, "Conteúdo e Conta", "Contenido y Cuenta", "Content & Account"),
      itens: [
        {
          href: "/como-funciona",
          icone: "❓",
          nome: L(idioma, "Como Funciona o JobPago", "Cómo Funciona JobPago", "How JobPago Works"),
          desc: L(idioma, "Guia rápido para viajantes e negócios locais", "Guía rápida para viajeros y negocios", "Quick guide for travellers and businesses"),
        },
        {
          href: "/noticias-estrada",
          icone: "📰",
          nome: L(idioma, "Notícias da Rota", "Noticias de la Ruta", "Route News"),
          desc: L(idioma, "Atualizações sobre estradas, litoral e trabalho remoto", "Actualizaciones sobre rutas y trabajo remoto", "Updates on roads, coast and remote work"),
        },
        {
          href: "/blog",
          icone: "📖",
          nome: L(idioma, "Blog da Expedição", "Blog de la Expedición", "Expedition Blog"),
          desc: L(idioma, "Artigos e relatos da jornada Fortaleza → Paraty", "Artículos y relatos del viaje", "Articles and stories from the journey"),
        },
        {
          href: "/entrar",
          icone: "🔐",
          nome: L(idioma, "Entrar / Criar Conta", "Ingresar / Crear Cuenta", "Sign In / Create Account"),
          desc: L(idioma, "Acesse seu perfil para guardar pontos e contribuições", "Accedé a tu perfil para guardar puntos", "Access your profile to save points and contributions"),
        },
      ],
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={L(idioma, "Abrir menu completo e mapas", "Abrir menú completo y mapas", "Open full menu and maps")}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-amber-400/50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black text-white active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
      >
        <span className="text-amber-400 text-sm leading-none">☰</span>
        <span className="hidden xs:inline sm:inline">{L(idioma, "Menu & Mapas", "Menú y Mapas", "Menu & Maps")}</span>
        <span className="xs:hidden sm:hidden">{L(idioma, "Menu", "Menú", "Menu")}</span>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[120] flex justify-end bg-black/80 backdrop-blur-md"
          onClick={() => setAberto(false)}
        >
          <div
            className="relative w-full max-w-md h-[100dvh] max-h-[100dvh] bg-[#07090e] border-l border-white/15 shadow-2xl overflow-y-auto overscroll-contain p-5 sm:p-6 pb-36 text-slate-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10 sticky top-0 bg-[#07090e]/95 backdrop-blur-xl z-10 pt-1">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  JobPago · {L(idioma, "Navegação Completa", "Navegación Completa", "Full Navigation")}
                </p>
                <h2 className="text-lg font-black text-white">
                  {L(idioma, "Mapas, Ferramentas e Painéis", "Mapas, Herramientas y Paneles", "Maps, Tools & Dashboards")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-base"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {secoes.map((secao) => (
                <div key={secao.titulo}>
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400/90 mb-2.5">
                    {secao.titulo}
                  </h3>
                  <div className="space-y-2">
                    {secao.itens.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAberto(false)}
                        className="flex items-start gap-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-amber-400/40 p-3 transition-all group"
                      >
                        <span className="text-xl shrink-0 mt-0.5">{item.icone}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {item.nome}
                          </p>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <span className="text-slate-500 group-hover:text-amber-400 text-xs font-bold self-center">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

