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
          ⚠️ <strong>Aviso de Minuta Preliminar:</strong> Este documento é uma minuta preliminar em revisão jurídica e ainda não constitui a versão final da Política de Privacidade do JobPago.
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6">Política de Privacidade</h1>
        <p className="text-xs text-slate-400 mb-8">Última atualização: Agosto de 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Identificação do Controlador</h2>
            <p>
              O controlador dos dados pessoais coletados nesta plataforma é <strong>Allan Candido</strong>, com contato pelo e-mail <strong>allan@jobpago.com.br</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Dados Coletados e Finalidade</h2>
            <p>
              Coletamos apenas as informações voluntariamente fornecidas pelo usuário ao publicar anúncios ou criar perfis (como nome de exibição, e-mail de contato, número de WhatsApp para direcionamento e localização aproximada de serviços).
            </p>
            <p className="mt-2">
              <strong>Finalidade:</strong> Permitir a exibição de anúncios no mural, viabilizar o contato direto entre contratantes e prestadores e operacionalizar a gamificação de reputação (XP/Honra).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Compartilhamento e Ausência de Dados Bancários</h2>
            <p>
              Como o JobPago é um marketplace passivo e não processa pagamentos, a plataforma <strong>não armazena nem processa dados de cartão de crédito, senhas bancárias ou chaves PIX privadas</strong>. Os dados de contato informados em anúncios públicos ficam visíveis a outros usuários para que possam combinar os serviços diretamente.
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
