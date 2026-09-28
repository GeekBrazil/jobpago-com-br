import Link from "next/link";

/* Cabeçalho das páginas de cidade — mesmo padrão de /como-funciona. */
export default function CidadeTopo() {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/icon_flutuante-96.webp" width={36} height={36} alt="" className="w-9 h-9 object-contain" />
          <span className="text-xl font-black tracking-tight text-white">JobPago<span className="text-amber-400">.</span></span>
        </Link>
        <nav className="flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link href="/cidade" className="hover:text-amber-400">Cidades</Link>
          <Link href="/expedicao" className="hover:text-amber-400">Expedição</Link>
          <Link href="/como-funciona" className="hover:text-amber-400 hidden sm:inline">Como funciona</Link>
        </nav>
      </div>
    </header>
  );
}
