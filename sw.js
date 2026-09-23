/* СЛУЖКА — делает страницу приложением: открывается и работает без сети.

   Важное отличие от первой версии: библиотека Supabase теперь лежит рядом
   (supabase.js), а не тянется со стороннего сайта. Раньше без интернета она
   не загружалась — и приложение показывало пустой экран ровно в тот момент,
   ради которого затевалось. Теперь всё своё кэшируется целиком.

   Стратегия: кэш первым, поэтому экран появляется сразу. Сеть обновляет
   сохранённую версию в фоне, а в дороге остаётся последняя виденная. */
const КЭШ = "гили-v28";     // 23.09: лента держится за настоящий низ после отправки (v27 — fluid field)
const ОСНОВА = ["./", "./index.html", "./supabase.js", "./manifest.json", "./icon-180.png", "./gili-sky-v1.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(КЭШ).then(c => c.addAll(ОСНОВА)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== КЭШ).map(x => caches.delete(x))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({type: "window"}).then(cs =>
      cs.forEach(c => c.postMessage("новая-версия")))));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if(e.request.method !== "GET") return;
  if(u.hostname.endsWith("supabase.co")) return;      // данные и вход — всегда живьём
  if(u.origin !== location.origin) return;
  /* КЭШ ПЕРВЫМ, СЕТЬ ДОГОНЯЕТ. Было наоборот — «сеть первой, кэш запасным», и телефон ждал
     ответа сети даже когда всё своё лежало рядом. Женя 11.09: «на телефоне медленно грузится».
     Теперь из кэша отдаём мгновенно, свежее подтягиваем следом и кладём на следующий раз;
     о новой версии страницу предупреждаем сообщением, она перечитывает себя сама. */
  e.respondWith(
    caches.match(e.request).then(изкэша => {
      const изсети = fetch(e.request).then(r => {
        if(r.ok){ const копия = r.clone(); caches.open(КЭШ).then(c => c.put(e.request, копия)); }
        return r;
      }).catch(() => изкэша || caches.match("./index.html"));
      return изкэша || изсети;
    })
  );
});
