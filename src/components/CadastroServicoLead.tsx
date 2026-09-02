"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/data/categorias";
import Link from "next/link";

interface CadastroServicoLeadProps {
  onSuccess?: () => void;
}

const CATEGORIAS_SERVICOS = CATEGORIAS.map((c) => ({ id: c.id, name: c.nome, icon: c.icone }));

export default function CadastroServicoLead({ onSuccess }: CadastroServicoLeadProps) {
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

    const rawDigits = whatsappContratado.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setError("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailContratado.trim())) {
      setError("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    if (!lgpdConsent) {
      setError("É necessário autorizar o tratamento de dados de acordo com a LGPD.");
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

      // Dispara abertura em nova janela com a mensagem estruturada
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao conectar com o servidor.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="glass-panel glass-emerald p-8 sm:p-14 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl animate-fade-in border border-emerald-500/30">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          ✓
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
          Despacho Protocolado
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
          Serviço Cadastrado com Sucesso!
        </h3>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-lg mx-auto">
          Os dados do contratado e do contratante foram registrados sob a LGPD. O JobPago fará o envio direto para a nossa rede qualificada.
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start max-w-6xl mx-auto">
      {/* ── COLUNA ESQUERDA: DIRETRIZ EDITORIAL & PROPOSTA DE VALOR ── */}
      <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Cadastro de Serviços · Despacho Direto
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
            Nós enviamos os serviços para o contratante.
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed font-normal">
            Sem muros de retenção, sem comissões sobre o seu trabalho. Faça o seu Cadastro de Serviços e nós conectamos você a oportunidades reais de contratação com pagamento direto por PIX.
          </p>
        </div>

        {/* TIMELINE EM 3 FASES */}
        <div className="flex flex-col gap-4 border-l border-white/10 pl-5 my-2">
          <div className="relative">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
              Fase 01
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">Cadastro &amp; Validação</h2>
            <p className="text-xs text-slate-400 mt-1">
              WhatsApp com DDD e e-mail validados para contato seguro e direto.
            </p>
          </div>

          <div className="relative">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
              Fase 02
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">Envio pelo JobPago</h2>
            <p className="text-xs text-slate-400 mt-1">
              Nós enviamos os seus serviços diretamente para os contratantes qualificados.
            </p>
          </div>

          <div className="relative">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
              Fase 03
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">PIX Instantâneo</h2>
            <p className="text-xs text-slate-400 mt-1">
              Negociação de valor e entrega combinada sem taxas de intermediação.
            </p>
          </div>
        </div>

        {/* GARANTIA LGPD */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
          <span className="text-lg">🔒</span>
          <div>
            <h3 className="text-xs font-bold text-white">Privacidade &amp; LGPD</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Tratamento exclusivo para intermediação conforme a Lei nº 13.709/2018. Seus dados nunca são vendidos a terceiros.
            </p>
          </div>
        </div>
      </div>

      {/* ── COLUNA DIREITA: FORMULÁRIO EDITORIAL REFINADO ── */}
      <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative">
        {/* SELETOR SEGMENTADO */}
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => setTipo("prestador")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
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
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tipo === "contratante"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🏢</span> Preciso Contratar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* IDENTIFICAÇÃO DO CONTRATADO */}
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              01. Quem Está Oferecendo o Serviço (Contratado)
            </span>

            <div>
              <label htmlFor="nome-contratado" className="text-xs font-bold text-slate-300 block mb-1.5">
                Nome Completo ou Nome Profissional *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Allan Candido · Dev Nômade"
                id="nome-contratado"
                value={nomeContratado}
                onChange={(e) => setNomeContratado(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatsapp-contratado" className="text-xs font-bold text-slate-300 block mb-1.5">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(24) 99332-6966"
                  id="whatsapp-contratado"
                value={whatsappContratado}
                  onChange={handlePhoneChange}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                />
              </div>

              <div>
                <label htmlFor="email-contratado" className="text-xs font-bold text-slate-300 block mb-1.5">
                  E-mail Profissional *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contato@exemplo.com"
                  id="email-contratado"
                value={emailContratado}
                  onChange={(e) => setEmailContratado(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* DESTINATÁRIO: CONTRATANTE */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              02. Destinatário do Serviço (Contratante)
            </span>

            <div>
              <label htmlFor="perfil-contratante" className="text-xs font-bold text-slate-300 block mb-1.5">
                Empresa ou Perfil do Contratante que Deve Receber a Proposta *
              </label>
              <input
                type="text"
                placeholder="Ex: Startups, Donos de Vans, Pousadas, Produtores de Conteúdo..."
                id="perfil-contratante"
                value={nomeOuPerfilContratante}
                onChange={(e) => setNomeOuPerfilContratante(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nós enviamos os serviços para o contratante de acordo com o perfil que você indicar.
              </span>
            </div>
          </div>

          {/* DETALHES DO SERVIÇO */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              03. Especificações da Demanda
            </span>

            <div>
              <label htmlFor="titulo-servico" className="text-xs font-bold text-slate-300 block mb-1.5">
                Título do Serviço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Desenvolvimento Next.js, Manutenção Solar para Vans..."
                id="titulo-servico"
                value={tituloServico}
                onChange={(e) => setTituloServico(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoria-servico" className="text-xs font-bold text-slate-300 block mb-1.5">Categoria</label>
                <select
                  id="categoria-servico"
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
                <label htmlFor="modalidade-servico" className="text-xs font-bold text-slate-300 block mb-1.5">Modalidade</label>
                <select
                  id="modalidade-servico"
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value as "Remoto" | "Presencial")}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="Remoto">Remoto (Atendimento Online Nacional)</option>
                  <option value="Presencial">Presencial (Local / Estrada)</option>
                </select>
              </div>
            </div>

            {modalidade === "Presencial" && (
              <div>
                <label htmlFor="cidade-atendimento" className="text-xs font-bold text-slate-300 block mb-1.5">
                  Cidade e Estado de Atendimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paraty / Angra dos Reis, RJ"
                  id="cidade-atendimento"
                value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            )}

            {/* CORTESIA VS ORÇAMENTO */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-950/20 border border-amber-400/20">
              <div>
                <label htmlFor="cortesia-solidaria" className="text-xs font-black text-amber-300 flex items-center gap-1.5 cursor-pointer">
                  <span>🛡️</span> Cortesia Solidária 0800 (Alta Honra)
                </label>
                <span className="text-[10px] text-slate-400 block">
                  Ponto de apoio na estrada, recarga elétrica ou mentoria voluntária.
                </span>
              </div>
              <input
                id="cortesia-solidaria"
                type="checkbox"
                checked={isCortesia}
                onChange={(e) => setIsCortesia(e.target.checked)}
                className="w-5 h-5 accent-amber-400 cursor-pointer"
              />
            </div>

            {!isCortesia && (
              <div>
                <label htmlFor="orcamento" className="text-xs font-bold text-slate-300 block mb-1.5">
                  Orçamento Estimado ou Tarifa Base (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 1500"
                  id="orcamento"
                value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                />
              </div>
            )}

            <div>
              <label htmlFor="descricao-escopo" className="text-xs font-bold text-slate-300 block mb-1.5">
                Descrição do Escopo
              </label>
              <textarea
                id="descricao-escopo"
                rows={3}
                placeholder="Descreva detalhes práticos, entregáveis e diferenciais do serviço..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* CONSENTIMENTO LGPD */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
            <input
              id="lgpdConsentInput"
              type="checkbox"
              required
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-emerald-500 cursor-pointer shrink-0"
            />
            <label htmlFor="lgpdConsentInput" className="text-[11px] text-slate-300 leading-relaxed cursor-pointer">
              <strong className="text-white font-bold">Consentimento LGPD (Lei nº 13.709/2018):</strong> Autorizo expressamente o JobPago a tratar meus dados de contato para a finalidade exclusiva de intermediação e despacho de serviços para os contratantes. Conheço a{" "}
              <Link href="/privacidade" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
                Política de Privacidade
              </Link>{" "}
              e os{" "}
              <Link href="/termos" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
                Termos de Uso
              </Link>.
            </label>
          </div>

          {/* BOTÃO DE AÇÃO */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-emerald w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
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
    </div>
  );
}
