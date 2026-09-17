"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function FormularioCadastro() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    const res = await fetch("/api/auth/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone, senha }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErro(data.error || "Erro ao criar conta.");
      setEnviando(false);
      return;
    }

    const loginRes = await signIn("credentials", { email, senha, redirect: false });
    setEnviando(false);
    if (loginRes?.error) {
      router.push("/entrar");
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

        <h1 className="text-lg font-bold text-white mb-1">Criar conta</h1>
        <p className="text-xs text-slate-400 mb-6">Rapidinho — só pra anunciar sua vaga com segurança.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
          />
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
          />
          <input
            type="tel"
            required
            placeholder="WhatsApp (DDD + número)"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Senha (mínimo 8 caracteres)"
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
            {enviando ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Já tem conta?{" "}
          <Link href={`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-emerald-400 font-bold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CadastrarPage() {
  return (
    <Suspense fallback={null}>
      <FormularioCadastro />
    </Suspense>
  );
}
