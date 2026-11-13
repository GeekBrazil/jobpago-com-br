// Monta o e-mail de prospecção com o texto APROVADO em 28/09 (allancandido.com/src/lib/prospeccao.ts,
// função montar), sem mudar uma vírgula. Roda como processo filho do campus/api.mjs:
//   stdin  = JSON do Destino (o mesmo objeto que o robo.py mandaria)
//   stdout = JSON {assunto, texto}
// Não envia nada (não chama enviarEmail, não abre rede). CRON_SECRET chega só pelo env deste filho
// (usado pelo montar() para assinar o link "Sair").
import { register } from 'node:module';

register('./alias-hook.mjs', import.meta.url);

function sair(codigo, obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(codigo);
}

let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { entrada += c; if (entrada.length > 64 * 1024) sair(1, { erro: 'entrada grande demais' }); });
process.stdin.on('end', async () => {
  try {
    if (!process.env.CRON_SECRET) return sair(1, { erro: 'sem segredo para o link de sair' });
    const d = JSON.parse(entrada);
    if (!d || typeof d !== 'object' || !/^\d{14}$/.test(String(d.cnpj)) || !String(d.email || '').includes('@')) {
      return sair(1, { erro: 'destino inválido' });
    }
    if (!/^[0-9a-f]{10}$/.test(String(d.ref))) return sair(1, { erro: 'ref inválida' });
    const m = await import('/home/allan/allancandido.com/src/lib/prospeccao.ts');
    const r = m.montar(d);
    sair(0, { assunto: r.assunto, texto: r.texto });
  } catch (e) {
    sair(1, { erro: String(e && e.message || e).replace(/\S+@\S+/g, '•••').slice(0, 200) });
  }
});
