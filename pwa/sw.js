const appStaticCache = "nmemonica-static";
const appDataCache = "nmemonica-data";

const ghURL = "https://bryanjimenez.github.io/nmemonica-demo";
const fbURL = "https://nmemonica-9d977.firebaseio.com/";

const dataVerURL = fbURL + "lambda/cache.json";
const dataURL = [
  fbURL + "lambda/verbs.json",
  fbURL + "lambda/phrases.json",
  fbURL + "lambda/jlptn5.json",
  fbURL + "lambda/opposites.json",
  fbURL + "lambda/suffixes.json",
  fbURL + "lambda/particles.json",
];

self.addEventListener("install", (e) => {
  caches.open(appDataCache).then((cache) =>
    cache.add(dataVerURL).then(() =>
      Promise.all(
        dataURL.map((url) => {
          return getVersionForData(url).then((v) => cacheVerData(url, v));
        })
      )
    )
  );

  const a = ghURL;
  const b = ghURL + "/";

  e.waitUntil(
    caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([...cacheFiles, a, b]))
  );
});

self.addEventListener("activate", (e) => {
  self.clients
    .matchAll({ includeUncontrolled: true })
    .then(function (clientList) {
      var urls = clientList.map(function (client) {
        return client.url;
      });
      console.log("[ServiceWorker] Matching clients:", urls.join(", "));
    });

  e.waitUntil(
    // delete static assets not in cacheFiles
    caches
      .open(appStaticCache)
      .then((cache) =>
        cache.keys().then((requests) =>
          Promise.all(
            requests.reduce((acc, req) => {
              const name = req.url.split("/").pop();
              if (name.indexOf(".") > -1 && !cacheFiles.includes(name)) {
                console.log("[ServiceWorker] removed static cache: " + name);
                return [...acc, cache.delete(req.url)];
              }

              return acc;
            }, [])
          )
        )
      )
      // TODO: need proper cache deletion strategy  
      // delete old redundant data cache

      // caches
      //   .keys()
      //   .then(function (cacheNames) {
      //     return Promise.all(
      //       cacheNames.map(function (cacheName) {
      //         if (!cacheVersions.includes(cacheName)) {
      //           console.log("[ServiceWorker] Deleting old cache:", cacheName);
      //           return caches.delete(cacheName);
      //         }
      //       })
      //     );
      //   })

      // claim the client
      .then(function () {
        console.log("[ServiceWorker] Claiming clients for version");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request.clone();
  const url = e.request.url;

  if (url === dataVerURL) {
    e.respondWith(appVersionReq());
  } else if (req.headers.get("Data-Version")) {
    e.respondWith(appDataReq(e.request));
  } else {
    e.respondWith(appAssetReq(url));
  }
});

/**
 * respond with cache match always fetch and re-cache
 * may return stale version
 * @returns a Promise with a cache response
 */
function appVersionReq() {
  // TODO: after fetch update app?
  const cacheRes = caches.match(dataVerURL);

  const fetchRes = caches
    .open(appDataCache)
    .then((cache) =>
      cache.add(dataVerURL).then(() => caches.match(dataVerURL))
    );

  return cacheRes || fetchRes;
}

/**
 * get from cache on fail fetch and re-cache
 * first match may be stale
 * @returns a Promise with cache version
 */
function appVersionCacheOnFailFetch() {
  return caches.match(dataVerURL).then((cacheRes) => {
    if (cacheRes) {
      return Promise.resolve(cacheRes);
    } else {
      return recache(appDataCache, dataVerURL);
    }
  });
}

/**
 * when request contains Data-Version != 0 the version is used otherwise
 * the version is searched in the cache
 * @returns a Promise that yieds a cached response
 * @param {*} request
 */
function appDataReq(request) {
  const url = request.url;
  const version = request.headers.get("Data-Version");

  let response;
  if (version === "0") {
    // TODO: catch when no version match
    response = getVersionForData(url).then((v) => cacheVerData(url, v));
  } else {
    response = cacheVerData(url, version);
  }

  return response;
}

/**
 * @returns a Promise that yields the version on the cache for the provided request
 * @param {*} url
 */
function getVersionForData(url) {
  const dName = url.split("/").pop().split(".json")[0];

  return appVersionCacheOnFailFetch()
    .then((res) => res.json())
    .then((versions) => versions[dName]);
}

/**
 * when cache match fails fetch and re-cache (only good response)
 * @returns a Promise that yieds a cached response
 * @param {*} url
 * @param {*} v version
 */
function cacheVerData(url, v) {
  const urlVersion = url + ".v" + v;

  return caches.match(urlVersion).then((cacheRes) => {
    return (
      cacheRes ||
      fetch(url).then((fetchRes) =>
        caches.open(appDataCache).then((cache) => {
          if (fetchRes.status < 400) {
            cache.put(urlVersion, fetchRes.clone());
          }
          return fetchRes;
        })
      )
    );
  });
}

/**
 * cache match first otherwise fetch then cache
 * @returns a Promise that yieds a cached response
 * @param {*} url
 */
function appAssetReq(url) {
  return caches.match(url).then((cachedRes) => {
    return cachedRes || recache(appStaticCache, url);
  });
}

/**
 * @returns a Promise that yields a response from the cache or a rejected Promise
 * @param {*} cacheName
 * @param {*} url
 */
function recache(cacheName, url) {
  return caches.open(cacheName).then((cache) =>
    cache
      .add(url)
      .then(() => caches.match(url))
      .catch(() => {
        console.log("[ServiceWorker] network unavailable");
        return Promise.reject();
      })
  );
}
