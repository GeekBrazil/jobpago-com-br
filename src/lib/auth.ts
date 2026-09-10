import crypto from "crypto";

/**
 * Mesmo padrão do motor-sites/allancandido-com: segredo único via header,
 * comparação em tempo constante (sem timing attack).
 */
export function autorizadoAdmin(req: Request): boolean {
  const segredoServidor = process.env.ADMIN_SECRET;
  const segredoRecebido = req.headers.get("x-admin-secret");
  if (!segredoServidor || !segredoRecebido) return false;

  const bufServidor = Buffer.from(segredoServidor, "utf8");
  const bufRecebido = Buffer.from(segredoRecebido, "utf8");
  if (bufServidor.length !== bufRecebido.length) return false;
  return crypto.timingSafeEqual(bufServidor, bufRecebido);
}
