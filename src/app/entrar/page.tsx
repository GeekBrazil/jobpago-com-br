"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function FormularioEntrar() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const temGoogle = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
  const temFacebook = process.env.NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const res = await signIn("credentials", { email, senha, redirect: false });
    setEnviando(false);
    if (res?.error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl p-8">
        <Link href="/" className="text-xl font-black text-white block mb-8">
          JobPago<span className="text-emerald-400">.</span>
        </Link>

        <h1 className="text-lg font-bold text-white mb-1">Entrar</h1>
        <p className="text-xs text-slate-400 mb-6">Pra anunciar uma vaga, primeiro entra na sua conta.</p>

        {(temGoogle || temFacebook) && (
          <div className="flex flex-col gap-2 mb-6">
            {temGoogle && (
              <button
                onClick={() => signIn("google", { callbackUrl })}
                className="w-full border border-white/15 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-white/5 cursor-pointer"
              >
                Continuar com Google
              </button>
            )}
            {temFacebook && (
              <button
                onClick={() => signIn("facebook", { callbackUrl })}
                className="w-full border border-white/15 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-white/5 cursor-pointer"
              >
                Continuar com Facebook
              </button>
            )}
            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[10px] text-slate-500 uppercase font-mono">ou</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
          />
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="bg-emerald-500 text-black font-black text-sm py-2.5 rounded-xl cursor-pointer disabled:opacity-50 mt-1"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Não tem conta?{" "}
          <Link href={`/cadastrar?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-emerald-400 font-bold">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <FormularioEntrar />
    </Suspense>
  );
}
