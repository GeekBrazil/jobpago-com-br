import Link from "next/link";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";
import MenuNavegacao from "@/components/MenuNavegacao";

/* Cabeçalho das páginas de cidade — mesmo padrão de /como-funciona. */
export default async function CidadeTopo() {
  const i = await idiomaServidor();
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 backdrop-blur-2xl bg-[#07090e]/80">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 active:scale-95 transition-transform">
          <img src="/icon_flutuante-96.webp" width={36} height={36} alt="" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
          <span className="text-lg sm:text-xl font-black tracking-tight text-white">JobPago<span className="text-amber-400">.</span></span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link href="/refugio" className="btn-secondary-glass px-2.5 py-1.5 rounded-xl text-amber-300 border-amber-500/30 font-black whitespace-nowrap">🏨 {L(i, "Pedir Visita", "Pedir Visita", "Request Visit")}</Link>
          <Link href="/disponibilidade" className="btn-primary-amalfi px-2.5 py-1.5 rounded-xl font-black whitespace-nowrap">{L(i, "Meu Serviço", "Mi Servicio", "My Service")}</Link>
          <Link href="/cidade" className="hover:text-amber-400 hidden md:inline">{L(i, "Cidades", "Ciudades", "Towns")}</Link>
          <Link href="/expedicao" className="hover:text-amber-400 hidden md:inline">{L(i, "Expedição", "Expedición", "Expedition")}</Link>
          <Link href="/viajante" className="hover:text-amber-400 hidden sm:inline">{L(i, "Viajante", "Viajero", "Traveller")}</Link>
          <MenuNavegacao />
        </nav>
      </div>
    </header>
  );
}
