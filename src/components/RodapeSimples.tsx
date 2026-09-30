import Link from "next/link";
import { idiomaServidor } from "@/lib/idiomaServidor";
import { L } from "@/lib/i18n";

/* Rodapé das páginas internas, no idioma do site. */
export default async function RodapeSimples() {
  const i = await idiomaServidor();
  return (
    <footer className="border-t border-white/10 py-12 px-4 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} JobPago.com.br · {L(i, "mantido por Allan Candido", "mantenido por Allan Candido", "run by Allan Candido")}.</p>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <Link href="/termos" className="hover:text-amber-400 transition-colors">{L(i, "Termos de Uso", "Términos de Uso", "Terms of Use")}</Link>
          <Link href="/privacidade" className="hover:text-amber-400 transition-colors">{L(i, "Política de Privacidade", "Política de Privacidad", "Privacy Policy")}</Link>
          <a href="mailto:jobpago@allancandido.com" className="hover:text-amber-400 transition-colors">jobpago@allancandido.com</a>
        </div>
      </div>
      <p className="max-w-7xl mx-auto mt-4 text-[11px] text-slate-500 leading-relaxed">62.685.514 ALLAN CANDIDO · CNPJ 62.685.514/0001-85 · Rua Leontino Antonio de Souza, 85, Água Santa, Angra dos Reis/RJ, CEP 23915-505</p>
    </footer>
  );
}
