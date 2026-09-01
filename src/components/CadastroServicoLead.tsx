"use client";

import { useState } from "react";
import Link from "next/link";

interface CadastroServicoLeadProps {
  onSuccess?: () => void;
  compact?: boolean;
}

const CATEGORIAS_SERVICOS = [
  { id: "devs", name: "Tecnologia & TI", icon: "💻" },
  { id: "vanlife", name: "Nômade & Infra Van Life", icon: "🚐" },
  { id: "reformas", name: "Reformas & Reparos", icon: "🛠️" },
  { id: "transporte", name: "Transporte & Fretes", icon: "🚚" },
  { id: "foto", name: "Fotografia & Mídia", icon: "📸" },
  { id: "aulas", name: "Aulas & Consultoria", icon: "📚" },
  { id: "design", name: "Design & Criatividade", icon: "🎨" },
];

export default function CadastroServicoLead({ onSuccess, compact = false }: CadastroServicoLeadProps) {
  const [tipo, setTipo] = useState<"prestador" | "contratante">("prestador");
  const [nomeContratado, setNomeContratado] = useState("");
  const [whatsappContratado, setWhatsappContratado] = useState("");
  const [emailContratado, setEmailContratado] = useState("");
  const [nomeOuPerfilContratante, setNomeOuPerfilContratante] = useState("");
  const [tituloServico, setTituloServico] = useState("");
  const [categoria, setCategoria] = useState("Tecnologia & TI");
  const [modalidade, setModalidade] = useState<"Remoto" | "Presencial">("Remoto");
  const [cidade, setCidade] = useState("");
  const [valor, setValor] = useState("");
  const [isCortesia, setIsCortesia] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ whatsappUrl: string } | null>(null);

  // Máscara de telefone/WhatsApp brasileiro (XX) 9XXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);

    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
    } else if (v.length > 0) {
      v = v.replace(/^(\d*)$/, "($1");
    }
    setWhatsappContratado(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas no cliente
    const rawDigits = whatsappContratado.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setError("Por favor, insira um número de WhatsApp válido com DDD.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailContratado.trim())) {
      setError("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    if (!lgpdConsent) {
      setError("É necessário concordar com os termos da LGPD para registrar o serviço.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          nomeContratado,
          whatsappContratado,
          emailContratado,
          nomeOuPerfilContratante:
            nomeOuPerfilContratante.trim() ||
            (tipo === "prestador" ? "Contratantes da Rede JobPago" : "Profissionais da Rede JobPago"),
          tituloServico,
          categoria,
          modalidade,
          cidade: modalidade === "Remoto" ? "100% Remoto" : cidade,
          valor: isCortesia ? 0 : valor,
          isCortesia,
          descricao,
          lgpdConsent,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Ocorreu um erro ao salvar o serviço.");
      }

      setSuccessData({ whatsappUrl: data.whatsappUrl });
      if (onSuccess) onSuccess();

      // Abrir o WhatsApp automaticamente em nova aba com o resumo completo
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de conexão ao salvar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="glass-panel glass-emerald p-8 sm:p-12 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          ✓
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
          Registro Concluído com Sucesso
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
          Serviço Cadastrado &amp; LGPD Validada!
        </h3>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-lg mx-auto">
          Os dados do contratado e as especificações para o contratante foram armazenados. Nós enviamos os serviços diretamente para os contratantes qualificados da rede.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={successData.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-emerald w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-xl"
          >
            <span>💬</span> Abrir WhatsApp com Contratante &amp; Contratado
          </a>
          <button
            onClick={() => {
              setSuccessData(null);
              setNomeContratado("");
              setWhatsappContratado("");
              setEmailContratado("");
              setTituloServico("");
              setDescricao("");
              setLgpdConsent(false);
            }}
            className="btn-secondary-glass w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
          >
            Cadastrar Novo Serviço
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto shadow-2xl relative border border-white/10 ${compact ? "" : "my-8"}`}>
      {/* CABEÇALHO */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Intermediação Ágil · Captura de Leads LGPD
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Cadastro de Serviços &amp; Conexão Direta
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Preencha os dados do serviço. <strong className="text-emerald-400 font-bold">Nós enviamos os serviços para o contratante</strong> e conectamos ambas as partes diretamente via WhatsApp com pagamento instantâneo por PIX.
        </p>
      </div>

      {/* SELETOR DE PAPEL: PRESTADOR VS CONTRATANTE */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-black/40 rounded-2xl border border-white/5">
        <button
          type="button"
          onClick={() => setTipo("prestador")}
          className={`py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            tipo === "prestador"
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>💼</span> Sou Prestador (Contratado)
        </button>
        <button
          type="button"
          onClick={() => setTipo("contratante")}
          className={`py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            tipo === "contratante"
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🏢</span> Busco Profissional (Contratante)
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* BLOCO 1: DADOS DO CONTATO / PRESTADOR */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
            1. Dados de Quem Oferece o Serviço (Contratado)
          </span>

          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">
              Nome Completo / Razão Social *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Allan Candido ou Tech Nômade Studio"
              value={nomeContratado}
              onChange={(e) => setNomeContratado(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-300 block mb-1">
                WhatsApp com DDD (Validado) *
              </label>
              <input
                type="tel"
                required
                placeholder="(24) 99332-6966"
                value={whatsappContratado}
                onChange={handlePhoneChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formato com DDD. Usado para validação e abertura direta.
              </span>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-300 block mb-1">
                E-mail Profissional (Validado) *
              </label>
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={emailContratado}
                onChange={(e) => setEmailContratado(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Para confirmação e envio da cópia do despacho.
              </span>
            </div>
          </div>
        </div>

        {/* BLOCO 2: DADOS DO CONTRATANTE / DESTINATÁRIO */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
            2. Destinatário do Serviço (Contratante)
          </span>

          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">
              Nome da Empresa Contratante ou Perfil-Alvo Buscado *
            </label>
            <input
              type="text"
              placeholder="Ex: Startups de Tecnologia, Donos de Pousadas, Proprietários de Motorhome..."
              value={nomeOuPerfilContratante}
              onChange={(e) => setNomeOuPerfilContratante(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-1.5 block leading-relaxed">
              💡 <em>Aviso de despacho:</em> <strong>Nós enviamos os serviços cadastrados diretamente para o contratante</strong> que você indicar ou para as empresas cadastradas no nosso banco de dados.
            </span>
          </div>
        </div>

        {/* BLOCO 3: ESPECIFICAÇÃO DO SERVIÇO */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
            3. Especificações da Demanda / Serviço
          </span>

          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">
              Título do Serviço Oferecido *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Automação de Processos com IA, Ponto de Apoio 220V em Paraty, Reforma Elétrica..."
              value={tituloServico}
              onChange={(e) => setTituloServico(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-300 block mb-1">Categoria *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                {CATEGORIAS_SERVICOS.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-300 block mb-1">Modalidade *</label>
              <select
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value as "Remoto" | "Presencial")}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="Remoto">Remoto (Atendimento Online Nacional)</option>
                <option value="Presencial">Presencial (Na Estrada / Local)</option>
              </select>
            </div>
          </div>

          {modalidade === "Presencial" && (
            <div>
              <label className="text-xs font-extrabold text-slate-300 block mb-1">
                Cidade &amp; Estado de Atendimento *
              </label>
              <input
                type="text"
                required={modalidade === "Presencial"}
                placeholder="Ex: Paraty / Angra dos Reis, RJ"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          )}

          {/* CORTESIA OU VALOR MONETÁRIO */}
          <div className="glass-card border border-amber-400/30 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <span>🛡️</span> Serviço 100% Gratuito / Cortesia 0800 (Alta Honra)
              </span>
              <span className="text-[10px] text-slate-400 block">
                Marque se for ponto de apoio solidário, recarga de van, ou mentoria cortesia.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isCortesia}
              onChange={(e) => setIsCortesia(e.target.checked)}
              className="w-5 h-5 accent-amber-400 cursor-pointer"
            />
          </div>

          {!isCortesia && (
            <div>
              <label className="text-xs font-extrabold text-slate-300 block mb-1">
                Orçamento Estimado / Tarifa Base (R$)
              </label>
              <input
                type="number"
                placeholder="Ex: 500 ou valor por hora"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">
              Descrição Detalhada do Serviço
            </label>
            <textarea
              rows={3}
              placeholder="Descreva as habilidades, prazos, infraestrutura disponível ou escopo do trabalho..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>

        {/* BLOCO 4: COMPLIANCE LGPD */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
          <input
            id="lgpdConsentInput"
            type="checkbox"
            required
            checked={lgpdConsent}
            onChange={(e) => setLgpdConsent(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-emerald-500 cursor-pointer shrink-0"
          />
          <label htmlFor="lgpdConsentInput" className="text-[11px] sm:text-xs text-slate-300 leading-relaxed cursor-pointer">
            <strong className="text-white font-bold">Consentimento LGPD (Lei nº 13.709/2018):</strong> Autorizo expressamente o JobPago a tratar meus dados de contato (telefone e e-mail) para a finalidade de intermediação e despacho de serviços para os contratantes da plataforma. Estou ciente de que poderei revogar o consentimento a qualquer momento de acordo com a{" "}
            <Link href="/privacidade" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
              Política de Privacidade
            </Link>{" "}
            e os{" "}
            <Link href="/termos" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
              Termos de Uso
            </Link>.
          </label>
        </div>

        {/* BOTÃO DE SUBMISSÃO */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary-emerald w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
          ) : (
            <>
              <span>🚀</span> Enviar Serviço para Contratante &amp; Despachar no WhatsApp
            </>
          )}
        </button>
      </form>
    </div>
  );
}
