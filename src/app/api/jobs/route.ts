import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const JOBS_FILE = path.join(process.cwd(), "public", "data", "jobs_store.json");

// Sem anúncios de exemplo (2026-09-28): a home prometia "número oficial, não
// promessa" e mostrava 7 vagas inventadas. O mapa lê daqui só o que for real.
const SEED_JOBS: Record<string, unknown>[] = [];

const memoryStore = [...SEED_JOBS];

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

export async function GET() {
  const jobs = readJobs();
  return NextResponse.json({ success: true, count: jobs.length, jobs });
}

/* Publicação direta desativada (2026-09-28): aceitava anúncio sem login, com
   qualquer WhatsApp. Negócio publica tarefa por /cadastrar-servico; quem busca
   renda cadastra disponibilidade em /disponibilidade. */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Publicação direta desativada. Use jobpago.com.br/cadastrar-servico." },
    { status: 410 }
  );
}
