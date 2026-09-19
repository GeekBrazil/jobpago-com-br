export interface ParsedArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  coverImage?: string;
  publishedAt: string;
  tags?: string[];
  status: "published" | "draft";
  featured?: boolean;
  content: string;
}

export function parseMarkdownArticle(rawContent: string): ParsedArticle {
  let frontmatterText = "";
  let bodyText = rawContent;

  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (match) {
    frontmatterText = match[1];
    bodyText = match[2];
  }

  // Parse YAML Frontmatter
  const meta: Record<string, any> = {};
  if (frontmatterText) {
    const lines = frontmatterText.split("\n");
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();

        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }

        if (val.startsWith("[") && val.endsWith("]")) {
          try {
            const arr = val
              .slice(1, -1)
              .split(",")
              .map((s) => s.trim().replace(/^["']|["']$/g, ""))
              .filter(Boolean);
            meta[key] = arr;
            continue;
          } catch {}
        }

        meta[key] = val;
      }
    }
  }

  const title = meta.title || "Artigo sem título";
  const slug =
    meta.slug ||
    meta.id ||
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const summary = meta.excerpt || meta.summary || meta.description || "";
  const category = meta.category || "Logística & Estrada";
  const coverImage = meta.coverImage || meta.image || meta.cover || undefined;
  const publishedAt = meta.date
    ? new Date(meta.date).toISOString()
    : new Date().toISOString();

  const content = markdownToHtml(bodyText);

  return {
    id: slug,
    title,
    summary,
    category,
    coverImage,
    publishedAt,
    tags: Array.isArray(meta.tags) ? meta.tags : undefined,
    status: "published",
    featured: meta.featured === "true" || meta.featured === true,
    content,
  };
}

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const htmlParts: string[] = [];

  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let inTable = false;

  const closeList = () => {
    if (inList) {
      htmlParts.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
      listType = null;
    }
  };

  const closeTable = () => {
    if (inTable) {
      htmlParts.push("</tbody></table></div>");
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("|") && line.endsWith("|")) {
      closeList();
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(line)) continue;
      const cells = line.slice(1, -1).split("|").map(c => formatInline(c.trim()));
      if (!inTable) {
        inTable = true;
        htmlParts.push("<div class=\"table-responsive my-6 overflow-x-auto\"><table class=\"w-full border-collapse border border-white/10 text-left text-sm text-slate-300\">");
        htmlParts.push("<thead class=\"bg-white/5 uppercase text-xs tracking-wider text-white\"><tr>");
        cells.forEach(c => htmlParts.push(`<th class=\"border border-white/10 px-4 py-3 font-semibold\">${c}</th>`));
        htmlParts.push("</tr></thead><tbody class=\"divide-y divide-white/5\">");
      } else {
        htmlParts.push("<tr class=\"hover:bg-white/[0.02] transition-colors\">");
        cells.forEach(c => htmlParts.push(`<td class=\"border border-white/10 px-4 py-3\">${c}</td>`));
        htmlParts.push("</tr>");
      }
      continue;
    } else {
      closeTable();
    }

    if (!line) { closeList(); continue; }
    if (/^(---|___|\*\*\*)$/.test(line)) { closeList(); htmlParts.push("<hr class=\"my-8 border-t border-white/10\" />"); continue; }
    if (line.startsWith("#### ")) { closeList(); htmlParts.push(`<h4 class=\"text-lg font-bold text-white mt-6 mb-2\">${formatInline(line.slice(5))}</h4>`); continue; }
    if (line.startsWith("### ")) { closeList(); htmlParts.push(`<h3 class=\"text-xl font-bold text-white mt-8 mb-3 tracking-tight\">${formatInline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("## ")) { closeList(); htmlParts.push(`<h2 class=\"text-2xl font-extrabold text-white mt-10 mb-4 tracking-tight border-b border-white/10 pb-2\">${formatInline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("# ")) { closeList(); htmlParts.push(`<h1 class=\"text-3xl font-extrabold text-white mt-12 mb-6 tracking-tight\">${formatInline(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("> ")) { closeList(); htmlParts.push(`<blockquote class=\"border-l-4 border-emerald-500 bg-white/[0.02] pl-4 py-2 my-4 italic text-slate-300\">${formatInline(line.slice(2))}</blockquote>`); continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList || listType !== "ul") { closeList(); inList = true; listType = "ul"; htmlParts.push("<ul class=\"list-disc list-inside space-y-2 my-4 text-slate-300\">"); }
      htmlParts.push(`<li>${formatInline(line.slice(2))}</li>`);
      continue;
    }
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") { closeList(); inList = true; listType = "ol"; htmlParts.push("<ol class=\"list-decimal list-inside space-y-2 my-4 text-slate-300\">"); }
      htmlParts.push(`<li>${formatInline(olMatch[2])}</li>`);
      continue;
    }
    closeList();
    htmlParts.push(`<p class=\"leading-relaxed my-3 text-slate-300 font-sans text-base\">${formatInline(line)}</p>`);
  }
  closeList();
  closeTable();
  return htmlParts.join("\n");
}

function formatInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full h-auto" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300 text-sm font-mono">$1</code>');
}
