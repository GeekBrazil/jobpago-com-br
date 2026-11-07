/**
 * Módulo de e-mail do JobPago utilizando a API REST do Resend.
 * Suporta templates de boas-vindas para leads de prestadores, contratantes e cadastro de contas.
 * Redigido estritamente no padrão Humanizer: sem travessões, sem jargões inflados, tom direto e claro.
 */

export interface OpcoesEmail {
  de?: string;
  responderPara?: string;
  sair?: string;
}

const REMETENTE_PADRAO = "Allan Candido · JobPago <avisos@allancandido.com>";

export async function enviarEmail(
  para: string,
  assunto: string,
  html: string,
  texto?: string,
  op: OpcoesEmail = {}
): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  const de = op.de || process.env.EMAIL_FROM || REMETENTE_PADRAO;

  if (!chave) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email:dev] para=${para} assunto=${assunto}\n${texto ?? html}`);
    } else {
      console.error("[email] RESEND_API_KEY ausente: e-mail não enviado.");
    }
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: de,
        to: [para],
        subject: assunto,
        html,
        text: texto,
        ...(op.responderPara ? { reply_to: op.responderPara } : {}),
        ...(op.sair
          ? {
              headers: {
                "List-Unsubscribe": `<${op.sair}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const errTexto = await res.text();
      console.error("[email] Erro na API do Resend:", res.status, errTexto.slice(0, 200));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Falha ao despachar e-mail via Resend:", err);
    return false;
  }
}

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/**
 * Moldura visual limpa e responsiva do JobPago, compatível com clientes de e-mail modernos e legados.
 */
export function molduraJobPago(titulo: string, corpoHtml: string, rodapeHtml?: string): string {
  const rodape =
    rodapeHtml ||
    `JobPago · Plataforma de serviços e trabalho sob demanda sem intermediários.<br>
     Dúvidas ou suporte: WhatsApp (24) 99332-6966 · contato@allancandido.com`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f19;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5)">
          <!-- Cabeçalho -->
          <tr>
            <td style="background-color:#050814;padding:24px 32px;border-bottom:1px solid #1f2937">
              <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">
                JobPago<span style="color:#f59e0b">.</span>
              </span>
            </td>
          </tr>
          <!-- Conteúdo -->
          <tr>
            <td style="padding:32px;color:#cbd5e1;font-size:15px">
              <h1 style="font-size:22px;font-weight:800;color:#f8fafc;margin:0 0 20px 0;line-height:1.3">
                ${esc(titulo)}
              </h1>
              ${corpoHtml}
            </td>
          </tr>
          <!-- Rodapé -->
          <tr>
            <td style="padding:24px 32px;font-size:12px;color:#64748b;background-color:#090d16;border-top:1px solid #1e293b;line-height:1.5">
              ${rodape}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface DadosBoasVindasLead {
  tipo: "prestador" | "contratante";
  nome: string;
  email: string;
  whatsapp: string;
  tituloServico: string;
  categoria: string;
  modalidade: string;
  cidade?: string;
  valor?: number | string;
  isCortesia?: boolean;
  perfilBuscadoOuContratante?: string;
}

/**
 * Envia o e-mail de boas-vindas para o formulário de cadastro de serviço (/cadastrar-servico).
 * Adaptado para contratante ou prestador.
 */
export async function enviarEmailBoasVindasLead(dados: DadosBoasVindasLead): Promise<boolean> {
  const { tipo, nome, email, whatsapp, tituloServico, categoria, modalidade, cidade, valor, isCortesia, perfilBuscadoOuContratante } = dados;

  if (!email || !email.includes("@")) return false;

  const primeiroNome = (nome || "").split(" ")[0] || "Olá";

  if (tipo === "contratante") {
    const assunto = "Recebemos seu pedido de contratação na JobPago";
    const valorFormatado = isCortesia
      ? "Cortesia combinada"
      : valor
      ? `R$ ${Number(valor).toLocaleString("pt-BR")}`
      : "A combinar";

    const htmlCorpo = `
      <p style="margin:0 0 16px 0">Olá, <strong>${esc(primeiroNome)}</strong>.</p>
      <p style="margin:0 0 16px 0">
        Seu pedido de contratação foi registrado com sucesso na JobPago.
      </p>

      <div style="background-color:#0d1322;border:1px solid #1e293b;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px 0;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Resumo da solicitação</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Tarefa:</strong> ${esc(tituloServico)}</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Categoria:</strong> ${esc(categoria)}</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Modalidade:</strong> ${esc(modalidade)} ${cidade ? `(${esc(cidade)})` : ""}</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Perfil procurado:</strong> ${esc(perfilBuscadoOuContratante || "Profissionais da Rede")}</p>
        <p style="margin:0;color:#f8fafc"><strong>Orçamento estimado:</strong> ${esc(valorFormatado)}</p>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#f1f5f9;margin:24px 0 12px 0">Próximos passos</h2>
      <p style="margin:0 0 12px 0">
        1. Nossa equipe avalia os requisitos e localiza na rede o profissional mais alinhado à sua demanda.
      </p>
      <p style="margin:0 0 12px 0">
        2. Faremos a introdução direta pelo seu WhatsApp <strong>(${esc(whatsapp)})</strong> para vocês alinharem os detalhes finais.
      </p>
      <p style="margin:0 0 20px 0">
        3. O pagamento é acertado direto entre vocês via Pix, com zero taxa de intermediação. A JobPago não cobra comissão sobre o valor do serviço.
      </p>

      <p style="margin:24px 0 0 0;color:#94a3b8">
        Qualquer ajuste necessário no pedido, basta responder a este e-mail ou falar pelo WhatsApp (24) 99332-6966.<br><br>
        Atenciosamente,<br>
        <strong style="color:#f8fafc">Allan Candido</strong><br>
        JobPago
      </p>
    `;

    const textoPlano = `Olá, ${primeiroNome}.

Seu pedido de contratação foi registrado com sucesso na JobPago.

Resumo da solicitação:
- Tarefa: ${tituloServico}
- Categoria: ${categoria}
- Modalidade: ${modalidade} ${cidade ? `(${cidade})` : ""}
- Perfil procurado: ${perfilBuscadoOuContratante || "Profissionais da Rede"}
- Orçamento estimado: ${valorFormatado}

Próximos passos:
1. Nossa equipe avalia os requisitos e localiza na rede o profissional mais alinhado à sua demanda.
2. Faremos a introdução direta pelo seu WhatsApp (${whatsapp}) para vocês alinharem os detalhes finais.
3. O pagamento é acertado direto entre vocês via Pix, com zero taxa de intermediação. A JobPago não cobra comissão sobre o valor do serviço.

Qualquer ajuste necessário no pedido, basta responder a este e-mail ou falar pelo WhatsApp (24) 99332-6966.

Atenciosamente,
Allan Candido
JobPago`;

    return enviarEmail(email, assunto, molduraJobPago(assunto, htmlCorpo), textoPlano);
  } else {
    // Prestador
    const assunto = "Seu serviço foi cadastrado na JobPago";
    const valorFormatado = isCortesia
      ? "Cortesia combinada"
      : valor
      ? `R$ ${Number(valor).toLocaleString("pt-BR")}`
      : "A combinar";

    const htmlCorpo = `
      <p style="margin:0 0 16px 0">Olá, <strong>${esc(primeiroNome)}</strong>.</p>
      <p style="margin:0 0 16px 0">
        Seu serviço foi cadastrado com sucesso na JobPago.
      </p>

      <div style="background-color:#0d1322;border:1px solid #1e293b;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px 0;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Dados do serviço cadastrado</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Título do serviço:</strong> ${esc(tituloServico)}</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Área / Categoria:</strong> ${esc(categoria)}</p>
        <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Modalidade:</strong> ${esc(modalidade)} ${cidade ? `(${esc(cidade)})` : ""}</p>
        <p style="margin:0;color:#f8fafc"><strong>Valor base:</strong> ${esc(valorFormatado)}</p>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#f1f5f9;margin:24px 0 12px 0">Como você recebe trabalhos</h2>
      <p style="margin:0 0 12px 0">
        Na JobPago você não fica exposto em vitrine pública. Seus dados de contato ficam guardados com segurança.
      </p>
      <p style="margin:0 0 12px 0">
        Quando um contratante ou empresa da sua região (ou demanda remota) publicar uma tarefa que combina com o que você faz, nós entramos em contato direto pelo seu WhatsApp <strong>(${esc(whatsapp)})</strong>.
      </p>
      <p style="margin:0 0 20px 0">
        O pagamento é combinado diretamente entre vocês, via Pix, e 100% do valor vai para o seu bolso. Não cobramos comissão sobre o seu ganho.
      </p>

      <p style="margin:24px 0 0 0;color:#94a3b8">
        Para conferir valores de referência praticados para sua área, acesse:<br>
        <a href="https://jobpago.com.br/#renda-na-cidade" style="color:#f59e0b;text-decoration:underline">jobpago.com.br/#renda-na-cidade</a><br><br>
        Atenciosamente,<br>
        <strong style="color:#f8fafc">Allan Candido</strong><br>
        JobPago
      </p>
    `;

    const textoPlano = `Olá, ${primeiroNome}.

Seu serviço foi cadastrado com sucesso na JobPago.

Dados do serviço cadastrado:
- Título do serviço: ${tituloServico}
- Área / Categoria: ${categoria}
- Modalidade: ${modalidade} ${cidade ? `(${cidade})` : ""}
- Valor base: ${valorFormatado}

Como você recebe trabalhos:
Na JobPago você não fica exposto em vitrine pública. Seus dados de contato ficam guardados com segurança.
Quando um contratante ou empresa da sua região (ou demanda remota) publicar uma tarefa que combina com o que você faz, nós entramos em contato direto pelo seu WhatsApp (${whatsapp}).
O pagamento é combinado diretamente entre vocês, via Pix, e 100% do valor vai para o seu bolso. Não cobramos comissão sobre o seu ganho.

Para conferir valores de referência praticados para sua área, acesse:
https://jobpago.com.br/#renda-na-cidade

Atenciosamente,
Allan Candido
JobPago`;

    return enviarEmail(email, assunto, molduraJobPago(assunto, htmlCorpo), textoPlano);
  }
}

/**
 * Boas-vindas para o formulário /disponibilidade ("Quero renda").
 */
export async function enviarEmailBoasVindasDisponibilidade(dados: {
  nome: string;
  email: string;
  whatsapp: string;
  cidade?: string;
  uf?: string;
  faz?: string;
}): Promise<boolean> {
  const { nome, email, whatsapp, cidade, uf, faz } = dados;
  if (!email || !email.includes("@")) return false;

  const primeiroNome = (nome || "").split(" ")[0] || "Olá";
  const assunto = "Seu cadastro de disponibilidade foi recebido na JobPago";

  const htmlCorpo = `
    <p style="margin:0 0 16px 0">Olá, <strong>${esc(primeiroNome)}</strong>.</p>
    <p style="margin:0 0 16px 0">
      Recebemos seu cadastro de disponibilidade na JobPago.
    </p>

    <div style="background-color:#0d1322;border:1px solid #1e293b;border-radius:12px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px 0;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Resumo registrado</p>
      <p style="margin:0 0 6px 0;color:#f8fafc"><strong>Nome:</strong> ${esc(nome)}</p>
      <p style="margin:0 0 6px 0;color:#f8fafc"><strong>WhatsApp:</strong> ${esc(whatsapp)}</p>
      ${cidade ? `<p style="margin:0 0 6px 0;color:#f8fafc"><strong>Localidade:</strong> ${esc(cidade)}${uf ? ` / ${esc(uf)}` : ""}</p>` : ""}
      ${faz ? `<p style="margin:0;color:#f8fafc"><strong>Atividade:</strong> ${esc(faz)}</p>` : ""}
    </div>

    <p style="margin:0 0 16px 0">
      Seu contato não fica público. Assim que um negócio ou contratante publicar uma tarefa compatível com o seu perfil, nós chamamos você direto no WhatsApp para combinar a entrega.
    </p>
    <p style="margin:0 0 20px 0">
      O acerto é feito por Pix diretamente entre as partes, com 0% de taxa.
    </p>

    <p style="margin:24px 0 0 0;color:#94a3b8">
      Atenciosamente,<br>
      <strong style="color:#f8fafc">Allan Candido</strong><br>
      JobPago
    </p>
  `;

  const textoPlano = `Olá, ${primeiroNome}.

Recebemos seu cadastro de disponibilidade na JobPago.

Nome: ${nome}
WhatsApp: ${whatsapp}
${cidade ? `Localidade: ${cidade}${uf ? ` / ${uf}` : ""}\n` : ""}${faz ? `Atividade: ${faz}\n` : ""}
Seu contato não fica público. Assim que um negócio ou contratante publicar uma tarefa compatível com o seu perfil, nós chamamos você direto no WhatsApp para combinar a entrega.
O acerto é feito por Pix diretamente entre as partes, com 0% de taxa.

Atenciosamente,
Allan Candido
JobPago`;

  return enviarEmail(email, assunto, molduraJobPago(assunto, htmlCorpo), textoPlano);
}

/**
 * Boas-vindas para nova conta criada em /cadastrar.
 */
export async function enviarEmailBoasVindasConta(dados: {
  nome: string;
  email: string;
  telefone?: string;
}): Promise<boolean> {
  const { nome, email, telefone } = dados;
  if (!email || !email.includes("@")) return false;

  const primeiroNome = (nome || "").split(" ")[0] || "Olá";
  const assunto = "Sua conta na JobPago está pronta";

  const htmlCorpo = `
    <p style="margin:0 0 16px 0">Olá, <strong>${esc(primeiroNome)}</strong>.</p>
    <p style="margin:0 0 16px 0">
      Sua conta na JobPago foi criada com sucesso.
    </p>
    <div style="background-color:#0d1322;border:1px solid #1e293b;border-radius:12px;padding:20px;margin:24px 0">
      <p style="margin:0 0 6px 0;color:#f8fafc"><strong>E-mail de acesso:</strong> ${esc(email)}</p>
      ${telefone ? `<p style="margin:0;color:#f8fafc"><strong>Telefone:</strong> ${esc(telefone)}</p>` : ""}
    </div>
    <p style="margin:0 0 16px 0">
      Você já pode acessar a plataforma, cadastrar novos serviços, publicar pedidos de contratação ou acompanhar suas expedições.
    </p>
    <p style="margin:24px 0 0 0;color:#94a3b8">
      Acesse sua conta a qualquer momento em:<br>
      <a href="https://jobpago.com.br/entrar" style="color:#f59e0b;text-decoration:underline">jobpago.com.br/entrar</a><br><br>
      Atenciosamente,<br>
      <strong style="color:#f8fafc">Allan Candido</strong><br>
      JobPago
    </p>
  `;

  const textoPlano = `Olá, ${primeiroNome}.

Sua conta na JobPago foi criada com sucesso.
E-mail de acesso: ${email}
${telefone ? `Telefone: ${telefone}\n` : ""}
Você já pode acessar a plataforma, cadastrar novos serviços, publicar pedidos de contratação ou acompanhar suas expedições.

Acesse sua conta em: https://jobpago.com.br/entrar

Atenciosamente,
Allan Candido
JobPago`;

  return enviarEmail(email, assunto, molduraJobPago(assunto, htmlCorpo), textoPlano);
}

/**
 * Confirmação de candidatura de refúgio (/refugio).
 */
export async function enviarEmailConfirmacaoRefugio(dados: {
  nomeLugar: string;
  responsavel?: string;
  email: string;
  cidade: string;
  uf: string;
}): Promise<boolean> {
  const { nomeLugar, responsavel, email, cidade, uf } = dados;
  if (!email || !email.includes("@")) return false;

  const nomeDestino = responsavel ? responsavel.split(" ")[0] : "Equipe " + nomeLugar;
  const assunto = `Candidatura de ${nomeLugar} ao Selo Refúgio da Estrada`;

  const htmlCorpo = `
    <p style="margin:0 0 16px 0">Olá, <strong>${esc(nomeDestino)}</strong>.</p>
    <p style="margin:0 0 16px 0">
      Recebemos a candidatura de <strong>${esc(nomeLugar)}</strong> (${esc(cidade)}/${esc(uf)}) para avaliação do Selo Refúgio da Estrada da JobPago.
    </p>
    <p style="margin:0 0 16px 0">
      Nossa equipe vai avaliar as informações enviadas e entraremos em contato pelo WhatsApp informado para combinar os detalhes da visita de verificação.
    </p>
    <p style="margin:24px 0 0 0;color:#94a3b8">
      Atenciosamente,<br>
      <strong style="color:#f8fafc">Allan Candido</strong><br>
      JobPago
    </p>
  `;

  const textoPlano = `Olá, ${nomeDestino}.

Recebemos a candidatura de ${nomeLugar} (${cidade}/${uf}) para avaliação do Selo Refúgio da Estrada da JobPago.

Nossa equipe vai avaliar as informações enviadas e entraremos em contato pelo WhatsApp informado para combinar os detalhes da visita de verificação.

Atenciosamente,
Allan Candido
JobPago`;

  return enviarEmail(email, assunto, molduraJobPago(assunto, htmlCorpo), textoPlano);
}
