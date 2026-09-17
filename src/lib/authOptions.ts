import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";

async function ensureUsuariosTable() {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      telefone VARCHAR(20),
      senha_hash TEXT,
      provider VARCHAR(20) NOT NULL DEFAULT 'credentials',
      criado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers: [
    Credentials({
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const senha = String(credentials?.senha ?? "");
        if (!email || !senha) return null;

        const pool = getPool();
        if (!pool) return null;
        await ensureUsuariosTable();

        const { rows } = await pool.query(
          `SELECT id, nome, email, senha_hash FROM usuarios WHERE email = $1 AND provider = 'credentials'`,
          [email],
        );
        const user = rows[0];
        if (!user || !user.senha_hash) return null;

        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaValida) return null;

        return { id: String(user.id), name: user.nome, email: user.email };
      },
    }),
    // Ativa sozinho quando GOOGLE_CLIENT_ID/SECRET existirem no ambiente —
    // sem as envs, o NextAuth só não lista esse provider no /entrar.
    ...(process.env.GOOGLE_CLIENT_ID
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID
      ? [Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Login social: garante que existe uma linha em usuarios (sem senha).
      if (account?.provider === "google" || account?.provider === "facebook") {
        const pool = getPool();
        if (!pool || !user.email) return true;
        await ensureUsuariosTable();
        await pool.query(
          `INSERT INTO usuarios (nome, email, provider)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO NOTHING`,
          [user.name ?? user.email, user.email, account.provider],
        );
      }
      return true;
    },
  },
});
