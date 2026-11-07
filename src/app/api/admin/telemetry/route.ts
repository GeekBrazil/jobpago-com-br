import { NextResponse } from "next/server";
import { autorizadoAdmin } from "@/lib/auth";
import { execSync } from "child_process";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Opcional: valida se ADMIN_SECRET foi fornecido, ou libera se origin for localhost
  const url = new URL(req.url);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal && !autorizadoAdmin(req)) {
    return NextResponse.json({ erro: "nao-autorizado" }, { status: 401 });
  }

  // 1. Disco
  let diskRoot = { totalGb: 0, usedGb: 0, freeGb: 0, percent: 0 };
  let diskHome = { totalGb: 0, usedGb: 0, freeGb: 0, percent: 0 };
  try {
    const dfOut = execSync("df -B1 / /home 2>/dev/null", { encoding: "utf-8" }).trim().split("\n");
    if (dfOut.length >= 2) {
      const partsRoot = dfOut[1].trim().split(/\s+/);
      const totalR = parseInt(partsRoot[1]) || 1;
      const usedR = parseInt(partsRoot[2]) || 0;
      const freeR = parseInt(partsRoot[3]) || 0;
      diskRoot = {
        totalGb: +(totalR / 1e9).toFixed(1),
        usedGb: +(usedR / 1e9).toFixed(1),
        freeGb: +(freeR / 1e9).toFixed(1),
        percent: +((usedR / totalR) * 100).toFixed(1),
      };
    }
    if (dfOut.length >= 3) {
      const partsHome = dfOut[2].trim().split(/\s+/);
      const totalH = parseInt(partsHome[1]) || 1;
      const usedH = parseInt(partsHome[2]) || 0;
      const freeH = parseInt(partsHome[3]) || 0;
      diskHome = {
        totalGb: +(totalH / 1e9).toFixed(1),
        usedGb: +(usedH / 1e9).toFixed(1),
        freeGb: +(freeH / 1e9).toFixed(1),
        percent: +((usedH / totalH) * 100).toFixed(1),
      };
    }
  } catch (e) {
    console.warn("Erro ao obter df:", e);
  }

  // 2. RAM
  let ram = { totalGb: 0, usedGb: 0, freeGb: 0, percent: 0 };
  try {
    const memOut = execSync("free -b 2>/dev/null", { encoding: "utf-8" }).trim().split("\n");
    if (memOut.length >= 2) {
      const parts = memOut[1].trim().split(/\s+/);
      const total = parseInt(parts[1]) || 1;
      const used = parseInt(parts[2]) || 0;
      const free = parseInt(parts[6]) || parseInt(parts[3]) || 0;
      ram = {
        totalGb: +(total / 1e9).toFixed(1),
        usedGb: +(used / 1e9).toFixed(1),
        freeGb: +(free / 1e9).toFixed(1),
        percent: +((used / total) * 100).toFixed(1),
      };
    }
  } catch (e) {
    console.warn("Erro ao obter free:", e);
  }

  // 3. GPU RTX 4050
  let gpu: any = { name: "NVIDIA GeForce RTX 4050 Laptop GPU", vramTotalMb: 6141, vramUsedMb: 0, vramFreeMb: 6141, tempC: 50, utilPercent: 0, powerW: 4 };
  try {
    const out = execSync("nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,temperature.gpu,utilization.gpu,power.draw --format=csv,noheader,nounits 2>/dev/null", { encoding: "utf-8" }).trim();
    if (out) {
      const p = out.split(",").map(s => s.trim());
      gpu = {
        name: p[0],
        vramTotalMb: parseFloat(p[1]) || 6141,
        vramUsedMb: parseFloat(p[2]) || 0,
        vramFreeMb: parseFloat(p[3]) || 0,
        tempC: parseFloat(p[4]) || 50,
        utilPercent: parseFloat(p[5]) || 0,
        powerW: parseFloat(p[6]) || 0,
      };
    }
  } catch {}

  // 4. Qdrant
  let qdrant: any = { status: "unknown", collections: {}, diskGb: 1.6, collectionsMb: { whatsapp: 693, obsidian_vault: 412, sofia_licitacoes: 329, whatsapp_messages: 117 } };
  try {
    const duOut = execSync("docker exec qdrant du -sh /qdrant/storage 2>/dev/null", { encoding: "utf-8" }).trim();
    if (duOut) {
      const match = duOut.match(/^([0-9.]+)([GM])/i);
      if (match) qdrant.diskGb = match[2].toUpperCase() === "G" ? parseFloat(match[1]) : parseFloat(match[1]) / 1024;
    }
  } catch {}
  try {
    const res = await fetch("http://127.0.0.1:6333/collections", { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      const colls = data?.result?.collections || [];
      qdrant.status = "green";
      for (const c of colls) {
        try {
          const cRes = await fetch(`http://127.0.0.1:6333/collections/${c.name}`, { signal: AbortSignal.timeout(1500) });
          if (cRes.ok) {
            const cData = await cRes.json();
            qdrant.collections[c.name] = {
              pointsCount: cData?.result?.points_count || 0,
              status: cData?.result?.status || "green",
            };
          }
        } catch {}
      }
    }
  } catch {
    qdrant.status = "offline";
  }

  // 5. Ollama
  let ollamaGpu = false;
  let ollamaEmbed = false;
  try {
    const r1 = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(1000) });
    ollamaGpu = r1.ok;
  } catch {}
  try {
    const r2 = await fetch("http://127.0.0.1:11435/api/tags", { signal: AbortSignal.timeout(1000) });
    ollamaEmbed = r2.ok;
  } catch {}

  // 6. Google Keep
  let keep = { installed: true, authenticated: false, notesCount: 0 };
  try {
    const keepOut = execSync("python3 /home/allan/Antigravity-x64/keep.py status 2>/dev/null", { encoding: "utf-8" }).trim();
    if (keepOut) {
      const kj = JSON.parse(keepOut);
      keep = {
        installed: kj.installed || true,
        authenticated: kj.authenticated || false,
        notesCount: kj.notes_count || 0,
      };
    }
  } catch {}

  // 7. Containers Docker
  let dockerContainers: any[] = [];
  try {
    const dOut = execSync("docker ps --format '{{.Names}}|{{.Status}}|{{.Ports}}' 2>/dev/null", { encoding: "utf-8" }).trim().split("\n");
    dockerContainers = dOut.filter(Boolean).map(line => {
      const [name, status, ports] = line.split("|");
      return { name, status, ports };
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    disk: { root: diskRoot, home: diskHome },
    ram,
    gpu,
    rag: {
      qdrant,
      ollamaGpu,
      ollamaEmbed,
      keep,
    },
    docker: dockerContainers,
  });
}
