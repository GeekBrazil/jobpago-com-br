import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { CATEGORIAS } from "@/data/categorias";

export const metadata: Metadata = {
  title: "Como Funciona · JobPago.com.br",
  description:
    "Entenda como o JobPago conecta quem precisa contratar e quem presta serviço na estrada, sem comissão e com pagamento direto por PIX.",
  robots: { index: true, follow: true },
};

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* HEADER SIMPLES DE NAVEGAÇÃO */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:border-emerald-400 transition-colors">
              <img
                src="/icon_flutuante-96.webp"
                width={96}
                height={96}
                alt="JobPago Logo"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                JobPago<span className="text-emerald-400">.</span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                Renda &amp; Estrada
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            ← Voltar para a Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* HERO */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Guia Rápido
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl font-black text-white leading-[1.12]">
            Como Funciona o JobPago
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Um mapa de conexão direta entre quem precisa de um serviço e quem tá
            na estrada pra fazer — dev, eletricista, caminhoneiro, motorhome com
            ponto de apoio. Sem comissão sobre o seu trabalho e sem checkout na
            plataforma: o valor é combinado e pago direto por PIX entre as duas
            partes.
          </p>
        </div>

        {/* DOIS LADOS, UMA REDE */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-black text-white">Dois lados, uma rede</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Não importa se você precisa contratar ou se você é quem presta o
            serviço — os dois caminhos abaixo levam pro mesmo mapa.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel border border-emerald-500/20 rounded-3xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Icon name="building" width={22} height={22} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-white">Quem precisa contratar</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
                <li className="flex gap-2.5">
                  <Icon name="check" width={16} height={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">+ Anunciar Vaga</strong> no topo publica sua
                    vaga no mapa e no feed em tempo real. Quem tem interesse te chama
                    direto no WhatsApp.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Icon name="check" width={16} height={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Ou usa{" "}
                    <Link href="/cadastrar-servico" className="text-emerald-400 underline hover:text-emerald-300">
                      Cadastrar Serviço
                    </Link>{" "}
                    → aba <strong className="text-white">Preciso Contratar</strong>: descreve o
                    que precisa e a gente busca alguém qualificado na rede.
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mb-4">
                <Icon name="briefcase" width={22} height={22} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-black text-white">Quem presta o serviço</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
                <li className="flex gap-2.5">
                  <Icon name="check" width={16} height={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Filtra o mapa ou o feed pela sua categoria (Nômade & Infra,
                    Estrada & Cargas, Tecnologia & TI...) e chama direto no
                    WhatsApp de quem publicou.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Icon name="check" width={16} height={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Ou usa{" "}
                    <Link href="/cadastrar-servico" className="text-emerald-400 underline hover:text-emerald-300">
                      Cadastrar Serviço
                    </Link>{" "}
                    → aba <strong className="text-white">Sou Prestador</strong>: cadastra uma vez e
                    a gente te envia pra contratantes qualificados da rede.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* DOIS CAMINHOS PRA FECHAR NEGÓCIO */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-black text-white">Dois caminhos pra fechar negócio</h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                Caminho 01
              </span>
              <h3 className="text-base font-black text-white mt-1">Mapa & Feed em Tempo Real</h3>
              <div className="flex flex-col gap-4 border-l border-white/10 pl-5 mt-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 1</span>
                  <p className="text-sm text-white font-bold mt-0.5">Publicar ou buscar</p>
                  <p className="text-xs text-slate-400 mt-1">Uma vaga aparece no mapa/feed, ou você filtra por categoria e cidade.</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 2</span>
                  <p className="text-sm text-white font-bold mt-0.5">Contato direto no WhatsApp</p>
                  <p className="text-xs text-slate-400 mt-1">O botão &quot;Ver Detalhes&quot; abre uma conversa direta com quem publicou. Sem intermediário lendo a conversa.</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 3</span>
                  <p className="text-sm text-white font-bold mt-0.5">Combinado & PIX direto</p>
                  <p className="text-xs text-slate-400 mt-1">Valor, prazo e entrega são negociados entre vocês. O PIX vai direto pra sua chave.</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                Caminho 02
              </span>
              <h3 className="text-base font-black text-white mt-1">Cadastro & Despacho</h3>
              <div className="flex flex-col gap-4 border-l border-white/10 pl-5 mt-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 1</span>
                  <p className="text-sm text-white font-bold mt-0.5">Cadastro & validação</p>
                  <p className="text-xs text-slate-400 mt-1">WhatsApp com DDD e e-mail validados, pra contato seguro dos dois lados.</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 2</span>
                  <p className="text-sm text-white font-bold mt-0.5">Envio pelo JobPago</p>
                  <p className="text-xs text-slate-400 mt-1">A gente lê o pedido e despacha no WhatsApp pra rede que bate com o perfil que você descreveu.</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Passo 3</span>
                  <p className="text-sm text-white font-bold mt-0.5">PIX instantâneo</p>
                  <p className="text-xs text-slate-400 mt-1">Negociação de valor e entrega combinada, sem taxa de intermediação.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PIX DIRETO, SEM COMISSÃO */}
        <section className="mt-16 glass-panel border border-emerald-500/20 rounded-3xl p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Icon name="bolt" width={22} height={22} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">PIX direto, sem comissão</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                O JobPago não guarda seu dinheiro nem cobra porcentagem sobre o
                que você ganha. Não existe checkout dentro da plataforma: o
                valor combinado é pago direto na chave PIX de quem prestou o
                serviço, sem passar pela mão de ninguém no meio.
              </p>
            </div>
          </div>
        </section>

        {/* ALTA HONRA */}
        <section className="mt-10 glass-panel glass-amber border border-amber-400/25 rounded-3xl p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Icon name="shield" width={22} height={22} className="text-amber-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-black text-white">Alta Honra: reputação de quem ajuda na estrada</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                A régua de Honra mede quem mais agrega valor pra comunidade.
                Marque uma vaga como <strong className="text-amber-300">Cortesia Solidária 0800</strong> (chuveiro,
                tomada, recarga, mentoria de graça pra quem tá na estrada) e
                ganhe pontos que sobem seu nível — cada nível pede 40% a mais
                de XP que o anterior, então nível alto é reputação real, não
                cadastro.
              </p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <div className="glass-card border border-amber-400/20 rounded-2xl p-4">
                  <span className="text-amber-300 font-black text-sm">+200 XP · +50 PTS</span>
                  <p className="text-xs text-slate-400 mt-1">Oferecer um serviço 100% cortesia.</p>
                </div>
                <div className="glass-card border border-amber-400/20 rounded-2xl p-4">
                  <span className="text-amber-300 font-black text-sm">+150 XP · +10 PTS</span>
                  <p className="text-xs text-slate-400 mt-1">Publicar uma oportunidade na guilda.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIAS */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-black text-white">8 tribos, 1 mapa</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Cada categoria já tem gente publicando e procurando. Encontre a sua.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIAS.map((cat) => (
              <div key={cat.id} className="glass-card rounded-2xl p-5 border border-white/10">
                <Icon name={cat.icone} width={28} height={28} />
                <h3 className="text-sm font-black text-white mt-3">{cat.nome}</h3>
                <p className="text-xs text-slate-400 mt-1">{cat.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mt-16 text-center glass-panel border border-white/10 rounded-3xl p-8 sm:p-12">
          <h2 className="text-xl sm:text-2xl font-black text-white">Pronto pra começar?</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Explore o que já tem publicado no mapa ou cadastre sua demanda —
            os dois caminhos levam pra mesma rede.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/#mapa-gps"
              className="btn-primary-emerald w-full sm:w-auto px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm sm:text-base font-black shadow-lg cursor-pointer"
            >
              <Icon name="compass" width={16} height={16} /> Explorar Mapa & Serviços
            </Link>
            <Link
              href="/cadastrar-servico"
              className="btn-secondary-glass w-full sm:w-auto px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base font-bold cursor-pointer"
            >
              <Icon name="handshake" width={16} height={16} /> Oferecer ou Contratar
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JobPago.com.br · Marketplace Passivo mantido por Allan Candido.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/termos" className="hover:text-emerald-400 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-emerald-400 transition-colors">
              Política de Privacidade
            </Link>
            <a href="mailto:allan@jobpago.com.br" className="hover:text-emerald-400 transition-colors">
              allan@jobpago.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
