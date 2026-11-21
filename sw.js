/* 微出国·学 · 考证学习站 · 离线缓存。缓存名只用本站前缀 academy-exams-，清理只清自己（同源的别的站不碰）。
   安装时只缓存站级首页；打开某门课时页面发 {type:'precache',course} 消息，再按 _precache/<课>.json 预缓存那一门课。 */
const PREFIX = 'academy-exams-';
const VERSION = PREFIX + '7c759d47aa94';
const SCOPE = new URL('./', self.location).pathname;
const SHELL = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    for (const u of SHELL) { try { await c.add(new Request(u, {cache: 'reload'})); } catch (_) {} }
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type !== 'precache' || !/^[a-z0-9-]+$/.test(d.course || '')) return;
  e.waitUntil((async () => {
    const r = await fetch('./_precache/' + d.course + '.json', {cache: 'no-cache'}); if (!r.ok) return;
    const list = (await r.json()).files || [];
    const c = await caches.open(VERSION);
    for (const u of list) { try { if (!(await c.match(u))) await c.add(new Request(u, {cache: 'reload'})); } catch (_) {} }
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(SCOPE)) return;
  if (url.pathname.includes('/media/') || url.pathname.includes('/_precache/') || req.headers.has('range')) return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return res; })));
  }
});
