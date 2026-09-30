import Link from "next/link";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

/* Cabeçalho das páginas internas (logo + voltar), no idioma do site. */
export default async function TopoSimples() {
  const i = await idiomaServidor();
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:border-amber-400 transition-colors">
            <img src="/icon_flutuante-96.webp" width={96} height={96} alt="JobPago" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">JobPago<span className="text-amber-400">.</span></span>
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mt-0.5">{L(i, "renda na viagem", "ingresos en el viaje", "income on the go")}</span>
          </div>
        </Link>
        <Link href="/" className="btn-secondary-glass text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5">← {L(i, "Voltar para a Home", "Volver al inicio", "Back to home")}</Link>
      </div>
    </header>
  );
}
