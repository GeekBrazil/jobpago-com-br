"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  tipo: "prestador" | "contratante";
  nomeContratado: string;
  whatsappContratado: string;
  emailContratado: string;
  nomeOuPerfilContratante: string | null;
  categoria: string;
  modalidade: string;
  cidade: string | null;
  valor: string;
  isCortesia: boolean;
  status: string;
  createdAt: string;
}

const CHAVE_SEGREDO = "jobpago_admin_secret";

export default function AdminPage() {
  const [segredo, setSegredo] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "prestador" | "contratante">("todos");

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_SEGREDO);
    if (salvo) {
      setSegredo(salvo);
      buscar(salvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscar(s: string) {
    setCarregando(true);
    setErro("");
    try {
      const r = await fetch("/api/admin/leads", { headers: { "x-admin-secret": s } });
      if (r.status === 401) {
        setErro("Segredo incorreto.");
        setAutenticado(false);
        localStorage.removeItem(CHAVE_SEGREDO);
        return;
      }
      const d = await r.json();
      if (!r.ok) {
        setErro(d.erro || "Erro ao carregar.");
        return;
      }
      setLeads(d.leads);
      setAutenticado(true);
      localStorage.setItem(CHAVE_SEGREDO, s);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }

  if (!autenticado) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07090e" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscar(segredo);
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12, width: 280 }}
        >
          <input
            type="password"
            value={segredo}
            onChange={(e) => setSegredo(e.target.value)}
            placeholder="ADMIN_SECRET"
            autoFocus
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#121a2c", color: "#fff" }}
          />
          <button type="submit" disabled={carregando} style={{ padding: 10, borderRadius: 8, background: "#10b981", color: "#000", fontWeight: 700, border: "none" }}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
          {erro && <p style={{ color: "#f87171", fontSize: 13 }}>{erro}</p>}
        </form>
      </div>
    );
  }

  const filtrados = leads.filter((l) => filtro === "todos" || l.tipo === filtro);
  const totalContratantes = leads.filter((l) => l.tipo === "contratante").length;
  const totalPrestadores = leads.filter((l) => l.tipo === "prestador").length;

  return (
    <div style={{ minHeight: "100vh", background: "#07090e", color: "#f8fafc", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>JobPago · Cadastros</h1>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
        {leads.length} cadastro(s) no total — {totalContratantes} anunciante(s), {totalPrestadores} candidato(s)
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["todos", "contratante", "prestador"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #333",
              background: filtro === f ? "#10b981" : "transparent",
              color: filtro === f ? "#000" : "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {f === "todos" ? "Todos" : f === "contratante" ? "Anunciantes" : "Candidatos"}
          </button>
        ))}
        <button onClick={() => buscar(segredo)} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 999, border: "1px solid #333", background: "transparent", color: "#fff", fontSize: 13, cursor: "pointer" }}>
          ↻ Atualizar
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #333", color: "#94a3b8" }}>
              <th style={{ padding: 8 }}>Tipo</th>
              <th style={{ padding: 8 }}>Nome</th>
              <th style={{ padding: 8 }}>WhatsApp</th>
              <th style={{ padding: 8 }}>Categoria</th>
              <th style={{ padding: 8 }}>Cidade</th>
              <th style={{ padding: 8 }}>Valor</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid #1a1f2b" }}>
                <td style={{ padding: 8 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: l.tipo === "contratante" ? "#f59e0b33" : "#10b98133", color: l.tipo === "contratante" ? "#f59e0b" : "#10b981" }}>
                    {l.tipo === "contratante" ? "Anunciante" : "Candidato"}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{l.nomeContratado}</td>
                <td style={{ padding: 8 }}>{l.whatsappContratado}</td>
                <td style={{ padding: 8 }}>{l.categoria}</td>
                <td style={{ padding: 8 }}>{l.cidade || "—"}</td>
                <td style={{ padding: 8 }}>{l.isCortesia ? "Cortesia" : `R$ ${l.valor}`}</td>
                <td style={{ padding: 8 }}>{l.status}</td>
                <td style={{ padding: 8 }}>{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p style={{ color: "#94a3b8", padding: 20, textAlign: "center" }}>Nenhum cadastro ainda.</p>}
      </div>
    </div>
  );
}
