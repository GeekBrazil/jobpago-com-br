import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const LEADS_FILE = path.join(process.cwd(), "public", "data", "leads_store.json");

interface LeadPayload {
  tipo: "prestador" | "contratante";
  nomeContratado: string;
  whatsappContratado: string;
  emailContratado: string;
  nomeOuPerfilContratante: string;
  emailContratante?: string;
  whatsappContratante?: string;
  tituloServico: string;
  categoria: string;
  modalidade: "Remoto" | "Presencial";
  cidade: string;
  valor: number | string;
  isCortesia: boolean;
  descricao: string;
  lgpdConsent: boolean;
  timestamp?: string;
}

type LeadRegistrado = LeadPayload & { id: string; createdAt: string; status: string };

// Fallback de emergência — Vercel serverless não tem disco persistente entre
// invocações, então isso NÃO É a fonte de verdade. Serve só pra não perder o
// lead na hora se o Postgres estiver fora do ar.
let memoryLeads: LeadRegistrado[] = [];

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })
  : null;

async function gravarNoPostgres(lead: LeadRegistrado) {
  if (!pool) return false;
  await pool.query(
    `INSERT INTO leads (id, tipo, nome_contratado, whatsapp_contratado, email_contratado,
        nome_contratante, email_contratante, whatsapp_contratante, titulo_servico, categoria,
        modalidade, cidade, valor, is_cortesia, descricao, lgpd_consent, status, criado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (id) DO NOTHING`,
    [
      lead.id, lead.tipo, lead.nomeContratado, lead.whatsappContratado, lead.emailContratado,
      lead.nomeOuPerfilContratante || null, lead.emailContratante || null, lead.whatsappContratante || null,
      lead.tituloServico, lead.categoria, lead.modalidade, lead.cidade || null,
      String(lead.valor ?? ""), lead.isCortesia, lead.descricao || null, lead.lgpdConsent,
      lead.status, lead.createdAt,
    ]
  );
  return true;
}

async function listarDoPostgres(): Promise<LeadRegistrado[] | null> {
  if (!pool) return null;
  const { rows } = await pool.query(
    `SELECT id, tipo, nome_contratado AS "nomeContratado", whatsapp_contratado AS "whatsappContratado",
            email_contratado AS "emailContratado", nome_contratante AS "nomeOuPerfilContratante",
            email_contratante AS "emailContratante", whatsapp_contratante AS "whatsappContratante",
            titulo_servico AS "tituloServico", categoria, modalidade, cidade, valor,
            is_cortesia AS "isCortesia", descricao, lgpd_consent AS "lgpdConsent", status,
            criado_em AS "createdAt"
       FROM leads ORDER BY criado_em DESC LIMIT 500`
  );
  return rows;
}

function readLeadsDoDisco(): LeadRegistrado[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
    }
  } catch (err) {
    console.warn("Aviso ao ler arquivo de leads:", err);
  }
  return memoryLeads;
}

function writeLeadsNoDisco(leads: LeadRegistrado[]) {
  try {
    const dir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.warn("Aviso ao persistir leads no disco:", err);
  }
}

/* Loga em eventos_site no allancandido.com — jobpago não tem Postgres
   acessível por HTTP público, então chama o endpoint central em vez de
   duplicar a tabela aqui. Best-effort: nunca derruba a captura do lead. */
function logEventoLead(dados: { tipo: string; categoria: string }) {
  fetch("https://allancandido.com/api/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site: "jobpago", tipo: "lead", dados }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const body: LeadPayload = await req.json();

    // 1. Validação estrita de campos obrigatórios
    if (!body.nomeContratado?.trim()) {
      return NextResponse.json({ success: false, error: "Nome é obrigatório." }, { status: 400 });
    }

    // 2. Validação de Telefone / WhatsApp (mínimo 10 dígitos)
    const cleanPhone = body.whatsappContratado.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return NextResponse.json(
        { success: false, error: "WhatsApp inválido. Informe DDD + número (ex: 24 99332-6966)." },
        { status: 400 }
      );
    }

    // 3. Validação de E-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.emailContratado.trim())) {
      return NextResponse.json({ success: false, error: "E-mail inválido." }, { status: 400 });
    }

    // 4. Validação de Consentimento LGPD
    if (!body.lgpdConsent) {
      return NextResponse.json(
        { success: false, error: "É obrigatório consentir com o termo da LGPD para prosseguir." },
        { status: 400 }
      );
    }

    if (!body.tituloServico?.trim()) {
      return NextResponse.json({ success: false, error: "Título do serviço é obrigatório." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const dataHoraFormatada = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date());

    const newLead: LeadRegistrado = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...body,
      createdAt: nowIso,
      status: "pendente_envio_contratante",
    };

    // Persistência: Postgres é a fonte de verdade; disco/memória é só rede de
    // segurança pra quando DATABASE_URL não está configurado (dev local) ou o
    // banco falha na hora — sem isso o lead simplesmente sumia (Vercel
    // serverless não tem disco persistente entre invocações).
    const gravouNoBanco = await gravarNoPostgres(newLead).catch((err) => {
      console.error("Erro gravando lead no Postgres:", err);
      return false;
    });
    if (!gravouNoBanco) {
      const existing = readLeadsDoDisco();
      const updated = [newLead, ...existing];
      memoryLeads = updated;
      writeLeadsNoDisco(updated);
    }

    logEventoLead({ tipo: body.tipo, categoria: body.categoria }); // fire-and-forget

    // 5. Formatação da mensagem para o WhatsApp do Allan (5524993326966)
    const valorTexto = body.isCortesia
      ? "🛡️ 100% CORTESIA (0800 Alta Honra)"
      : `R$ ${Number(body.valor || 0).toLocaleString("pt-BR")}`;

    const mensagemWhatsapp = `⚡ *NOVO SERVIÇO CADASTRADO — JOBPAGO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *AÇÃO:* Envio do serviço diretamente para o Contratante

👤 *DADOS DO CONTRATADO (Prestador):*
• Nome: ${body.nomeContratado}
• WhatsApp: ${body.whatsappContratado}
• E-mail: ${body.emailContratado}
• Localidade: ${body.cidade || "Não informada / Remoto"}

🏢 *DADOS DO CONTRATANTE (Destinatário):*
• Contratante / Perfil: ${body.nomeOuPerfilContratante || "Contratantes da Rede JobPago"}
• Modalidade: Nós enviamos os serviços para o contratante.

🛠️ *DETALHES DO SERVIÇO:*
• Título: ${body.tituloServico}
• Categoria: ${body.categoria}
• Modalidade: ${body.modalidade}
• Orçamento: ${valorTexto}
• Detalhes: ${body.descricao || "Sem detalhes adicionais"}

🔒 *CONFORMIDADE LGPD (Lei 13.709/2018):*
• Consentimento do titular: REGISTRADO ✅
• Data/Hora: ${dataHoraFormatada}
• Finalidade: Intermediação e despacho para o contratante
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const whatsappUrl = `https://wa.me/5524993326966?text=${encodeURIComponent(mensagemWhatsapp)}`;

    return NextResponse.json({
      success: true,
      lead: newLead,
      whatsappUrl,
      message: "Lead registrado com sucesso e em conformidade com a LGPD.",
    });
  } catch (err) {
    console.error("Erro ao registrar lead de serviço:", err);
    return NextResponse.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}

export async function GET() {
  const doPostgres = await listarDoPostgres().catch((err) => {
    console.error("Erro lendo leads do Postgres:", err);
    return null;
  });
  const leads = doPostgres ?? readLeadsDoDisco();
  return NextResponse.json({ success: true, count: leads.length, leads, fonte: doPostgres ? "postgres" : "disco" });
}
