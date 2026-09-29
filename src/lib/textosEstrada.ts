/* Textos do viajante (painel, contribuições e questionário) em português,
   espanhol e inglês — pedido do Allan em 29/09 (amiga argentina viajando pelo
   Brasil; mochileiros do Mercosul, Europa e EUA). O resto do site segue em PT. */

export type Idioma = "pt" | "es" | "en";
export const IDIOMAS: [Idioma, string][] = [["pt", "Português"], ["es", "Español"], ["en", "English"]];
export const idiomaValido = (v: unknown): Idioma => (v === "es" || v === "en" ? v : "pt");

type Opcao = [string, Record<Idioma, string>];
export interface Pergunta {
  id: string;
  tipo: "uma" | "varias" | "texto" | "escala";
  titulo: Record<Idioma, string>;
  opcoes?: Opcao[];
}

const o = (id: string, pt: string, es: string, en: string): Opcao => [id, { pt, es, en }];
const t = (pt: string, es: string, en: string) => ({ pt, es, en });

/* Questionário do viajante: pesquisa de produto + porta de entrada. Conta pontos
   uma vez só. Perguntas sobre dificuldades vêm do que a JobPago pode resolver
   (onde dormir, internet, Pix, trabalho remoto, segurança). */
export const QUESTIONARIO: Pergunta[] = [
  { id: "pais", tipo: "texto", titulo: t("De que país você é?", "¿De qué país eres?", "Where are you from?") },
  { id: "como", tipo: "varias", titulo: t("Como você viaja pelo Brasil?", "¿Cómo viajas por Brasil?", "How do you travel around Brazil?"), opcoes: [
    o("pe", "A pé", "A pie", "On foot"), o("bike", "Bicicleta", "Bicicleta", "Bicycle"), o("moto", "Moto", "Moto", "Motorcycle"),
    o("carro", "Carro", "Auto", "Car"), o("van", "Van ou motorhome", "Van o motorhome", "Van or motorhome"),
    o("onibus", "Ônibus", "Ómnibus / colectivo", "Bus"), o("carona", "Carona", "A dedo", "Hitchhiking"), o("caminhao", "Caminhão", "Camión", "Truck"),
  ] },
  { id: "tempo", tipo: "uma", titulo: t("Há quanto tempo está na estrada?", "¿Hace cuánto estás en la ruta?", "How long have you been on the road?"), opcoes: [
    o("sem", "Menos de 1 semana", "Menos de 1 semana", "Less than a week"), o("mes", "Até 1 mês", "Hasta 1 mes", "Up to a month"),
    o("6m", "1 a 6 meses", "1 a 6 meses", "1 to 6 months"), o("mais", "Mais de 6 meses", "Más de 6 meses", "More than 6 months"),
  ] },
  { id: "orcamento", tipo: "uma", titulo: t("Quanto gasta por dia, em média?", "¿Cuánto gastas por día, en promedio?", "How much do you spend per day, on average?"), opcoes: [
    o("50", "Até R$ 50", "Hasta R$ 50", "Up to R$ 50"), o("100", "R$ 50 a 100", "R$ 50 a 100", "R$ 50 to 100"),
    o("200", "R$ 100 a 200", "R$ 100 a 200", "R$ 100 to 200"), o("mais", "Mais de R$ 200", "Más de R$ 200", "Over R$ 200"),
  ] },
  { id: "dificuldades", tipo: "varias", titulo: t("O que mais dificulta a sua viagem?", "¿Qué es lo que más te complica el viaje?", "What makes your trip hardest?"), opcoes: [
    o("dormir", "Achar onde dormir com segurança", "Encontrar dónde dormir seguro", "Finding a safe place to sleep"),
    o("pix", "Pagar sem Pix ou sem CPF", "Pagar sin Pix o sin CPF", "Paying without Pix or a CPF"),
    o("chip", "Chip de celular e internet", "Chip de celular e internet", "SIM card and internet"),
    o("cambio", "Câmbio e dinheiro", "Cambio y efectivo", "Currency exchange and cash"),
    o("idioma", "Idioma", "Idioma", "Language"),
    o("seguranca", "Segurança na estrada", "Seguridad en la ruta", "Safety on the road"),
    o("transporte", "Transporte entre cidades", "Transporte entre ciudades", "Getting between cities"),
    o("banho", "Banho, água e banheiro", "Ducha, agua y baño", "Showers, water and toilets"),
    o("saude", "Saúde e farmácia", "Salud y farmacia", "Health and pharmacies"),
    o("renda", "Ganhar dinheiro viajando", "Ganar dinero viajando", "Earning money while travelling"),
    o("info", "Informação confiável sobre lugares", "Información confiable sobre lugares", "Reliable information about places"),
  ] },
  { id: "pior", tipo: "texto", titulo: t("Conte a situação mais difícil que você passou até agora.", "Contanos la situación más difícil que viviste hasta ahora.", "Tell us about the hardest situation you've faced so far.") },
  { id: "renda", tipo: "uma", titulo: t("Você trabalha enquanto viaja?", "¿Trabajás mientras viajás?", "Do you work while travelling?"), opcoes: [
    o("remoto", "Sim, remoto (online)", "Sí, remoto (online)", "Yes, remotely (online)"),
    o("local", "Sim, bicos nas cidades", "Sí, changas en las ciudades", "Yes, odd jobs in towns"),
    o("quero", "Não, mas gostaria", "No, pero me gustaría", "No, but I'd like to"),
    o("nao", "Não", "No", "No"),
  ] },
  { id: "habilidades", tipo: "texto", titulo: t("O que você sabe fazer que um negócio pagaria? (fotos, redes sociais, idiomas, reparos…)", "¿Qué sabés hacer que un negocio pagaría? (fotos, redes, idiomas, arreglos…)", "What can you do that a business would pay for? (photos, social media, languages, repairs…)") },
  { id: "pagaria", tipo: "varias", titulo: t("Pelo que você pagaria um pouco se existisse?", "¿Por qué pagarías algo si existiera?", "What would you pay a little for, if it existed?"), opcoes: [
    o("refugios", "Lista de onde dormir verificada", "Lista verificada de dónde dormir", "A verified list of where to sleep"),
    o("combustivel", "Preço de combustível atualizado", "Precio de combustible actualizado", "Up-to-date fuel prices"),
    o("estrada", "Condição da estrada e acostamento", "Estado de la ruta y banquina", "Road and shoulder conditions"),
    o("sinal", "Mapa de sinal de celular", "Mapa de señal de celular", "Mobile signal map"),
    o("tarefas", "Acesso a trabalhos pagos no caminho", "Acceso a trabajos pagos en el camino", "Access to paid gigs along the way"),
    o("nada", "Nada, só usaria grátis", "Nada, solo lo usaría gratis", "Nothing, I'd only use it for free"),
  ] },
  { id: "confianca", tipo: "escala", titulo: t("De 1 a 5, quanto você confia nas informações que acha hoje sobre lugares na estrada?", "Del 1 al 5, ¿cuánto confiás en la información que encontrás hoy sobre lugares en la ruta?", "From 1 to 5, how much do you trust the information you find today about places on the road?") },
  { id: "redes", tipo: "texto", titulo: t("Seu perfil nas redes (opcional)", "Tu perfil en redes (opcional)", "Your social media profile (optional)") },
];

export const TXT = {
  pt: {
    painel: "Seu painel na estrada", nivel: "Nível", pontos: "pontos", proximo: "para o próximo nível",
    contribuir: "Contribuir", questionario: "Questionário do viajante", entrar: "Entrar para pontuar",
    pendente: "aguardando confirmação", confirmada: "confirmada", recusada: "recusada",
    avisoGps: "Vamos pedir a localização do seu celular para confirmar que a foto é do lugar. Ela só é usada para isso e fica guardada junto da contribuição.",
    permitirGps: "Permitir localização e tirar a foto", semGps: "Sem a localização não dá para confirmar o lugar. Ative a localização do navegador e tente de novo.",
    enviar: "Enviar", enviado: "Recebido! Os pontos entram assim que a contribuição for confirmada.", obrigado: "Obrigado!",
    questionarioFeito: "Questionário respondido — seus pontos já entraram.",
  },
  es: {
    painel: "Tu panel en la ruta", nivel: "Nivel", pontos: "puntos", proximo: "para el próximo nivel",
    contribuir: "Contribuir", questionario: "Cuestionario del viajero", entrar: "Entrá para sumar puntos",
    pendente: "esperando confirmación", confirmada: "confirmada", recusada: "rechazada",
    avisoGps: "Vamos a pedir la ubicación de tu celular para confirmar que la foto es del lugar. Solo se usa para eso y queda guardada con la contribución.",
    permitirGps: "Permitir ubicación y sacar la foto", semGps: "Sin la ubicación no podemos confirmar el lugar. Activá la ubicación del navegador y probá de nuevo.",
    enviar: "Enviar", enviado: "¡Recibido! Los puntos se suman cuando la contribución sea confirmada.", obrigado: "¡Gracias!",
    questionarioFeito: "Cuestionario respondido — tus puntos ya se sumaron.",
  },
  en: {
    painel: "Your road dashboard", nivel: "Level", pontos: "points", proximo: "to the next level",
    contribuir: "Contribute", questionario: "Traveller questionnaire", entrar: "Sign in to earn points",
    pendente: "awaiting confirmation", confirmada: "confirmed", recusada: "rejected",
    avisoGps: "We'll ask for your phone's location to confirm the photo was taken at the place. It's only used for that and is stored with your contribution.",
    permitirGps: "Allow location and take the photo", semGps: "Without your location we can't confirm the place. Turn on location in your browser and try again.",
    enviar: "Send", enviado: "Received! Points are added once the contribution is confirmed.", obrigado: "Thank you!",
    questionarioFeito: "Questionnaire answered — your points are in.",
  },
} as const;

/* Tipos de contribuição com rótulo e descrição nos três idiomas. */
export const CONTRIBUICOES: { id: "fachada" | "dormi_aqui" | "internet" | "combustivel" | "estrada" | "indicar_lugar"; nome: Record<Idioma, string>; desc: Record<Idioma, string> }[] = [
  { id: "fachada", nome: t("Foto da fachada", "Foto de la fachada", "Storefront photo"), desc: t("Tirada na hora, com a localização do celular.", "Sacada en el momento, con la ubicación del celular.", "Taken on the spot, with your phone's location.") },
  { id: "dormi_aqui", nome: t("Dormi aqui", "Dormí acá", "I slept here"), desc: t("Banho, tomada, segurança e quanto custou a noite.", "Ducha, enchufe, seguridad y cuánto costó la noche.", "Shower, power, safety and what the night cost.") },
  { id: "internet", nome: t("Internet do lugar", "Internet del lugar", "Internet speed here"), desc: t("Teste de velocidade no próprio site.", "Test de velocidad en el mismo sitio.", "Speed test right here.") },
  { id: "combustivel", nome: t("Preço do combustível", "Precio del combustible", "Fuel price"), desc: t("Posto, tipo e preço da bomba.", "Estación, tipo y precio en el surtidor.", "Station, fuel type and pump price.") },
  { id: "estrada", nome: t("Condição da estrada", "Estado de la ruta", "Road condition"), desc: t("Acostamento, obra, perigo, pedágio pago, sinal de celular.", "Banquina, obra, peligro, peaje pagado, señal de celular.", "Shoulder, roadworks, danger, toll paid, mobile signal.") },
  { id: "indicar_lugar", nome: t("Indicar um lugar", "Recomendar un lugar", "Recommend a place"), desc: t("Um lugar bom para dormir ou parar que ainda não está no mapa.", "Un buen lugar para dormir o parar que aún no está en el mapa.", "A good place to sleep or stop that isn't on the map yet.") },
];
