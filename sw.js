/* СЛУЖКА — то, что делает страницу приложением: она открывается без сети.
   Стратегия: сеть первой, кэш запасным. Так на связи всегда свежая версия,
   а в дороге — последняя виденная. */
const КЭШ = "гили-облако-v4";
const ОСНОВА = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(КЭШ).then(c => c.addAll(ОСНОВА)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== КЭШ).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if(e.request.method !== "GET") return;
  if(u.hostname.endsWith("supabase.co")) return;      // данные всегда живьём
  e.respondWith(
    fetch(e.request).then(r => {
      if(r.ok && u.origin === location.origin){
        const копия = r.clone(); caches.open(КЭШ).then(c => c.put(e.request, копия));
      }
      return r;
    }).catch(() => caches.match(e.request).then(c => c || caches.match("./index.html")))
  );
});
