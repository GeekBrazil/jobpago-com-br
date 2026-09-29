"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/data/categorias";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";
import { tCategoria } from "@/lib/traducoesCadastro";
import CampoTelefone from "@/components/CampoTelefone";
import { normalizarTelefone } from "@/lib/telefone";

interface CadastroServicoLeadProps {
  tipoInicial?: "prestador" | "contratante";
  onSuccess?: () => void;
}

const CATEGORIAS_SERVICOS = CATEGORIAS.map((c) => ({ id: c.id, name: c.nome, icon: c.icone }));

export default function CadastroServicoLead({ onSuccess, tipoInicial = "prestador" }: CadastroServicoLeadProps) {
  const [idioma] = useIdioma();
  const [tipo, setTipo] = useState<"prestador" | "contratante">(tipoInicial);
  const isContratante = tipo === "contratante";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!normalizarTelefone(whatsappContratado)) {
      setError(L(idioma, "Por favor, informe um WhatsApp válido com DDD.", "Por favor, indicá un WhatsApp válido, con código de área.", "Please enter a valid WhatsApp number, with area code."));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailContratado.trim())) {
      setError(L(idioma, "Por favor, insira um endereço de e-mail válido.", "Por favor, ingresá un e-mail válido.", "Please enter a valid e-mail address."));
      return;
    }

    if (!lgpdConsent) {
      setError(L(idioma, "É necessário autorizar o tratamento de dados de acordo com a LGPD.", "Tenés que autorizar el tratamiento de datos según la LGPD.", "You need to authorise data processing under the LGPD."));
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
          idioma,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || L(idioma, "Ocorreu um erro ao salvar o serviço.", "Hubo un error al guardar.", "Something went wrong while saving."));
      }

      setSuccessData({ whatsappUrl: data.whatsappUrl });
      // central de prospecção (r.js): prestador = quer renda; contratante = negócio
      (window as unknown as { acLead?: (d: object) => void }).acLead?.({
        nome: nomeContratado,
        contato: whatsappContratado,
        seg: tipo === "prestador" ? "renda" : "negocio",
      });
      if (onSuccess) onSuccess();

      // Dispara abertura em nova janela com a mensagem estruturada
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : L(idioma, "Falha ao conectar com o servidor.", "No se pudo conectar con el servidor.", "Couldn't reach the server.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="glass-panel glass-amalfi p-8 sm:p-14 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl animate-fade-in border border-amber-500/30">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <Icon name="check" width={56} height={56} />
        </div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
          {L(idioma, "Despacho Protocolado", "Envío registrado", "Request logged")}
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
          {isContratante ? L(idioma, "Pedido cadastrado com sucesso!", "¡Pedido registrado!", "Request registered!") : L(idioma, "Serviço cadastrado com sucesso!", "¡Servicio registrado!", "Service registered!")}
        </h3>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-lg mx-auto">
          {isContratante
            ? L(idioma, "Os dados do seu pedido foram registrados sob a LGPD. O JobPago vai buscar um profissional qualificado na nossa rede.", "Los datos de tu pedido quedaron registrados según la LGPD. JobPago va a buscar un profesional calificado en la red.", "Your request was recorded under the LGPD. JobPago will look for a qualified professional in the network.")
            : L(idioma, "Os dados do contratado e do contratante foram registrados sob a LGPD. O JobPago fará o envio direto para a nossa rede qualificada.", "Los datos quedaron registrados según la LGPD. JobPago los envía directo a la red calificada.", "The details were recorded under the LGPD. JobPago will send them straight to the qualified network.")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={successData.whatsappUrl}
            data-direto
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-amalfi w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-xl"
          >
            <Icon name="chat" width={34} height={34} />{" "}
            {L(idioma, "Abrir o WhatsApp", "Abrir WhatsApp", "Open WhatsApp")}
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
            {L(idioma, "Cadastrar novo", "Registrar otro", "Register another")}
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            {L(idioma, "Cadastro de serviços · despacho direto", "Registro de servicios · envío directo", "Service sign-up · direct dispatch")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
            {L(idioma, "Nós enviamos os serviços para o contratante.", "Nosotros enviamos los servicios a quien contrata.", "We send the services to whoever is hiring.")}
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed font-normal">
            {L(idioma, "Sem muros de retenção, sem comissões sobre o seu trabalho. Faça o seu cadastro e nós conectamos você a oportunidades reais de contratação com pagamento direto por PIX.", "Sin muros ni comisiones sobre tu trabajo. Registrate y te conectamos con oportunidades reales, con pago directo por PIX.", "No walls, no commission on your work. Sign up and we connect you to real opportunities, paid directly via PIX.")}
          </p>
        </div>

        {/* TIMELINE EM 3 FASES */}
        <div className="flex flex-col gap-4 border-l border-white/10 pl-5 my-2">
          <div className="relative">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
              {L(idioma, "Fase 01", "Fase 01", "Step 01")}
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">{L(idioma, "Cadastro e validação", "Registro y validación", "Sign-up & validation")}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {L(idioma, "WhatsApp com DDD e e-mail validados para contato seguro e direto.", "WhatsApp y e-mail validados para un contacto seguro y directo.", "Validated WhatsApp and e-mail for safe, direct contact.")}
            </p>
          </div>

          <div className="relative">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
              {L(idioma, "Fase 02", "Fase 02", "Step 02")}
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">{L(idioma, "Envio pelo JobPago", "Envío por JobPago", "Sent by JobPago")}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {L(idioma, "Nós enviamos os seus serviços diretamente para os contratantes qualificados.", "Enviamos tus servicios directo a quienes contratan.", "We send your services straight to qualified clients.")}
            </p>
          </div>

          <div className="relative">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
              {L(idioma, "Fase 03", "Fase 03", "Step 03")}
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">{L(idioma, "PIX instantâneo", "PIX instantáneo", "Instant PIX")}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {L(idioma, "Negociação de valor e entrega combinada sem taxas de intermediação.", "Precio y entrega acordados sin comisiones de intermediación.", "Price and delivery agreed with no middleman fees.")}
            </p>
          </div>
        </div>

        {/* GARANTIA LGPD */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
          <Icon name="lock" width={40} height={40} className="text-amber-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-white">{L(idioma, "Privacidade e LGPD", "Privacidad y LGPD", "Privacy & LGPD")}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {L(idioma, "Tratamento exclusivo para intermediação conforme a Lei nº 13.709/2018. Seus dados nunca são vendidos a terceiros.", "Uso exclusivo para la intermediación según la Ley nº 13.709/2018 (LGPD). Tus datos nunca se venden.", "Used only for matching under Brazil's data law (LGPD, 13.709/2018). Your data is never sold.")}
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
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name="briefcase" width={32} height={32} /> {L(idioma, "Sou prestador", "Presto servicios", "I offer services")}
          </button>
          <button
            type="button"
            onClick={() => setTipo("contratante")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tipo === "contratante"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name="building" width={32} height={32} /> {L(idioma, "Preciso contratar", "Necesito contratar", "I need to hire")}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <Icon name="warning" width={32} height={32} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* IDENTIFICAÇÃO DO CONTRATADO */}
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              {isContratante ? L(idioma, "01. Seus dados de contato", "01. Tus datos de contacto", "01. Your contact details") : L(idioma, "01. Quem está oferecendo o serviço", "01. Quién ofrece el servicio", "01. Who is offering the service")}
            </span>

            <div>
              <label htmlFor="nome-contratado" className="text-xs font-bold text-slate-300 block mb-1.5">
                {isContratante ? L(idioma, "Nome completo ou empresa *", "Nombre completo o empresa *", "Full name or company *") : L(idioma, "Nome completo ou nome profissional *", "Nombre completo o profesional *", "Full or professional name *")}
              </label>
              <input
                type="text"
                required
                placeholder={isContratante ? L(idioma, "Ex.: Pousada Vista Mar", "Ej.: Posada Vista Mar", "e.g. Vista Mar Guesthouse") : L(idioma, "Ex.: Ana Souza · fotógrafa", "Ej.: Ana Souza · fotógrafa", "e.g. Ana Souza · photographer")}
                id="nome-contratado"
                value={nomeContratado}
                onChange={(e) => setNomeContratado(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatsapp-contratado" className="text-xs font-bold text-slate-300 block mb-1.5">
                  {L(idioma, "WhatsApp com DDD *", "WhatsApp (país y número) *", "WhatsApp (country and number) *")}
                </label>
                <CampoTelefone id="whatsapp-contratado" onChange={setWhatsappContratado} />
              </div>

              <div>
                <label htmlFor="email-contratado" className="text-xs font-bold text-slate-300 block mb-1.5">
                  {isContratante ? L(idioma, "E-mail de contato *", "E-mail de contacto *", "Contact e-mail *") : L(idioma, "E-mail profissional *", "E-mail profesional *", "Work e-mail *")}
                </label>
                <input
                  type="email"
                  required
                  placeholder="contato@exemplo.com"
                  id="email-contratado"
                value={emailContratado}
                  onChange={(e) => setEmailContratado(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* DESTINATÁRIO: CONTRATANTE OU PERFIL DO PROFISSIONAL */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              {isContratante ? L(idioma, "02. Que profissional você precisa", "02. Qué profesional necesitás", "02. What professional you need") : L(idioma, "02. Para quem é o serviço", "02. Para quién es el servicio", "02. Who the service is for")}
            </span>

            <div>
              <label htmlFor="perfil-contratante" className="text-xs font-bold text-slate-300 block mb-1.5">
                {isContratante
                  ? L(idioma, "Perfil do profissional que você procura *", "Perfil del profesional que buscás *", "Profile of the professional you need *")
                  : L(idioma, "Empresa ou perfil de quem deve receber a proposta *", "Empresa o perfil de quien debe recibir la propuesta *", "Company or profile that should receive the offer *")}
              </label>
              <input
                type="text"
                placeholder={
                  isContratante
                    ? L(idioma, "Ex.: motorista para frete de retorno, fotógrafo, dev...", "Ej.: chofer para flete de vuelta, fotógrafo, dev...", "e.g. return-freight driver, photographer, developer...")
                    : L(idioma, "Ex.: pousadas, donos de van, produtores de conteúdo...", "Ej.: posadas, dueños de vans, creadores de contenido...", "e.g. guesthouses, van owners, content creators...")
                }
                id="perfil-contratante"
                value={nomeOuPerfilContratante}
                onChange={(e) => setNomeOuPerfilContratante(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isContratante
                  ? L(idioma, "Nós buscamos na rede um profissional qualificado com esse perfil.", "Buscamos en la red un profesional calificado con ese perfil.", "We look for a qualified professional with that profile in the network.")
                  : L(idioma, "Nós enviamos os serviços para o contratante de acordo com o perfil que você indicar.", "Enviamos los servicios a quien contrata según el perfil que indiques.", "We send your services to clients matching the profile you give.")}
              </span>
            </div>
          </div>

          {/* DETALHES DO SERVIÇO */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              {L(idioma, "03. Detalhes", "03. Detalles", "03. Details")}
            </span>

            <div>
              <label htmlFor="titulo-servico" className="text-xs font-bold text-slate-300 block mb-1.5">
                {isContratante ? L(idioma, "O que você precisa (a tarefa) *", "Qué necesitás (la tarea) *", "What you need (the task) *") : L(idioma, "Título do serviço *", "Título del servicio *", "Service title *")}
              </label>
              <input
                type="text"
                required
                placeholder={
                  isContratante
                    ? L(idioma, "Ex.: fotos da pousada para o Instagram...", "Ej.: fotos de la posada para Instagram...", "e.g. photos of the guesthouse for Instagram...")
                    : L(idioma, "Ex.: edição de vídeo, manutenção solar para vans...", "Ej.: edición de video, mantenimiento solar para vans...", "e.g. video editing, solar maintenance for vans...")
                }
                id="titulo-servico"
                value={tituloServico}
                onChange={(e) => setTituloServico(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoria-servico" className="text-xs font-bold text-slate-300 block mb-1.5">{L(idioma, "Categoria", "Categoría", "Category")}</label>
                <select
                  id="categoria-servico"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {CATEGORIAS_SERVICOS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {tCategoria(idioma, c.id, c.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modalidade-servico" className="text-xs font-bold text-slate-300 block mb-1.5">{L(idioma, "Modalidade", "Modalidad", "Mode")}</label>
                <select
                  id="modalidade-servico"
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value as "Remoto" | "Presencial")}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Remoto">{L(idioma, "Remoto (online)", "Remoto (online)", "Remote (online)")}</option>
                  <option value="Presencial">{L(idioma, "Presencial (local ou estrada)", "Presencial (local o ruta)", "In person (local or on the road)")}</option>
                </select>
              </div>
            </div>

            {modalidade === "Presencial" && (
              <div>
                <label htmlFor="cidade-atendimento" className="text-xs font-bold text-slate-300 block mb-1.5">
                  {L(idioma, "Cidade e estado de atendimento *", "Ciudad y estado *", "Town and state *")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={L(idioma, "Ex.: Paraty, RJ", "Ej.: Paraty, RJ", "e.g. Paraty, RJ")}
                  id="cidade-atendimento"
                value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            )}

            {/* CORTESIA VS ORÇAMENTO */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-950/20 border border-amber-400/20">
              <div>
                <label htmlFor="cortesia-solidaria" className="text-xs font-black text-amber-300 flex items-center gap-1.5 cursor-pointer">
                  <Icon name="shield" width={30} height={30} /> {L(idioma, "Cortesia solidária (grátis)", "Cortesía solidaria (gratis)", "Free, solidarity help")}
                </label>
                <span className="text-[10px] text-slate-400 block">
                  {L(idioma, "Ponto de apoio na estrada, recarga elétrica ou mentoria voluntária.", "Punto de apoyo en la ruta, carga eléctrica o mentoría voluntaria.", "A support stop on the road, power top-up or volunteer mentoring.")}
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
                  {L(idioma, "Orçamento estimado ou tarifa base (R$)", "Presupuesto estimado o tarifa base (R$)", "Estimated budget or base rate (R$)")}
                </label>
                <input
                  type="number"
                  placeholder={L(idioma, "Ex.: 1500", "Ej.: 1500", "e.g. 1500")}
                  id="orcamento"
                value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                />
              </div>
            )}

            <div>
              <label htmlFor="descricao-escopo" className="text-xs font-bold text-slate-300 block mb-1.5">
                {L(idioma, "Descrição", "Descripción", "Description")}
              </label>
              <textarea
                id="descricao-escopo"
                rows={3}
                placeholder={L(idioma, "Descreva detalhes práticos, entregas e diferenciais...", "Describí detalles prácticos, entregables y diferenciales...", "Describe practical details, deliverables and what stands out...")}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* CONSENTIMENTO LGPD */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-3">
            <input
              id="lgpdConsentInput"
              type="checkbox"
              required
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-amber-500 cursor-pointer shrink-0"
            />
            <label htmlFor="lgpdConsentInput" className="text-[11px] text-slate-300 leading-relaxed cursor-pointer">
              <strong className="text-white font-bold">{L(idioma, "Consentimento LGPD (Lei nº 13.709/2018):", "Consentimiento LGPD (Ley nº 13.709/2018):", "LGPD consent (Law 13.709/2018):")}</strong> {L(idioma, "Autorizo expressamente o JobPago a tratar meus dados de contato para a finalidade exclusiva de intermediação e envio de serviços. Conheço a", "Autorizo expresamente a JobPago a tratar mis datos de contacto solo para intermediar y enviar servicios. Conozco la", "I expressly allow JobPago to process my contact details solely to match and send services. I have read the")}{" "}
              <Link href="/privacidade" target="_blank" className="text-amber-400 underline hover:text-amber-300">
                {L(idioma, "Política de Privacidade", "Política de Privacidad", "Privacy Policy")}
              </Link>{" "}
              {L(idioma, "e os", "y los", "and the")}{" "}
              <Link href="/termos" target="_blank" className="text-amber-400 underline hover:text-amber-300">
                {L(idioma, "Termos de Uso", "Términos de Uso", "Terms of Use")}
              </Link>.
            </label>
          </div>

          {/* BOTÃO DE AÇÃO */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-amalfi w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
            ) : (
              <>
                <Icon name="rocket" width={34} height={34} />{" "}
                {isContratante
                  ? L(idioma, "Enviar pedido e abrir o WhatsApp", "Enviar pedido y abrir WhatsApp", "Send request and open WhatsApp")
                  : L(idioma, "Enviar serviço e abrir o WhatsApp", "Enviar servicio y abrir WhatsApp", "Send service and open WhatsApp")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
