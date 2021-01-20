self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open('nmemonica').then((cache) => cache.addAll(cacheFiles)),
    );
  });
  
  self.addEventListener('fetch', (e) => {
    console.log(e.request.url);
    e.respondWith(
      caches.match(e.request).then((response) => response || fetch(e.request)),
    );
  });

  const cacheFiles = [