"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseMarkdownArticle, ParsedArticle } from "@/lib/markdown";

interface AdminUser {
  name: string;
  email: string;
  picture?: string;
}

interface LocalArticleItem {
  name: string;
  parsed: ParsedArticle;
}

export default function BlogAdminIngestion() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string>("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginSecret, setLoginSecret] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // File system state
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [localArticles, setLocalArticles] = useState<LocalArticleItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [publishingName, setPublishingName] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<ParsedArticle | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ac_blog_admin_jobpago");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.token && data.user?.email) {
          setIsAdmin(true);
          setAdminUser(data.user);
          setToken(data.token);
        }
      } catch {}
    }

    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleLogin = () => {
    if (typeof window === "undefined" || !(window as any).google?.accounts?.id) {
      setMessage({ type: "info", text: "Carregando serviço Google... Se persistir, use a chave admin." });
      return;
    }

    const google = (window as any).google;
    google.accounts.id.initialize({
      client_id: "1057404494951-mock.apps.googleusercontent.com",
      callback: async (response: any) => {
        if (response.credential) {
          try {
            const res = await fetch("/api/admin/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });
            const data = await res.json();
            if (data.success && data.token) {
              const session = { token: data.token, user: data.user };
              localStorage.setItem("ac_blog_admin_jobpago", JSON.stringify(session));
              setIsAdmin(true);
              setAdminUser(data.user);
              setToken(data.token);
              setShowLoginModal(false);
              setMessage({ type: "success", text: `Bem-vindo, ${data.user.name}! Modo admin ativado.` });
            } else {
              setLoginError(data.error || "Acesso negado para este e-mail.");
            }
          } catch {
            setLoginError("Falha na autenticação Google.");
          }
        }
      },
    });

    google.accounts.id.prompt();
  };

  const handleSecretLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginSecret) {
      setLoginError("Digite a chave de administrador.");
      return;
    }

    try {
      const testRes = await fetch("/api/admin/articles", {
        headers: { "x-admin-secret": loginSecret },
      });

      if (testRes.ok) {
        const session = {
          token: loginSecret,
          user: { name: "Allan Candido", email: "angravirtualpro@gmail.com" },
        };
        localStorage.setItem("ac_blog_admin_jobpago", JSON.stringify(session));
        setIsAdmin(true);
        setAdminUser(session.user);
        setToken(loginSecret);
        setShowLoginModal(false);
        setLoginSecret("");
        setMessage({ type: "success", text: "Autenticado com sucesso como Allan Candido (Admin)." });
      } else {
        setLoginError("Chave de administrador inválida.");
      }
    } catch {
      setLoginError("Erro ao tentar autenticar.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ac_blog_admin_jobpago");
    setIsAdmin(false);
    setAdminUser(null);
    setToken("");
    setDirHandle(null);
    setLocalArticles([]);
    setMessage({ type: "info", text: "Sessão de administrador encerrada." });
  };

  const handleSelectDirectory = async () => {
    setMessage(null);
    if (!("showDirectoryPicker" in window)) {
      setMessage({
        type: "error",
        text: "Seu navegador não suporta a API de Acesso ao Sistema de Arquivos. Use Google Chrome ou Edge.",
      });
      return;
    }

    try {
      setIsScanning(true);
      const handle = await (window as any).showDirectoryPicker({
        id: "artigos-blog-jobpago",
        mode: "readwrite",
      });

      setDirHandle(handle);

      const items: LocalArticleItem[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".md")) {
          const file = await entry.getFile();
          const text = await file.text();
          const parsed = parseMarkdownArticle(text);
          items.push({ name: entry.name, parsed });
        }
      }

      setLocalArticles(items);
      setIsScanning(false);

      if (items.length === 0) {
        setMessage({
          type: "info",
          text: `Pasta conectada! Nenhum arquivo .md pendente de publicação encontrado.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Pasta conectada! ${items.length} artigo(s) .md encontrado(s) pronto(s) para ingestão.`,
        });
      }
    } catch (err: any) {
      setIsScanning(false);
      if (err.name !== "AbortError") {
        setMessage({ type: "error", text: `Erro ao acessar diretório: ${err.message}` });
      }
    }
  };

  const handleSelectSingleFile = async () => {
    setMessage(null);
    if (!("showOpenFilePicker" in window)) {
      setMessage({ type: "error", text: "Seu navegador não suporta a API de arquivos." });
      return;
    }

    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = parseMarkdownArticle(text);
      setPreviewArticle(parsed);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessage({ type: "error", text: `Erro: ${err.message}` });
      }
    }
  };

  const handlePublish = async (item: LocalArticleItem) => {
    if (!token) {
      setMessage({ type: "error", text: "Token de administrador não encontrado." });
      return;
    }

    setPublishingName(item.name);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": token,
        },
        body: JSON.stringify(item.parsed),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao gravar artigo no servidor.");
      }

      // EXCLUSÃO AUTOMÁTICA DO ARQUIVO LOCAL
      if (dirHandle) {
        try {
          await dirHandle.removeEntry(item.name);
        } catch (delErr) {
          console.warn("Aviso ao excluir arquivo local:", delErr);
        }
      }

      setLocalArticles((prev) => prev.filter((a) => a.name !== item.name));
      setPublishingName(null);

      setMessage({
        type: "success",
        text: `🎉 Artigo "${item.parsed.title}" publicado com sucesso! O arquivo local "${item.name}" foi automaticamente excluído.`,
      });

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setPublishingName(null);
      setMessage({ type: "error", text: `Erro na publicação: ${err.message}` });
    }
  };

  return (
    <div className="relative z-50">
      {!isAdmin ? (
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-end">
          <button
            onClick={() => setShowLoginModal(true)}
            className="text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]"
          >
            <span>🔒</span> Acesso Admin (Allan Candido)
          </button>
        </div>
      ) : (
        <div className="bg-slate-950/90 border-b border-emerald-500/30 backdrop-blur-xl px-4 py-3 text-white shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-black flex items-center justify-center text-xs">
                JP
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  Painel de Ingestão de Blog • {adminUser?.name || "Allan Candido"}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">
                  {adminUser?.email || "angravirtualpro@gmail.com"} (Reconhecido como Admin)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSelectDirectory}
                disabled={isScanning}
                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>📂</span> {isScanning ? "Lendo pasta..." : "Conectar Pasta Local (Downloads/Artigos blog)"}
              </button>

              <button
                onClick={handleSelectSingleFile}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <span>📄</span> Arquivo .md
              </button>

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-2 rounded-lg border border-white/5"
              >
                Sair
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`max-w-6xl mx-auto mt-3 p-2.5 rounded-xl text-xs font-medium ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : message.type === "error"
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                  : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {localArticles.length > 0 && (
            <div className="max-w-6xl mx-auto mt-4 p-4 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-3">
                Artigos Prontos para Ingestão e Exclusão Automática da Pasta Local ({localArticles.length}):
              </p>
              <div className="grid gap-3">
                {localArticles.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between flex-wrap gap-4"
                  >
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.parsed.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{item.name}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{item.parsed.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{item.parsed.summary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewArticle(item.parsed)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                      >
                        👁️ Prévia
                      </button>
                      <button
                        onClick={() => handlePublish(item)}
                        disabled={publishingName === item.name}
                        className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 transition-colors"
                      >
                        <span>🚀</span> {publishingName === item.name ? "Publicando..." : "Publicar e Excluir Arquivo Local"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Login */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center text-lg mx-auto mb-3">
              JP
            </div>
            <h3 className="text-base font-bold text-white mb-1">Área do Administrador</h3>
            <p className="text-xs text-slate-400 mb-5">
              Reconhecimento exclusivo para Allan Candido (angravirtualpro@gmail.com)
            </p>

            {loginError && (
              <div className="mb-4 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow hover:bg-slate-100 transition-colors mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Entrar com Google (OAuth)
            </button>

            <form onSubmit={handleSecretLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Chave Mestra Admin"
                value={loginSecret}
                onChange={(e) => setLoginSecret(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-2 rounded-xl transition-colors"
              >
                Autenticar Chave Mestra
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Prévia */}
      {previewArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewArticle(null)}
        >
          <div
            className="bg-slate-950 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Prévia • {previewArticle.category}
              </span>
              <button onClick={() => setPreviewArticle(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {previewArticle.coverImage && (
              <img src={previewArticle.coverImage} alt={previewArticle.title} className="w-full max-h-60 object-cover rounded-xl mb-4" />
            )}

            <h1 className="text-xl sm:text-2xl font-black text-white mb-2">{previewArticle.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">{previewArticle.summary}</p>
            <hr className="border-white/10 my-4" />
            <div className="text-xs sm:text-sm text-slate-300 space-y-3" dangerouslySetInnerHTML={{ __html: previewArticle.content }} />

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-2">
              <button onClick={() => setPreviewArticle(null)} className="text-xs px-4 py-2 rounded-xl border border-white/10 text-slate-300">
                Fechar
              </button>
              <button
                onClick={() => {
                  const match = localArticles.find((a) => a.parsed.id === previewArticle.id);
                  if (match) handlePublish(match);
                  else handlePublish({ name: `${previewArticle.id}.md`, parsed: previewArticle });
                  setPreviewArticle(null);
                }}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 text-black"
              >
                Publicar Artigo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
