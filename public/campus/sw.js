// Service worker do Campus (escopo /campus/).
// - /api/campus/* e qualquer /api/: só rede, nunca cache (estado ao vivo, rascunhos com contato).
// - Casca do app (HTML/CSS/JS/ícones), three.min.js e o roster: rede primeiro; se o PC
//   ou o Tailscale caírem, abre a última versão guardada (o campus aparece com todas dormindo).
const VERSAO = 'campus-casca-v1';
const CASCA = [
  '/campus/',
  '/campus/css/campus.css',
  '/campus/js/app.js',
  '/campus/js/ui.js',
  '/campus/js/api.js',
  '/campus/js/camera.js',
  '/campus/manifest.webmanifest',
  '/campus/icones/icone-192.png',
  '/three.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSAO)
      .then((c) => Promise.allSettled(CASCA.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('campus-') && k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function guardavel(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.search) return false; // ?stubs, ?mock, ?hora: modos de teste ficam fora do cache
  if (url.pathname.startsWith('/campus/dev/')) return false;
  return url.pathname.startsWith('/campus/') || url.pathname === '/three.min.js' || url.pathname === '/data/campus/agentes.json';
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;           // POST etc.: direto pra rede
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return; // só rede
  const navegacao = req.mode === 'navigate' && url.pathname.startsWith('/campus');
  if (!navegacao && !guardavel(url)) return;
  e.respondWith((async () => {
    try {
      const resp = await fetch(req);
      if (resp.ok && (navegacao ? !url.search : true)) {
        const copia = resp.clone();
        caches.open(VERSAO).then((c) => c.put(navegacao ? '/campus/' : req, copia)).catch(() => {});
      }
      return resp;
    } catch (err) {
      const c = await caches.open(VERSAO);
      const hit = await c.match(navegacao ? '/campus/' : req, { ignoreSearch: navegacao });
      if (hit) return hit;
      throw err;
    }
  })());
});
