import Link from "next/link";
import CidadeTopo from "./cidade/CidadeTopo";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

export default async function NaoEncontrado() {
  const i = await idiomaServidor();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">404</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{t("Essa página saiu da rota", "Esta página se salió de la ruta", "This page went off route")}</h1>
        <p className="mt-4 text-slate-300">{t("O endereço não existe ou mudou de lugar.", "La dirección no existe o cambió de lugar.", "The address doesn't exist or has moved.")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary-amalfi rounded-2xl px-6 py-3 text-sm font-black">{t("Voltar para o início", "Volver al inicio", "Back to home")}</Link>
          <Link href="/cidade" className="btn-secondary-glass rounded-2xl px-6 py-3 text-sm font-bold">{t("Relatório da sua cidade", "Informe de tu ciudad", "Your town report")}</Link>
        </div>
      </main>
    </div>
  );
}
