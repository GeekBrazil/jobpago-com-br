import { enviarEmail } from "@/lib/email";
import fs from "fs";

interface NotificacaoLeadParams {
  formulario: string;
  nome: string;
  whatsapp: string;
  email?: string;
  cidade?: string;
  uf?: string;
  tipo?: string;
  detalhes?: string;
}

const ALLAN_CHAT_ID = "1614462939";
const ALLAN_EMAIL = "candidoallan@gmail.com";

function getTelegramToken(): string | null {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  try {
    const tokenPath = "/home/allan/.config/executivoai-bot/telegram_token";
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf-8").trim();
    }
  } catch {}
  return "8565442825:AAFcjJ-uRzBv2o5v9iK0jXQ9Y4g0JqD0q8U"; // Token do bot ExecutivoAI
}

export async function notificarAdminNovoCadastro(params: NotificacaoLeadParams): Promise<void> {
  const { formulario, nome, whatsapp, email, cidade, uf, tipo, detalhes } = params;

  const localizacao = cidade ? `${cidade}${uf ? " - " + uf : ""}` : "Não informada";
  const zapLimpo = whatsapp.replace(/\D/g, "");
  const zapLink = zapLimpo ? `https://wa.me/55${zapLimpo}` : null;

  // 1. Notificação via Telegram (@ExecutivoAiBot)
  const token = getTelegramToken();
  if (token) {
    let msgTelegram = `🚨 *NOVO CADASTRO NO JOBPAGO*\n\n`;
    msgTelegram += `📋 *Formulário:* \`${formulario.toUpperCase()}\`\n`;
    msgTelegram += `👤 *Nome:* ${nome}\n`;
    msgTelegram += `📱 *WhatsApp:* [${whatsapp}](${zapLink || "#"})\n`;
    if (email) msgTelegram += `📧 *E-mail:* ${email}\n`;
    msgTelegram += `📍 *Local:* ${localizacao}\n`;
    if (tipo) msgTelegram += `🏷️ *Tipo / Categoria:* ${tipo}\n`;
    if (detalhes) msgTelegram += `💬 *Detalhes:* _${detalhes.slice(0, 300)}_\n`;
    msgTelegram += `\n⏰ _Recebido em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}_`;

    try {
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ALLAN_CHAT_ID,
          text: msgTelegram,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }).catch((e) => console.error("[notificacaoAdmin:telegram] Erro:", e));
    } catch (e) {
      console.error("[notificacaoAdmin:telegram] Falha:", e);
    }
  }

  // 2. Notificação via E-mail para candidoallan@gmail.com
  const assuntoEmail = `[JobPago Lead] ${formulario}: ${nome} (${localizacao})`;
  const htmlEmail = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #07090e; color: #f8fafc; border-radius: 12px; border: 1px solid rgba(245,158,11,0.3);">
      <h2 style="color: #f59e0b; margin-top: 0;">Novo Cadastro no JobPago</h2>
      <p style="background: rgba(245,158,11,0.1); padding: 8px 12px; border-radius: 6px; font-weight: bold; color: #fbbf24;">
        Formulário: ${formulario}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">Nome:</td><td style="color: #fff; font-weight: bold;">${nome}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">WhatsApp:</td><td><a href="${zapLink || '#'}" style="color: #38bdf8; font-weight: bold;">${whatsapp}</a></td></tr>
        ${email ? `<tr><td style="padding: 8px 0; color: #94a3b8;">E-mail:</td><td style="color: #fff;">${email}</td></tr>` : ""}
        <tr><td style="padding: 8px 0; color: #94a3b8;">Local:</td><td style="color: #fff;">${localizacao}</td></tr>
        ${tipo ? `<tr><td style="padding: 8px 0; color: #94a3b8;">Categoria:</td><td style="color: #fff;">${tipo}</td></tr>` : ""}
        ${detalhes ? `<tr><td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">Detalhes:</td><td style="color: #cbd5e1; line-height: 1.5;">${detalhes}</td></tr>` : ""}
      </table>
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #64748b;">
        JobPago · Sistema Automático de Notificações
      </div>
    </div>
  `;

  enviarEmail(ALLAN_EMAIL, assuntoEmail, htmlEmail, undefined, { de: "JobPago Alertas <avisos@allancandido.com>" }).catch((err) =>
    console.error("[notificacaoAdmin:email] Erro:", err)
  );
}

