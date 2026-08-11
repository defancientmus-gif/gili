/* СЛУЖКА — делает страницу приложением: открывается и работает без сети.

   Важное отличие от первой версии: библиотека Supabase теперь лежит рядом
   (supabase.js), а не тянется со стороннего сайта. Раньше без интернета она
   не загружалась — и приложение показывало пустой экран ровно в тот момент,
   ради которого затевалось. Теперь всё своё кэшируется целиком.

   Стратегия: сеть первой, кэш запасным. На связи всегда свежая версия,
   в дороге — последняя виденная. */
const КЭШ = "гили-v9";
const ОСНОВА = ["./", "./index.html", "./supabase.js", "./manifest.json", "./icon-180.png"];

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
  if(u.hostname.endsWith("supabase.co")) return;      // данные и вход — всегда живьём
  if(u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if(r.ok){ const копия = r.clone(); caches.open(КЭШ).then(c => c.put(e.request, копия)); }
      return r;
    }).catch(() => caches.match(e.request).then(c => c || caches.match("./index.html")))
  );
});
