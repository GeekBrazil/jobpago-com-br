// RASCUNHO - REVISAR COM ADVOGADO ANTES DE PUBLICAR
// Este documento representa uma minuta preliminar da Política de Privacidade
// para plataforma de marketplace passivo em conformidade com as diretrizes gerais da LGPD.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade · JobPago.com.br",
  description: "Política de Privacidade e tratamento de dados pessoais no JobPago.com.br.",
  robots: { index: true, follow: true },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-white/10">
        <Link href="/" className="text-xs font-black text-cyan-400 hover:underline uppercase tracking-widest block mb-6">
          ← Voltar para o JobPago
        </Link>

        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
          <strong>Aviso de Minuta Preliminar:</strong> Este documento é uma minuta preliminar em revisão jurídica e ainda não constitui a versão final da Política de Privacidade do JobPago.
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6">Política de Privacidade</h1>
        <p className="text-xs text-slate-400 mb-8">Última atualização: 29 de setembro de 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Identificação do Controlador</h2>
            <p>
              O controlador dos dados pessoais coletados nesta plataforma é <strong>Allan Candido</strong>, com contato pelo e-mail <strong>allan@jobpago.com.br</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Dados Coletados e Finalidade</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Cadastro de disponibilidade</strong> (quem busca renda): nome, WhatsApp, e-mail opcional, cidade e UF (ou &quot;na estrada&quot;), áreas de atuação, modo e horário. Finalidade: chamar a pessoa quando um negócio publicar tarefa compatível. Não é exibido publicamente.</li>
              <li><strong>Cadastro de tarefa ou serviço</strong>: nome, WhatsApp, e-mail e descrição. Finalidade: encaminhar o pedido pelo WhatsApp a quem combina com ele.</li>
              <li><strong>Botão de WhatsApp</strong>: antes de abrir a conversa, a pessoa escolhe o assunto (ex.: &quot;Sou negócio&quot;, &quot;Quero renda&quot;) e pode informar o nome. Finalidade: direcionar o atendimento.</li>
              <li><strong>Navegação</strong>: páginas vistas, tempo na página, rolagem, cliques e de onde veio a visita (ex.: Instagram, Google). Sem cookie e sem guardar o endereço IP; o navegador recebe um identificador aleatório. Finalidade: medir e melhorar o site.</li>
              <li><strong>Contato com empresas</strong>: usamos dados públicos do cadastro de CNPJ da Receita Federal (nome da empresa, cidade, setor, data de abertura e e-mail cadastrado) para convidar empresas ativas a usar a JobPago, com base no legítimo interesse (art. 7º, IX, da LGPD). Não enviamos a empresário individual nem MEI, limitamos a dois contatos por empresa e todo e-mail tem descadastro em um clique, respeitado para sempre.</li>
              <li><strong>Reputação (XP/Honra)</strong>: fica apenas no seu navegador.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Compartilhamento e Ausência de Dados Bancários</h2>
            <p>
              Como o JobPago é um marketplace passivo e não processa pagamentos, a plataforma <strong>não armazena nem processa dados de cartão de crédito, senhas bancárias ou chaves PIX privadas</strong>. Os dados de contato não ficam expostos em vitrine pública: são usados só para pôr as duas partes em contato, que então combinam o serviço diretamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Direitos do Titular (LGPD)</h2>
            <p>
              O titular dos dados pode solicitar a qualquer momento a confirmação de existência de tratamento, acesso, correção ou exclusão definitiva de seus dados de cadastro enviando solicitação para <strong>allan@jobpago.com.br</strong>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-500 text-center">
          © {new Date().getFullYear()} JobPago.com.br · Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
