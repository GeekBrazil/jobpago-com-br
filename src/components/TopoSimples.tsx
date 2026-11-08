import Link from "next/link";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import MenuNavegacao from "@/components/MenuNavegacao";

/* Cabeçalho das páginas internas (logo + voltar), no idioma do site. */
export default async function TopoSimples() {
  const i = await idiomaServidor();
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:border-amber-400 transition-colors">
            <img src="/icon_flutuante-96.webp" width={96} height={96} alt="JobPago" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-white leading-none">JobPago<span className="text-amber-400">.</span></span>
            <span className="hidden sm:block text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mt-0.5">{L(i, "renda na viagem", "ingresos en el viaje", "income on the go")}</span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/refugio" className="btn-secondary-glass text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-2 rounded-xl text-amber-300 border-amber-500/30 hover:border-amber-400 flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 transition-transform">
            <span>🏨</span>
            <span>{L(i, "Pedir Visita", "Pedir Visita", "Request Visit")}</span>
          </Link>
          <Link href="/disponibilidade" className="btn-primary-amalfi text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0 active:scale-95 transition-transform">
            {L(i, "Meu Serviço", "Mi Servicio", "My Service")}
          </Link>
          <Link href="/" className="btn-secondary-glass text-xs font-bold px-3 py-2 rounded-xl hidden sm:flex items-center gap-1.5">
            ← {L(i, "Home", "Inicio", "Home")}
          </Link>
          <MenuNavegacao />
        </div>
      </div>
    </header>
  );
}
