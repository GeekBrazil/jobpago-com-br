/**
 * Verificação de e-mail no lado do servidor (Node.js runtime).
 * Consulta registros DNS MX para verificar se o domínio de destino possui servidores de correio ativos.
 */

import dns from "dns";
import { validarSintaxeEmail } from "./validacaoEmail";

export async function verificarDominioMxServidor(
  email: string,
  idioma = "pt"
): Promise<{ valido: boolean; erro?: string; emailLimpo: string }> {
  const sintaxe = validarSintaxeEmail(email, idioma);
  if (!sintaxe.valido) {
    return { valido: false, erro: sintaxe.erro, emailLimpo: sintaxe.emailLimpo };
  }

  const dominio = sintaxe.emailLimpo.split("@")[1];

  try {
    const dnsPromises = dns.promises;

    // Timeout de 2,5 segundos para não prender a resposta
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 2500);
    });

    const mxPromise = dnsPromises.resolveMx(dominio);
    const mxRecords = await Promise.race([mxPromise, timeoutPromise]);

    if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
      // Tenta fallback com registro A
      const aRecords = await dnsPromises.resolve4(dominio).catch(() => []);
      if (!aRecords || aRecords.length === 0) {
        return {
          valido: false,
          erro: msgIdioma(
            idioma,
            `O domínio ${dominio} não possui servidores de e-mail ativos. Verifique se digitou corretamente.`,
            `El dominio ${dominio} no tiene servidores de e-mail activos. Verificá si lo escribiste bien.`,
            `The domain ${dominio} has no active mail servers. Check if you spelled it correctly.`
          ),
          emailLimpo: sintaxe.emailLimpo,
        };
      }
    } else {
      // Checa se não é Null MX (RFC 7505, onde exchange é vazio)
      const temExchangeValido = mxRecords.some((r) => r.exchange && r.exchange.trim().length > 0);
      if (!temExchangeValido) {
        return {
          valido: false,
          erro: msgIdioma(
            idioma,
            `O domínio ${dominio} não aceita recebimento de e-mails. Verifique o endereço digitado.`,
            `El dominio ${dominio} no acepta recepción de e-mails. Verificá la dirección ingresada.`,
            `The domain ${dominio} does not accept incoming emails. Please check the address.`
          ),
          emailLimpo: sintaxe.emailLimpo,
        };
      }
    }

    return { valido: true, emailLimpo: sintaxe.emailLimpo };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const msgErr = (err as Error)?.message;

    if (code === "ENOTFOUND" || code === "ENODATA") {
      return {
        valido: false,
        erro: msgIdioma(
          idioma,
          `O domínio @${dominio} não existe. Verifique se digitou o e-mail corretamente.`,
          `El dominio @${dominio} no existe. Verificá si lo escribiste bien.`,
          `The domain @${dominio} does not exist. Check if you spelled it correctly.`
        ),
        emailLimpo: sintaxe.emailLimpo,
      };
    }

    if (msgErr === "DNS_TIMEOUT") {
      console.warn(`[validacaoEmail] Timeout ao consultar MX para ${dominio}. Liberando por sintaxe.`);
      return { valido: true, emailLimpo: sintaxe.emailLimpo };
    }

    console.warn(`[validacaoEmail] Aviso ao verificar MX de ${dominio}:`, err);
    return { valido: true, emailLimpo: sintaxe.emailLimpo };
  }
}

function msgIdioma(idioma: string, pt: string, es: string, en: string): string {
  if (idioma === "es") return es;
  if (idioma === "en") return en;
  return pt;
}

