/**
 * Validação de e-mail client-safe para os formulários do JobPago.
 * Inclui:
 * 1. Sintaxe estrita (RFC 5322 simplificada)
 * 2. Correção de erros comuns de digitação em domínios populares (ex: @gmail.com.br, @gmai.com)
 * 3. Bloqueio de e-mails descartáveis / temporários
 */

const DOMINIOS_TIPOGRAFIA: Record<string, string> = {
  // Erros frequentes de Gmail
  "gmai.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaild.com": "gmail.com",
  "gmail.com.br": "gmail.com",
  "gmai.com.br": "gmail.com",
  "gamil.com.br": "gmail.com",
  "gmial.com.br": "gmail.com",
  "gmail.co": "gmail.com",
  // Erros frequentes de Hotmail / Outlook
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hormail.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com.br": "hotmail.com",
  "hotmai.com.br": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlock.com": "outlook.com",
  "outlook.com.br": "outlook.com",
  // Erros frequentes de Yahoo
  "yaho.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahoo.com.b": "yahoo.com.br",
  "yaho.com.br": "yahoo.com.br",
  // iCloud
  "icould.com": "icloud.com",
  "iclud.com": "icloud.com",
};

const DOMINIOS_DESCARTAVEIS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "yopmail.com",
  "dispostable.com",
  "trashmail.com",
  "sharklasers.com",
  "getairmail.com",
  "burnermail.io",
  "mohmal.com",
  "fakeinbox.com",
  "temp-mail.org",
  "crazymailing.com",
]);

export interface ResultadoValidacaoEmail {
  valido: boolean;
  erro?: string;
  sugestao?: string;
  emailLimpo: string;
}

/**
 * Validação de sintaxe e regras de domínio no cliente ou servidor.
 */
export function validarSintaxeEmail(emailBruto: string, idioma = "pt"): ResultadoValidacaoEmail {
  const emailLimpo = String(emailBruto ?? "").trim().toLowerCase();

  if (!emailLimpo) {
    return { valido: false, erro: msgIdioma(idioma, "E-mail não informado.", "E-mail no ingresado.", "E-mail not provided."), emailLimpo: "" };
  }

  if (emailLimpo.length > 254) {
    return { valido: false, erro: msgIdioma(idioma, "E-mail muito longo.", "E-mail demasiado largo.", "E-mail too long."), emailLimpo };
  }

  const partes = emailLimpo.split("@");
  if (partes.length !== 2) {
    return { valido: false, erro: msgIdioma(idioma, "E-mail precisa conter um único '@'.", "El e-mail debe contener un solo '@'.", "E-mail must contain a single '@'."), emailLimpo };
  }

  const [usuario, dominio] = partes;

  if (!usuario || usuario.length > 64) {
    return { valido: false, erro: msgIdioma(idioma, "Parte inicial do e-mail inválida.", "Parte inicial del e-mail inválida.", "Invalid local part of e-mail."), emailLimpo };
  }

  if (!dominio || !dominio.includes(".") || dominio.startsWith(".") || dominio.endsWith(".")) {
    return { valido: false, erro: msgIdioma(idioma, "Domínio do e-mail inválido.", "Dominio del e-mail inválido.", "Invalid e-mail domain."), emailLimpo };
  }

  // Regex geral para caracteres válidos
  const regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
  if (!regex.test(emailLimpo)) {
    return { valido: false, erro: msgIdioma(idioma, "Formato de e-mail inválido.", "Formato de e-mail inválido.", "Invalid e-mail format."), emailLimpo };
  }

  // Bloqueio de e-mails descartáveis
  if (DOMINIOS_DESCARTAVEIS.has(dominio)) {
    return {
      valido: false,
      erro: msgIdioma(idioma, "Por favor, use um e-mail permanente (e-mails temporários não são aceitos).", "Por favor, usá un e-mail permanente (no se aceptan e-mails temporales).", "Please use a permanent e-mail (temporary e-mails are not accepted)."),
      emailLimpo,
    };
  }

  // Verificação de erro comum de digitação
  if (DOMINIOS_TIPOGRAFIA[dominio]) {
    const dominioSugerido = DOMINIOS_TIPOGRAFIA[dominio];
    const sugestao = `${usuario}@${dominioSugerido}`;
    return {
      valido: false,
      sugestao,
      erro: msgIdioma(
        idioma,
        `O domínio @${dominio} parece incorreto. Você quis dizer ${sugestao}?`,
        `El dominio @${dominio} parece incorrecto. ¿Quisiste decir ${sugestao}?`,
        `The domain @${dominio} looks misspelled. Did you mean ${sugestao}?`
      ),
      emailLimpo,
    };
  }

  return { valido: true, emailLimpo };
}

function msgIdioma(idioma: string, pt: string, es: string, en: string): string {
  if (idioma === "es") return es;
  if (idioma === "en") return en;
  return pt;
}
