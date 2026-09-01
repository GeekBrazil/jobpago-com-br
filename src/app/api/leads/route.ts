import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

let memoryLeads: (LeadPayload & { id: string; createdAt: string })[] = [];

function readLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const content = fs.readFileSync(LEADS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Aviso ao ler arquivo de leads:", err);
  }
  return memoryLeads;
}

function writeLeads(leads: unknown[]) {
  try {
    const dir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.warn("Aviso ao persistir leads no disco:", err);
  }
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

    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...body,
      createdAt: nowIso,
      status: "pendente_envio_contratante",
    };

    // Persistência
    const existing = readLeads();
    const updated = [newLead, ...existing];
    memoryLeads = updated;
    writeLeads(updated);

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
  const leads = readLeads();
  return NextResponse.json({ success: true, count: leads.length, leads });
}
