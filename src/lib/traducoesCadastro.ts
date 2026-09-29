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
