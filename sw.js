const cacheFilesConst = ["0301fbe829087f4e8b91cde9bf9496c5.jpeg","1062f5e41ef989b5973a457e55770974.png","236.0cb615c6104aa0af46e1.css","236.9a450374.js","35872f035bddb00bb6bed6802ee78d72.png","388582fe2fdbf34450b199396860911c.png","edb1f64724de9f6f175c1efab91a9473.png","favicon.ico","fb3f97e84cbbbf0c3fdedec024222e88.png","icon192.png","icon512.png","index.html","main.6e58433a.js","main.bd7446e3c47dc53a564d.css","manifest.webmanifest","maskable512.png","npm.babel.0ef5a426.js","npm.bootstrap.247d0b24cee0327bc44e.css","npm.classnames.db245282.js","npm.clsx.7ce1359d.js","npm.css-vendor.9d25868c.js","npm.dialog-polyfill.71b4353a.js","npm.firebase.c09875f6.js","npm.firebaseui.ef995043.js","npm.fortawesome.669dee67.js","npm.history.91433c8b.js","npm.hoist-non-react-statics.c295c232.js","npm.hyphenate-style-name.6006ebd8.js","npm.is-in-browser.802eea86.js","npm.isarray.806a53bf.js","npm.jss-plugin-camel-case.e24f2993.js","npm.jss-plugin-default-unit.e3468a73.js","npm.jss-plugin-global.4a477ce4.js","npm.jss-plugin-nested.fcdbd55a.js","npm.jss-plugin-props-sort.a0bb9627.js","npm.jss-plugin-rule-value-function.99d8363b.js","npm.jss-plugin-vendor-prefixer.4f9fd1be.js","npm.jss.017ed6c9.js","npm.lodash.5b7a2ffe.js","npm.material-design-lite.6dc694db.js","npm.material-ui.bc3c612c.js","npm.mini-create-react-context.b19b94a4.js","npm.object-assign.d03933ed.js","npm.path-to-regexp.3a1e431e.js","npm.primer.3f8c68a5.js","npm.prop-types.1d2653f0.js","npm.react-dom.70daa1a9.js","npm.react-firebaseui.3a42d339.js","npm.react-redux.34e19207.js","npm.react-router-dom.09a632fc.js","npm.react-router.551ceb09.js","npm.react-transition-group.ed3f2575.js","npm.react.d03b26e8.js","npm.redux-thunk.ed614dd2.js","npm.redux.f88071c6.js","npm.resolve-pathname.21e12931.js","npm.scheduler.bf36ac53.js","npm.symbol-observable.a96b4a20.js","npm.tiny-invariant.a664e280.js","npm.tslib.bfd20c21.js","npm.value-equal.2bf5a62a.js","runtime.5cff2a41.js"];

const swVersionConst =  '97775ccc81e27ee258ce1f2fcc6b59e0';

const ghURLConst =  'https://bryanjimenez.github.io/nmemonica';
const fbURLConst =  'https://nmemonica-9d977.firebaseio.com';
const gCloudFnPronounceConst =  'https://us-east1-nmemonica-9d977.cloudfunctions.net/g_translate_pronounce';

const swVersion = swVersionConst; // eslint-disable-line no-undef
const cacheFiles = cacheFilesConst; // eslint-disable-line no-undef

const ghURL = ghURLConst; // eslint-disable-line no-undef
const fbURL = fbURLConst; // eslint-disable-line no-undef
const gCloudFnPronounce = gCloudFnPronounceConst; // eslint-disable-line no-undef

const appStaticCache = "nmemonica-static";
const appDataCache = "nmemonica-data";
const appMediaCache = "nmemonica-media";

const dataVerURL = fbURL + "/lambda/cache.json";
const dataURL = [
  fbURL + "/lambda/phrases.json",
  fbURL + "/lambda/vocabulary.json",
  fbURL + "/lambda/opposites.json",
  fbURL + "/lambda/suffixes.json",
  fbURL + "/lambda/particles.json",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  console.log("[ServiceWorker] Version: " + swVersion);

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
    Promise.all([removeUnknowCaches(), removeOldStaticCaches()])

      // claim the client
      .then(function () {
        console.log("[ServiceWorker] Claiming clients");
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
  } else if (url === ghURL + "/refresh") {
    console.log("[ServiceWorker] Hard Refresh");
    caches.delete(appStaticCache);
    self.registration.unregister();
    e.respondWith(fetch(ghURL));
  } else if (url === ghURL + "/newest") {
    console.log("[ServiceWorker] newest word");

    const newestCachePath = fbURL + "/newest/words.json";
    e.respondWith(
      caches
        .open(appDataCache)
        .then((cache) => cache.match(newestCachePath))
        .then((res) => {
          caches
            .open(appDataCache)
            .then((cache) => cache.delete(newestCachePath));
          return res;
        })
    );
  } else if (url.indexOf(ghURL) === 0) {
    // site asset
    e.respondWith(appAssetReq(url));
  } else if (url.indexOf(gCloudFnPronounce + "/override_cache") === 0) {
    // override cache site media asset
    console.log("[ServiceWorker] Overriding Asset in Cache");
    const newUrl = url.split("/override_cache").join("");
    e.respondWith(recache(appMediaCache, newUrl));
  } else if (url.indexOf(gCloudFnPronounce) === 0) {
    // site media asset
    e.respondWith(appMediaReq(url));
  } else {
    // everything else
    e.respondWith(fetch(e.request));
  }
});

/**
 * respond with cache match always fetch and re-cache
 * may return stale version
 * @returns a Promise with a cache response
 */
function appVersionReq() {
  // TODO: after fetch update app?
  const cacheRes = caches
    .open(appDataCache)
    .then((cache) => cache.match(dataVerURL));

  ////===========================================
  const fetchAndUpdateRes = fetch(dataVerURL)
    .then((r) => r.json())
    .then((resNew) =>
      caches
        .open(appDataCache)
        .then((cache) => cache.match(dataVerURL))
        .then((r) => r.json())
        .then((resOld) => {
          // create obj with new and old hashes
          let updatePromise = Promise.resolve();
          let versionChange = {};
          let update = false;
          for (let n in resNew) {
            if (resOld[n] !== resNew[n]) {
              versionChange[n] = { old: resOld[n], new: resNew[n] };
              update = !update ? true : true;
            }
          }

          // update cache with fetched version results
          const blob = new Blob([JSON.stringify(resNew)], {
            type: "application/json",
          });
          const init = { status: 200, statusText: "OK" };
          const fetchVersion = new Response(blob, init);

          const fetchRes = caches
            .open(appDataCache)
            .then((cache) =>
              cache
                .put(dataVerURL, fetchVersion)
                .then(() => cache.match(dataVerURL))
            );

          // look for changes in terms with new & old hashes values
          if (update) {
            update = false;
            console.log("v: " + JSON.stringify(versionChange));

            let newlyAdded = {};
            let ps = [];
            const allowedSets = ["vocabulary", "phrases"];
            for (let setName in versionChange) {
              if (allowedSets.includes(setName)) {
                const theUrl = fbURL + "/lambda/" + setName + ".json";

                ps.push(
                  cacheVerData(theUrl, versionChange[setName].new)
                    .then((d) => d.json())
                    .then((newData) =>
                      cacheVerData(theUrl, versionChange[setName].old)
                        .then((d2) => d2.json())
                        .then((oldData) => {
                          let arr = [];
                          for (let j in newData) {
                            if (oldData[j] === undefined) {
                              arr = [...arr, j];
                              update = !update ? true : true;
                            }
                          }

                          if (arr.length > 0) {
                            newlyAdded[setName] = {
                              freq: arr,
                              dic: newData,
                            };
                          }

                          return Promise.resolve();
                        })
                    )
                );
              }
            }

            // message results to client
            updatePromise = Promise.all(ps).then(() => {
              if (update) {
                // console.log(JSON.stringify(newlyAdded));

                // for (const client of await clients.matchAll({includeUncontrolled: true, type: 'window'})) {
                //   client.postMessage(newlyAdded);
                // }

                return clients
                  .matchAll({ includeUncontrolled: true, type: "window" })
                  .then((client) => {
                    if (client && client.length) {
                      console.log("[SW] posting message");

                      return client[0].postMessage({
                        type: "NEW_TERMS_ADDED",
                        msg: newlyAdded,
                      });
                    }

                    return Promise.resolve();
                  });
              }
            });
          }

          return Promise.all([fetchRes, updatePromise]).then(
            (allPromises) => allPromises[0]
          );
        })
    );
  ////===========================================

  // const fetchRes = caches
  //   .open(appDataCache)
  //   .then((cache) => cache.add(dataVerURL).then(() => cache.match(dataVerURL)));

  return cacheRes || fetchAndUpdateRes;
}

/**
 * get from cache on fail fetch and re-cache
 * first match may be stale
 * @returns a Promise with a cached dataVersion response
 */
function appVersionCacheOnFailFetch() {
  return caches.open(appDataCache).then((cache) =>
    cache.match(dataVerURL).then((cacheRes) => {
      if (cacheRes) {
        return Promise.resolve(cacheRes);
      } else {
        return recache(appDataCache, dataVerURL);
      }
    })
  );
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

  return caches.open(appDataCache).then((cache) =>
    cache.match(urlVersion).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(url).then((fetchRes) => {
          if (fetchRes.status < 400) {
            cache.put(urlVersion, fetchRes.clone());
          }
          return fetchRes;
        })
      );
    })
  );
}

/**
 * cache match first otherwise fetch then cache
 * @returns a Promise that yieds a cached response
 * @param {*} url
 */
function appAssetReq(url) {
  return caches
    .open(appStaticCache)
    .then((cache) => cache.match(url))
    .then((cachedRes) => {
      return cachedRes || recache(appStaticCache, url);
    });
}

/**
 * cache match first otherwise fetch then cache
 * @returns a Promise that yieds a cached response
 * @param {*} url
 */
function appMediaReq(url) {
  return caches
    .open(appMediaCache)
    .then((cache) => cache.match(url))
    .then((cachedRes) => {
      return cachedRes || recache(appMediaCache, url);
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
      .then(() => cache.match(url))
      .catch(() => {
        console.log("[ServiceWorker] Network unavailable");
        return Promise.reject();
      })
  );
}

/**
 * delete unknown caches
 */
function removeUnknowCaches() {
  return caches.keys().then((cacheNames) =>
    Promise.all(
      cacheNames.reduce((acc, cacheName) => {
        if (
          ![appDataCache, appStaticCache, appMediaCache].includes(cacheName)
        ) {
          console.log("[ServiceWorker] Deleting cache:", cacheName);
          return [...acc, caches.delete(cacheName)];
        }
        return acc;
      }, [])
    )
  );
}

/**
 * deletes non indexed cache files in current caches
 */
function removeOldStaticCaches() {
  return caches.open(appStaticCache).then((cache) =>
    cache.keys().then((requests) =>
      Promise.all(
        requests.reduce((acc, req) => {
          const name = req.url.split("/").pop();
          // files not having . should not have hashes so will be overwritten
          // by caches.add upon install
          if (name.indexOf(".") > -1 && !cacheFiles.includes(name)) {
            console.log("[ServiceWorker] Removed static asset: " + name);
            return [...acc, cache.delete(req.url)];
          }

          return acc;
        }, [])
      )
    )
  );
}
