/* Traduções (espanhol e inglês) dos cadastros de Refúgio e de disponibilidade.
   O português segue vindo dos arquivos de dados (honra.ts, categorias.ts), que
   continuam sendo a fonte única — aqui só as outras línguas, pelo mesmo id. */
import type { Idioma } from "@/lib/textosEstrada";

type Tr = Record<string, { es: string; en: string }>;
const tr = (i: Idioma, pt: string, mapa: Tr, id: string) => (i === "pt" ? pt : mapa[id]?.[i] ?? pt);

const TIPOS: Tr = {
  camping: { es: "Camping", en: "Campsite" },
  hostel: { es: "Hostel", en: "Hostel" },
  pousada: { es: "Posada", en: "Guesthouse" },
  hotel: { es: "Hotel", en: "Hotel" },
  patio: { es: "Patio de estación / área para motorhome", en: "Gas station yard / motorhome area" },
};
const OFERECE: Tr = {
  seguro: { es: "Noche segura (portón, recepción o sereno)", en: "Safe night (gate, reception or night guard)" },
  banho: { es: "Ducha caliente", en: "Hot shower" },
  energia: { es: "Enchufe para celular y notebook", en: "Power for phone and laptop" },
  "220v": { es: "Toma 220V para motorhome y van", en: "220V hookup for motorhome and van" },
  internet: { es: "Internet", en: "Internet" },
  cozinha: { es: "Cocina o comida en el lugar", en: "Kitchen or meals on site" },
  agua: { es: "Agua potable / descarga para motorhome", en: "Drinking water / motorhome dump" },
};
const HONRA_NOME: Tr = {
  ouro: { es: "Honor Oro", en: "Gold Honour" },
  prata: { es: "Honor Plata", en: "Silver Honour" },
  bronze: { es: "Honor Bronce", en: "Bronze Honour" },
  verificado: { es: "Verificado", en: "Verified" },
};
const HONRA_COMO: Tr = {
  ouro: { es: "Dinero + canje", en: "Money + exchange" },
  prata: { es: "Dinero", en: "Money" },
  bronze: { es: "Canje", en: "Exchange" },
  verificado: { es: "Solo la visita", en: "Visit only" },
};
const HONRA_DESC: Tr = {
  ouro: { es: "Contrata un plan de socio y además recibe a la expedición: noche, comida o estructura.", en: "Takes a partner plan and also hosts the expedition: a night, a meal or facilities." },
  prata: { es: "Contrata un plan de socio (Local, Regional o Master).", en: "Takes a partner plan (Local, Regional or Master)." },
  bronze: { es: "Recibe a la expedición a cambio de visibilidad: una noche, una comida o la estructura para grabar.", en: "Hosts the expedition in exchange for visibility: a night, a meal or a place to film." },
  verificado: { es: "Fue visitado y pasó los criterios, sin contrapartida.", en: "Was visited and met the criteria, with nothing in return." },
};
const HONRA_GANHA: Tr = {
  ouro: { es: "Primero en la lista de la ciudad y en el mapa, con medalla de oro, y mención en todo el contenido grabado en el tramo.", en: "First in the town list and on the map, with the gold medal, and a mention in all content filmed on that stretch." },
  prata: { es: "Aparece antes que los solo verificados, con medalla de plata, y mención cuando pase la expedición.", en: "Listed above verified-only places, with the silver medal, and a mention when the expedition passes." },
  bronze: { es: "Medalla de bronce en el sello y mención en redes durante el paso.", en: "Bronze medal on the seal and a social media mention during the visit." },
  verificado: { es: "Sello de verificado con la fecha de la visita, en el mapa y en la lista.", en: "Verified seal with the visit date, on the map and in the list." },
};
const CATEGORIA: Tr = {
  vanlife: { es: "Nómade e infraestructura", en: "Nomad & infrastructure" },
  estrada: { es: "Ruta y cargas", en: "Road & freight" },
  devs: { es: "Tecnología e IT", en: "Tech & IT" },
  transporte: { es: "Transporte y fletes", en: "Transport & moving" },
  foto: { es: "Video y contenido", en: "Video & content" },
  aulas: { es: "Clases y consultoría", en: "Lessons & consulting" },
  design: { es: "Diseño y medios", en: "Design & media" },
};

export const tTipo = (i: Idioma, id: string, pt: string) => tr(i, pt, TIPOS, id);
export const tOferece = (i: Idioma, id: string, pt: string) => tr(i, pt, OFERECE, id);
export const tHonra = (i: Idioma, id: string, campo: "nome" | "como" | "desc" | "ganha", pt: string) =>
  tr(i, pt, { nome: HONRA_NOME, como: HONRA_COMO, desc: HONRA_DESC, ganha: HONRA_GANHA }[campo], id);
export const tCategoria = (i: Idioma, id: string, pt: string) => tr(i, pt, CATEGORIA, id);

/** Mensagem das rotas no idioma pedido (as APIs recebem `idioma` no corpo). */
export const msg = (idioma: unknown, pt: string, es: string, en: string) => (idioma === "es" ? es : idioma === "en" ? en : pt);

/* Setores (seções CNAE) do Novo CAGED, pelo código da seção. */
const SECOES: Tr = {
  A: { es: "Agropecuaria", en: "Farming" }, B: { es: "Industrias extractivas", en: "Mining" }, C: { es: "Industria manufacturera", en: "Manufacturing" },
  D: { es: "Electricidad y gas", en: "Electricity and gas" }, E: { es: "Agua y saneamiento", en: "Water and sanitation" }, F: { es: "Construcción", en: "Construction" },
  G: { es: "Comercio", en: "Retail and trade" }, H: { es: "Transporte y almacenamiento", en: "Transport and storage" }, I: { es: "Alojamiento y gastronomía", en: "Accommodation and food" },
  J: { es: "Información y comunicación", en: "Information and communication" }, K: { es: "Finanzas y seguros", en: "Finance and insurance" }, L: { es: "Actividades inmobiliarias", en: "Real estate" },
  M: { es: "Actividades profesionales", en: "Professional services" }, N: { es: "Servicios administrativos", en: "Administrative services" }, O: { es: "Administración pública", en: "Public administration" },
  P: { es: "Educación", en: "Education" }, Q: { es: "Salud y servicios sociales", en: "Health and social care" }, R: { es: "Artes y recreación", en: "Arts and recreation" },
  S: { es: "Otros servicios", en: "Other services" }, T: { es: "Servicio doméstico", en: "Domestic work" }, U: { es: "Organismos internacionales", en: "International bodies" },
};
export const tSecao = (i: Idioma, secao: string, pt: string) => tr(i, pt, SECOES, secao);

/* Meses abreviados para "ago/2025". */
const MESES_ABREV: Record<Idioma, string[]> = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
export const competenciaEm = (i: Idioma, c: number) => `${MESES_ABREV[i][(c % 100) - 1]}/${Math.floor(c / 100)}`;

/* Setores do mapa de empresas (radar CNPJ): nome e "costuma precisar de". */
const SETOR_NOME: Tr = {
  transporte_frete: { es: "Transporte y fletes", en: "Transport & freight" }, restaurante: { es: "Restaurantes", en: "Restaurants" },
  loja_roupas: { es: "Tiendas de ropa", en: "Clothing shops" }, salao_beleza: { es: "Salones de belleza", en: "Beauty salons" },
  padaria: { es: "Panaderías", en: "Bakeries" }, mercado_mercearia: { es: "Almacenes y mercados", en: "Grocery stores" },
  oficina_mecanica: { es: "Talleres mecánicos", en: "Mechanics" }, agropecuaria: { es: "Agropecuaria", en: "Farming" },
  bar: { es: "Bares", en: "Bars" }, imobiliaria: { es: "Inmobiliarias", en: "Real estate agencies" },
  turismo_passeio: { es: "Turismo y paseos", en: "Tours & tourism" }, artesanato: { es: "Artesanías", en: "Crafts" },
  camping_estacionamento: { es: "Campings y estacionamientos", en: "Campsites & parking" }, pousada: { es: "Posadas", en: "Guesthouses" },
  posto_combustivel: { es: "Estaciones de servicio", en: "Gas stations" },
};
const SETOR_TAREFAS: Tr = {
  transporte_frete: { es: "cotización de flete, ruta, atención por WhatsApp", en: "freight quotes, routing, WhatsApp customer service" },
  restaurante: { es: "menú digital, fotos de los platos, perfil en Google", en: "digital menu, food photos, Google profile" },
  loja_roupas: { es: "fotos de producto, Instagram, catálogo en WhatsApp", en: "product photos, Instagram, WhatsApp catalogue" },
  salao_beleza: { es: "agenda online, antes y después, Instagram", en: "online booking, before-and-after shots, Instagram" },
  padaria: { es: "pedidos por WhatsApp, perfil en Google", en: "WhatsApp orders, Google profile" },
  mercado_mercearia: { es: "lista de ofertas, delivery, catálogo", en: "offers list, delivery, catalogue" },
  oficina_mecanica: { es: "presupuesto por foto, Google Maps, reseñas", en: "quotes from photos, Google Maps, reviews" },
  agropecuaria: { es: "venta directa, logística, difusión regional", en: "direct sales, logistics, regional promotion" },
  bar: { es: "agenda de eventos, Instagram, carta", en: "events calendar, Instagram, menu" },
  imobiliaria: { es: "fotos y video de propiedades, anuncios, atención", en: "property photos and video, listings, customer service" },
  turismo_passeio: { es: "reservas, videos cortos, reseñas", en: "bookings, short videos, reviews" },
  artesanato: { es: "tienda online, fotos, envíos", en: "online shop, photos, shipping" },
  camping_estacionamento: { es: "reservas, mapa, reseñas de viajeros", en: "bookings, map, traveller reviews" },
  pousada: { es: "Booking y Google, fotos, respuesta rápida al huésped", en: "Booking and Google, photos, fast replies to guests" },
  posto_combustivel: { es: "perfil en Google, reseñas, tienda en Instagram", en: "Google profile, reviews, convenience store on Instagram" },
};
export const tSetor = (i: Idioma, id: string, pt: string) => tr(i, pt, SETOR_NOME, id);
export const tTarefas = (i: Idioma, id: string, pt: string) => tr(i, pt, SETOR_TAREFAS, id);

/* Planos de parceiro (planos-parceiro.ts), pelo id do plano. */
type TrPlano = { nome: string; valor: string | null; resumo: string; entregaveis: string[] };
const PLANOS_TR: Record<string, { es: TrPlano; en: TrPlano }> = {
  permuta: {
    es: { nome: "Canje", valor: "R$ 0 en dinero", resumo: "Vos ofrecés estructura, yo ofrezco visibilidad. Ninguno pone plata.",
      entregaveis: ["Sello JobPago Verificado, con la fecha de la visita", "Minisitio básico en el mapa de la red", "Mención en redes durante el paso por el tramo"] },
    en: { nome: "Exchange", valor: "R$ 0 in cash", resumo: "You offer facilities, I offer visibility. Neither of us pays.",
      entregaveis: ["JobPago Verified seal, with the visit date", "Basic mini-site on the network map", "Social media mention while passing through"] },
  },
  local: {
    es: { nome: "Socio Local", valor: "R$ 180 a 450 (pago único) o R$ 49/mes", resumo: "Para quien quiere que lo vea quien está en la ruta ahora, no solo quien ya lo conoce.",
      entregaveis: ["Minisitio completo, con fotos, etiquetas de infraestructura y contacto directo", "Optimización de tu perfil en Google Maps", "Un video o reel colaborativo, grabado en el lugar", "Sello JobPago Verificado, con la fecha de la visita"] },
    en: { nome: "Local Partner", valor: "R$ 180 to 450 (one-off) or R$ 49/month", resumo: "For places that want to be seen by people on the road now, not just those who already know them.",
      entregaveis: ["Full mini-site with photos, facility tags and direct contact", "Google Maps profile optimisation", "One collaborative video or reel filmed on site", "JobPago Verified seal, with the visit date"] },
  },
  regional: {
    es: { nome: "Patrocinio Regional", valor: "R$ 600 a 1.500 por tramo o estado", resumo: "Tu marca asociada a un tramo entero de la ruta, no a un punto en el mapa.",
      entregaveis: ["Logo en los vivos y videos de ese estado", "Banner en la categoría regional del sitio", "Todo lo que incluye el Socio Local"] },
    en: { nome: "Regional Sponsorship", valor: "R$ 600 to 1,500 per stretch or state", resumo: "Your brand tied to a whole stretch of the route, not one point on the map.",
      entregaveis: ["Logo on that state's lives and videos", "Banner in the site's regional category", "Everything in Local Partner"] },
  },
  master: {
    es: { nome: "Master de la Expedición", valor: null, resumo: "Nombre oficial de la expedición y marca en toda la comunicación. Conversación, no paquete.",
      entregaveis: ["Nombre de la marca en el nombre de la expedición", "Presencia en toda la comunicación del recorrido", "Acceso a los planes de análisis de datos de allancandido.com", "Alcance y contrapartidas definidos caso a caso"] },
    en: { nome: "Expedition Master", valor: null, resumo: "Official naming of the expedition and your brand across all communication. A conversation, not a package.",
      entregaveis: ["Brand name in the expedition's name", "Presence across all route communication", "Access to allancandido.com's data analysis plans", "Scope and benefits agreed case by case"] },
  },
};
export function tPlano<P extends TrPlano & { id: string }>(i: Idioma, p: P): P {
  const t = i === "pt" ? null : PLANOS_TR[p.id]?.[i];
  return t ? { ...p, ...t } : p;
}

/* Faixas da régua de contribuição (apoiadores.ts), pelo id. */
const FAIXAS_TR: Record<string, { es: [string, string]; en: [string, string] }> = {
  apoiador: { es: ["Apoyo de la Ruta", "Nombre en la lista de apoyos de la Expedición"], en: ["Road Supporter", "Name on the Expedition supporters list"] },
  insignia: { es: ["Insignia de Apoyo", "Insignia digital + mención en Noticias de la Ruta"], en: ["Supporter Badge", "Digital badge + mention in Road News"] },
  honra: { es: ["Apoyo de Honor", "Insignia de Honor + publicación destacada con foto del tramo"], en: ["Honour Supporter", "Honour badge + featured post with a photo of the stretch"] },
  padrinho: { es: ["Padrino de la Expedición", "Todo lo de Apoyo de Honor + mención en video/reel del viaje"], en: ["Expedition Godparent", "Everything in Honour Supporter + mention in a trip video/reel"] },
};
export const tFaixa = (i: Idioma, id: string, campo: "insignia" | "recompensa", pt: string) =>
  i === "pt" ? pt : FAIXAS_TR[id]?.[i]?.[campo === "insignia" ? 0 : 1] ?? pt;

const CATEGORIA_DESC: Tr = {
  vanlife: { es: "Motorhomes, 220V y camping", en: "Motorhomes, 220V & camping" },
  estrada: { es: "Changarín, auxilio mecánico, flete de retorno y grúa", en: "Loaders, breakdown help, backhaul freight and towing" },
  devs: { es: "Full-stack, automatización e IA", en: "Full-stack, automation & AI" },
  transporte: { es: "Fletes y mudanzas", en: "Small moves & removals" },
  foto: { es: "Drone, edición y redes sociales", en: "Drone, editing & social media" },
  aulas: { es: "Mentorías y consultorías", en: "Mentoring & consulting" },
  design: { es: "Identidad visual y redes", en: "Visual identity & social" },
};
export const tCategoriaDesc = (i: Idioma, id: string, pt: string) => tr(i, pt, CATEGORIA_DESC, id);
