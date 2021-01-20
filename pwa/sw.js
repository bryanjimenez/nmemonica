const appStaticCache = "nmemonica-static-v1";
const appDataCache = "nmemonica-data-v1";
const cacheVersions = [appDataCache, appStaticCache];

const fbURL = "https://nmemonica-9d977.firebaseio.com/";
const dataVersion = fbURL + "lambda/cache.json";
const data = [
  fbURL + "lambda/verbs.json",
  fbURL + "lambda/phrases.json",
  fbURL + "lambda/jlptn5.json",
  fbURL + "lambda/opposites.json",
  fbURL + "lambda/suffixes.json",
  fbURL + "lambda/particles.json",
];

self.addEventListener("install", (e) => {
  caches.open(appDataCache).then((cache) =>
    cache.add(dataVersion).then(() =>
      Promise.all(
        data.map((d) => {
          const r = new Request(d, { headers: { "Data-Version": 0 } });
          return getVersionForData(r).then((v) => cacheVerData(r, v));
        })
      )
    )
  );

  const a = "https://bryanjimenez.github.io/nmemonica-demo";
  const b = "https://bryanjimenez.github.io/nmemonica-demo/";

  e.waitUntil(
    caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([...cacheFiles, a, b]))
  );
});

self.addEventListener("activate", (e) => {
  console.log("SW active");
  /*
  self.clients
    .matchAll({ includeUncontrolled: true })
    .then(function (clientList) {
      var urls = clientList.map(function (client) {
        return client.url;
      });
      console.log("[ServiceWorker] Matching clients:", urls.join(", "));
    });

  // TODO: do proper version check
  e.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheVersions.indexOf(cacheName)===-1) {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function () {
        console.log("[ServiceWorker] Claiming clients for version");
        return self.clients.claim();
      })
  );
  */
});

self.addEventListener("fetch", (e) => {
  const req = e.request.clone();
  // console.log("SW onfetch");
  // console.log(req.url);

  if (req.url === dataVersion) {
    appVersionReq(e);
  } else if (req.headers.get("Data-Version")) {
    appDataReq(e);
  } else {
    appAssetReq(e);
  }
});

/**
 * respond with cache match, fetch and update cache
 * @param {*} e event
 */
function appVersionReq(e) {
  const request = e.request;
  // console.log("appVersionReq");
  // console.log(request.url);

  // TODO: after fetch update app?
  e.respondWith(caches.match(request));

  e.waitUntil(
    fetch(request).then((res) =>
      caches.open(appDataCache).then((cache) => cache.put(request, res.clone()))
    )
  );
}

/**
 * when request contains Data-Version != 0 the version is used otherwise
 * the version is searched in the cache
 * @returns a Promise that yieds a cached response
 * @param {*} e event
 */
function appDataReq(e) {
  // console.log("appDataReq");
  // console.log(cl.url);
  const request = e.request;
  const version = request.clone().headers.get("Data-Version");

  let response;
  if (version === "0") {
    // TODO: catch when no version match
    response = getVersionForData(request).then((v) => cacheVerData(request, v));
  } else {
    response = cacheVerData(request, version);
  }

  e.respondWith(response)
}

/**
 * @returns a Promise that yields the version on the cache for the provided request
 * @param {*} request
 */
function getVersionForData(request) {
  const dName = request.clone().url.split("/").pop().split(".json")[0];

  return caches.match(dataVersion).then((resp) => {
    return resp.json().then((versions) => versions[dName]);
  });
}

/**
 * @returns a Promise that yieds a cached response
 * @param {*} request
 * @param {*} v version
 */
function cacheVerData(request, v) {
  const cl = request.clone();
  const url = cl.url + "." + v;
  // const url2 = cl.url.split(".").splice(-1, 0, v).join(".");
  // console.log(url2);
  const r = new Request(url);

  // TODO: fetch clean request (Data-Version)?
  return caches.match(r).then((response) => {
    return (
      response ||
      fetch(request).then((res) =>
        caches.open(appDataCache).then((cache) => {
          return cache.put(r, res.clone()).then(() => res);
        })
      )
    );
  });
}

/**
 * cache match first otherwise fetch then cache
 * @returns a Promise that yieds a cached response
 * @param {*} e event
 */
function appAssetReq(e) {
  // console.log("appAssetReq");
  // console.log(request.url);
  const request = e.request;

  e.respondWith(
    caches.match(request).then((cachedRes) => {
      return (
        cachedRes ||
        fetch(request).then((res) =>
          caches
            .open(appStaticCache)
            .then((cache) => cache.put(request, res.clone()).then(() => res))
        )
      );
    })
  );
}
