import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const JOBS_FILE = path.join(process.cwd(), "public", "data", "jobs_store.json");

const SEED_JOBS = [
  {
    id: "n1",
    title: "Ponto de Apoio Nômade: Chuveiro Quente + Carga 220V + Wi-Fi",
    category: "Nômade & Infra",
    budget: 35,
    location: "Praia do Coqueiro, Angra dos Reis, RJ",
    lat: -23.012,
    lng: -44.310,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 10 min",
    proposalsCount: 6,
    description: "Espaço privativo para viajantes e nômades digitais. Banheiro amplo com chuveiro a gás aquecido, tomadas dedicadas de alta carga (veículos e bikes elétricas) e bancada de trabalho para notebooks com Wi-Fi Starlink 600MB.",
    clientName: "Estação Nômade Costa Verde",
    whatsapp: "5524993326966",
    nomadFeatures: ["🚿 Chuveiro Quente", "🔋 Carga 220V Alta Carga", "💻 Wi-Fi 600MB", "☕ Café Grátis"],
  },
  {
    id: "n2",
    title: "Vaga Segura para Motorhome / Van Life + Tomada 32A + Água",
    category: "Nômade & Infra",
    budget: 80,
    location: "Centro Histórico, Paraty, RJ",
    lat: -23.218,
    lng: -44.714,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 25 min",
    proposalsCount: 3,
    description: "Terreno plano e murado com portão eletrônico para estacionar Motorhomes e Vans. Inclui ponto de água potável, descarte de água cinza e energia industrial até 32A.",
    clientName: "Paraty Van Camping",
    whatsapp: "5524993326966",
    nomadFeatures: ["🚐 Vaga Motorhome", "⚡ Ponto 32A", "🚰 Água Potável", "🔒 Portão 24h"],
  },
  {
    id: "t1",
    title: "Automação de Pipeline com IA e Integração de APIs Webhook",
    category: "Tecnologia & TI",
    budget: 1200,
    location: "Remoto",
    lat: -23.008,
    lng: -44.315,
    type: "Remoto",
    isPixImmediate: true,
    postedAgo: "Há 8 min",
    proposalsCount: 3,
    description: "Desenvolvimento de fluxo n8n / Python para automação de mensagens e integração com CRM. Trabalho 100% remoto para devs nômades.",
    clientName: "Tech Nômade Studio",
    whatsapp: "5524993326966",
  },
  {
    id: "1",
    title: "Criação de Landing Page em Next.js para Negócio Local",
    category: "Tecnologia & TI",
    budget: 850,
    location: "Remoto",
    lat: -23.005,
    lng: -44.320,
    type: "Remoto",
    isPixImmediate: true,
    postedAgo: "Há 15 min",
    proposalsCount: 4,
    description: "Desenvolvedor front-end para criar uma landing page rápida com design responsivo e alta performance.",
    clientName: "Allan C.",
    whatsapp: "5524993326966",
  },
  {
    id: "2",
    title: "Instalação Elétrica Residencial e Reparos Gerais",
    category: "Reformas & Reparos",
    budget: 380,
    location: "Porto Frade, Angra dos Reis, RJ",
    lat: -23.045,
    lng: -44.420,
    type: "Presencial",
    isPixImmediate: true,
    postedAgo: "Há 42 min",
    proposalsCount: 2,
    description: "Instalação de 6 luminárias de LED no teto e pequenos reparos elétricos no condomínio Porto Frade.",
    clientName: "Marcos V.",
    whatsapp: "5524993326966",
  },
];

// In-memory fallback para ambientes serverless (Vercel)
let memoryStore = [...SEED_JOBS];

function readJobs() {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const content = fs.readFileSync(JOBS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Erro ao ler jobs_store.json:", err);
  }
  return memoryStore;
}

function saveJobs(jobs: any[]) {
  memoryStore = jobs;
  try {
    const dir = path.dirname(JOBS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar jobs_store.json (rodando em fallback de memória):", err);
  }
}

export async function GET() {
  const jobs = readJobs();
  return NextResponse.json({ success: true, count: jobs.length, jobs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.budget) {
      return NextResponse.json({ success: false, error: "Título e Orçamento são obrigatórios" }, { status: 400 });
    }

    const currentJobs = readJobs();

    const newJob = {
      id: Date.now().toString(),
      title: body.title,
      category: body.category || "Nômade & Infra",
      budget: Number(body.budget),
      location: body.location || "Angra dos Reis, RJ",
      lat: body.lat || -23.006 + (Math.random() - 0.5) * 0.05,
      lng: body.lng || -44.318 + (Math.random() - 0.5) * 0.05,
      type: body.type || "Presencial",
      isPixImmediate: true,
      postedAgo: "Agora mesmo",
      proposalsCount: 0,
      description: body.description || "Serviço cadastrado via plataforma.",
      clientName: body.clientName || "Contratante Anônimo",
      whatsapp: body.whatsapp || "5524993326966",
      nomadFeatures: body.nomadFeatures || (body.category?.includes("Nômade") ? ["⚡ Carga 220V", "🚿 Chuveiro Quente"] : undefined),
    };

    const updated = [newJob, ...currentJobs];
    saveJobs(updated);

    return NextResponse.json({ success: true, job: newJob, total: updated.length }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
