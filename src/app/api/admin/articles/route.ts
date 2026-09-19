import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const FILE_PATH = path.join(process.cwd(), "public/data/articles.json");

function getLocalArticles(): any[] {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveLocalArticles(articles: any[]): void {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(articles, null, 2), "utf-8");
}

function auth(req: NextRequest): boolean {
  const secret = req.headers.get("x-admin-secret") || "";
  if (ADMIN_SECRET && secret === ADMIN_SECRET) return true;

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ") && ADMIN_SECRET && authHeader.slice(7).trim() === ADMIN_SECRET) return true;

  const adminEmail = req.headers.get("x-admin-email") || "";
  if ((adminEmail === "angravirtualpro@gmail.com" || adminEmail === "allan@allancandido.com") && ADMIN_SECRET && secret === ADMIN_SECRET) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getLocalArticles());
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const article = await req.json();
    if (!article.id || !article.title) {
      return NextResponse.json({ error: "id e title são obrigatórios" }, { status: 400 });
    }

    const localList = getLocalArticles();
    const updatedList = localList.filter((a: any) => a.id !== article.id);
    updatedList.unshift(article);
    saveLocalArticles(updatedList);

    return NextResponse.json({ ok: true, total: updatedList.length, article });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const list = getLocalArticles().filter((a: any) => a.id !== id);
  saveLocalArticles(list);
  return NextResponse.json({ ok: true });
}
