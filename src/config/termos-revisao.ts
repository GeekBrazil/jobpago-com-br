/**
 * Termos que mandam um anúncio (serviço, tarefa ou cadastro de serviço) para
 * REVISÃO MANUAL antes de ir para o WhatsApp. Não rejeita nada sozinho: só
 * segura e avisa. Para mudar a lista, edite aqui — um termo por linha.
 *
 * A comparação ignora acento, maiúscula e trocas comuns de letra por número
 * (4→a, 3→e, 1→i, 0→o, 5→s), e só pega a palavra inteira: "programa" marca,
 * "programador" não.
 */
export const TERMOS_REVISAO: string[] = [
  // serviços sexuais / acompanhante
  "acompanhante",
  "programa",
  "gp",
  "garota de programa",
  "massagem sensual",
  "massagem tantrica",
  "massagem relaxante com final",
  "discreta",
  "discreto",
  "cache",
  "sugar",
  "sugar daddy",
  "sem compromisso",
  "encontro",
  "encontros",
  "sigilo",
  "local proprio",
  "com local",
  "fotos reais",
  "atendo em motel",
  "pernoite com",
  // sinais de menor de idade — prioridade máxima
  "novinha",
  "novinhas",
  "ninfeta",
  "aninhos",
  "menor de idade",
  "colegial",
  "18 aninhos",
];
