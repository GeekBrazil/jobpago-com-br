// RASCUNHO - REVISAR COM ADVOGADO ANTES DE PUBLICAR
// Este documento representa uma minuta preliminar da estrutura de Termos de Uso
// para plataforma de marketplace passivo (sem custódia financeira).

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso · JobPago.com.br",
  description: "Termos de uso e diretrizes operacionais da plataforma JobPago.com.br — Marketplace Passivo.",
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-white/10">
        <Link href="/" className="text-xs font-black text-cyan-400 hover:underline uppercase tracking-widest block mb-6">
          ← Voltar para o JobPago
        </Link>

        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
          ⚠️ <strong>Aviso de Minuta Preliminar:</strong> Este documento é uma minuta preliminar em revisão jurídica e ainda não constitui a versão final dos Termos de Uso do JobPago.
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6">Termos de Uso</h1>
        <p className="text-xs text-slate-400 mb-8">Última atualização: Agosto de 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Natureza do Serviço (Marketplace Passivo)</h2>
            <p>
              O <strong>JobPago.com.br</strong> atua exclusivamente como mural e plataforma de conexão (marketplace passivo) entre contratantes e prestadores de serviços, nômades digitais e viajantes. A plataforma <strong>não é parte</strong> de nenhum contrato de prestação de serviços celebrado entre os usuários.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Ausência de Intermediação e Custódia Financeira</h2>
            <p>
              O JobPago <strong>não processa, não retém, não custodia e não garante pagamentos</strong>. Todo e qualquer valor (via PIX, Bitcoin, transferência bancária ou espécie) é negociado, ajustado e transferido <strong>direta e exclusivamente entre contratante e prestador</strong>, sem incidência de taxas de intermediação da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Responsabilidade das Partes</h2>
            <p>
              A negociação de escopo, prazos, preços, qualidade, execução e pagamento dos serviços é de responsabilidade estrita e exclusiva dos usuários envolvidos. O JobPago não se responsabiliza por eventuais inadimplementos, atrasos ou controvérsias comerciais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Identificação do Responsável</h2>
            <p>
              Plataforma mantida e operada por <strong>Allan Candido</strong> (allan@jobpago.com.br).
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
