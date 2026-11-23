/* Kagewell prototyp service worker. Scope is this folder only. Never deletes other games' caches. */
const CACHE = 'kagewell-proto-v1';
const TIMEOUT = 3000;
const SHELL = [
  './',
  './index.html',
  './game.js',
  './sprites.js',
  './audio.js',
  './sw.js',
  './art/kiro-barrel.png',
  '../vfx/vfx.js',
  '../vfx/ninja-anim.js',
  '../vfx/enemy-anim.js',
  '../fonts/press-start-2p.woff',
  '../balance.json',
  '../audio/manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kagewell-proto-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function allowed(url) {
  const p = url.pathname;
  if (p.endsWith('/index.html') && !p.includes('/prototyp/')) return false;
  return p.includes('/kagewell/') || p.includes('/prototyp/') || p.includes('/vfx/') || p.includes('/fonts/') || p.includes('/audio/') || p.endsWith('/balance.json');
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !allowed(url)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(req).then(r => {
      if (r && r.ok) cache.put(req, r.clone()).catch(() => {});
      return r;
    });
    const hit = await cache.match(req) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    if (!hit) return net.catch(() => cache.match('./index.html').then(r => r || Response.error()));
    let timer;
    const timeout = new Promise(res => { timer = setTimeout(() => res(null), TIMEOUT); });
    const raced = await Promise.race([net.catch(() => null), timeout]);
    clearTimeout(timer);
    if (!raced) e.waitUntil(net.catch(() => {}));
    return (raced && raced.ok) ? raced : hit;
  })());
});
