// Hook de resolução usado só pelo montar-email.mjs: "@/lib/x" → /home/allan/allancandido.com/src/lib/x.ts
// (o mesmo alias do tsconfig do site), para importar o prospeccao.ts APROVADO sem copiar nada.
import { pathToFileURL } from 'node:url';
const SRC = '/home/allan/allancandido.com/src/';
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('@/')) return next(pathToFileURL(SRC + spec.slice(2) + '.ts').href, ctx);
  return next(spec, ctx);
}
