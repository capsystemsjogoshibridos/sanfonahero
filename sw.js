'use strict';
const REVISION = "aa71d2a43ffc04a8";
const FILES = ["accordion-3d.js", "app-icon.png", "assets/aprendendo-forrozear.png", "assets/cabra-celular.png", "assets/cap-systems-logo.png", "assets/frames/sanfona_aberta_direita.png", "assets/frames/sanfona_aberta_esquerda.png", "assets/frames/sanfona_curva_direita.png", "assets/frames/sanfona_curva_esquerda.png", "assets/frames/sanfona_totalmente_aberta.png", "assets/frames/sanfona_totalmente_fechada.png", "assets/frames/sanfona_tudo_baixo.png", "assets/frames/sanfona_tudo_cima.png", "assets/sertao-magico.png", "camera-control.js", "camera-worker.js", "fit-screen.js", "game.js", "index.html", "manifest.webmanifest", "musicas/aprendendo_forrozear.m4a", "musicas/cabra_celular.m4a", "musicas/safona_cristovao.m4a", "offline.css", "offline.js", "sons/derrota.m4a", "sons/tile_screen.m4a", "sons/vitoria.m4a", "styles.css", "vendor/aruco/LICENSE.json", "vendor/aruco/aruco.js", "vendor/aruco/cv.js", "vendor/aruco/dictionary.js", "vendor/three.min.js"];
const BASE = new URL('./', self.location.href);
const PREFIX = 'sanfona-offline:' + BASE.pathname + ':';
const CACHE = PREFIX + REVISION;
const urls = FILES.map(file => new URL(file, BASE).href);
const notify = async message => {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.filter(client => client.url.startsWith(BASE.href)).forEach(client => client.postMessage(message));
};
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let completed = 0;
    try {
      // All files must succeed before this version can replace the previous one.
      for (const url of urls) {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (!response.ok || response.status === 206) throw new Error('Arquivo indisponível: ' + new URL(url).pathname);
        await cache.put(url, response);
        await notify({ type: 'OFFLINE_PROGRESS', completed: ++completed, total: urls.length });
      }
    } catch (error) {
      await caches.delete(CACHE);
      await notify({ type: 'OFFLINE_ERROR', message: error.message });
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    // Keep older complete versions: an already-open tab may still use them.
    await notify({ type: 'OFFLINE_READY', revision: REVISION });
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
  if (event.data?.type === 'CHECK_OFFLINE') event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const complete = (await Promise.all(urls.map(url => cache.match(url)))).every(Boolean);
    event.ports[0]?.postMessage({ ready: complete, revision: REVISION });
  })());
});
async function rangeResponse(request, response) {
  const header = request.headers.get('Range');
  if (!header) return response;
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  let start, end;
  if (match && (match[1] || match[2])) {
    if (!match[1]) { start = Math.max(0, size - Number(match[2])); end = size - 1; }
    else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
  }
  if (!Number.isSafeInteger(start) || start < 0 || start >= size || end < start) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(bytes.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
    'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes'
  }});
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.href.startsWith(BASE.href)) return;
  url.search = '';
  const key = request.mode === 'navigate' ? new URL('index.html', BASE).href : url.href;
  if (!urls.includes(key)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(key);
    if (cached) return rangeResponse(request, cached);
    return fetch(request);
  })());
});
