self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("nmemonica").then((cache) => cache.addAll(cacheFiles))
  );
});

self.addEventListener("fetch", (e) => {
  console.log("[Service Worker] fetch");
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then(
      (response) =>
        response ||
        fetch(e.request).then((res) =>
          caches.open("nmemonica").then((cache) => {
            console.log("caching");
            cache.put(e.request, res.clone());
            return res;
          })
        )
    )
  );
});
