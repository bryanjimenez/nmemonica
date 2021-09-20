const cacheFilesConst = ["0301fbe829087f4e8b91cde9bf9496c5.jpeg","1062f5e41ef989b5973a457e55770974.png","236.0cb615c6104aa0af46e1.css","236.7ef92152.js","35872f035bddb00bb6bed6802ee78d72.png","388582fe2fdbf34450b199396860911c.png","edb1f64724de9f6f175c1efab91a9473.png","favicon.ico","fb3f97e84cbbbf0c3fdedec024222e88.png","icon192.png","icon512.png","index.html","main.3f0a8a2e.js","main.bd7446e3c47dc53a564d.css","manifest.webmanifest","maskable512.png","npm.babel.c5e8247e.js","npm.bootstrap.1176cc60d9b0614f08a8.css","npm.classnames.8f12f1d7.js","npm.clsx.6e5cca71.js","npm.css-vendor.4df2fdfe.js","npm.firebase.c44ecf6b.js","npm.fortawesome.6919438d.js","npm.history.e2ef1c87.js","npm.hoist-non-react-statics.00a88bd9.js","npm.hyphenate-style-name.0055c82f.js","npm.is-in-browser.3a68dd2c.js","npm.isarray.b99faedf.js","npm.jss-plugin-camel-case.271794fc.js","npm.jss-plugin-default-unit.d2fb9396.js","npm.jss-plugin-global.36a61ec9.js","npm.jss-plugin-nested.27ee2039.js","npm.jss-plugin-props-sort.f9c7060e.js","npm.jss-plugin-rule-value-function.c8aeda87.js","npm.jss-plugin-vendor-prefixer.6f58513f.js","npm.jss.eab36002.js","npm.lodash.ba60eab4.js","npm.material-ui.29fcee2f.js","npm.mini-create-react-context.cd39d446.js","npm.object-assign.43cf34ba.js","npm.path-to-regexp.3c245515.js","npm.primer.d3adb01c.js","npm.prop-types.5a8543b5.js","npm.react-dom.bf3dcfe3.js","npm.react-redux.c8f4b3d9.js","npm.react-router-dom.43e290bb.js","npm.react-router.7a8be827.js","npm.react-transition-group.9c9f1895.js","npm.react.0ff3225b.js","npm.redux-thunk.571a5839.js","npm.redux.57848e49.js","npm.resolve-pathname.05213e20.js","npm.scheduler.d7588745.js","npm.tiny-invariant.fe2a2a3b.js","npm.tslib.4e3f6e7b.js","runtime.dbf0b7c2.js"];

const swVersionConst =  '94b86d4a2b3566ce62a654a9809c3eeb';

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
  } else if (url.indexOf(ghURL) === 0) {
    // site asset
    e.respondWith(appAssetReq(url));
  } else if (url.indexOf(gCloudFnPronounce + "/override_cache") === 0) {
    // override cache site media asset
    console.log("[ServiceWorker] Overriding Asset in Cache");
    const newUrl = url.split("/override_cache").join("");
    if (!self.indexedDB) {
      // use cache
      console.log(
        "Your browser doesn't support a stable version of IndexedDB."
      );
      e.respondWith(recache(appMediaCache, newUrl));
    } else {
      // use indexedDB

      // TODO: parallel?
      const dbOpenPromise = openIDB();
      const dbResults = dbOpenPromise.then((db) => {
        const query = newUrl.split(gCloudFnPronounce)[1];

        return fetch(newUrl)
          .then((res) => res.blob())
          .then((blob) =>
            putIDBItem(db, { query, blob }).then((dataO) => toResponse(dataO))
          );
      });

      e.respondWith(dbResults);
    }
  } else if (url.indexOf(gCloudFnPronounce) === 0) {
    // site media asset
    if (!self.indexedDB) {
      // use cache
      console.log(
        "Your browser doesn't support a stable version of IndexedDB."
      );
      e.respondWith(appMediaReq(url));
    } else {
      // use indexedDB
      const dbOpenPromise = openIDB();

      const dbResults = dbOpenPromise.then((db) => {
        const query = url.split(gCloudFnPronounce)[1];

        return getIDBItem(db, query)
          .then((dataO) =>
            //found
            toResponse(dataO)
          )
          .catch(() =>
            //not found
            fetch(url)
              .then((res) => res.blob())
              .then((blob) =>
                addIDBItem(db, { query, blob }).then((dataO) =>
                  toResponse(dataO)
                )
              )
          );
      });
      e.respondWith(dbResults);
    }
  } else {
    // everything else
    e.respondWith(fetch(e.request));
  }
});

function toResponse(obj) {
  const status = 200,
    statusText = "OK";
  const init = { status, statusText };
  return new Response(obj.blob, init);
}

function openIDB() {
  let openRequest = indexedDB.open(appMediaCache);

  const upgradeP = new Promise((resolve, reject) => {
    openRequest.onupgradeneeded = function (event) {
      // Save the IDBDatabase interface
      let db = event.target.result;

      // Create an objectStore for this database
      let objectStore = db.createObjectStore("media", { keyPath: "query" });
      objectStore.createIndex("query", "query", { unique: true });

      // Use transaction oncomplete to make sure the objectStore creation is
      // finished before adding data into it.
      objectStore.transaction.oncomplete = function (event) {
        // Store values in the newly created objectStore.
        // console.log("upgrade success");
        resolve(db);
      };
    };
  });

  const dbOpenPromise = new Promise((resolve, reject) => {
    openRequest.onerror = function (event) {
      // console.log("open failed");
      reject();
    };
    openRequest.onsuccess = function (event) {
      let db = event.target.result;

      db.onerror = function (event) {
        // Generic error handler for all errors targeted at this database's
        // requests!
        console.error("Database error: " + event.target.errorCode);
      };

      // console.log("open success");
      resolve(db);
    };
  });

  // TODO: upgrade and open
  return dbOpenPromise;
}

function getIDBItem(db, key) {
  var transaction = db.transaction(["media"]);
  var objectStore = transaction.objectStore("media");
  var request = objectStore.get(key);

  const requestP = new Promise((resolve, reject) => {
    request.onerror = function (event) {
      // Handle errors!
      // console.log("read fail");
      alert('read fail')
      reject();
    };
    request.onsuccess = function (event) {
      // console.log(JSON.stringify(request.result));
      if (request.result) {
        // console.log("read success");
        alert('read success')
        resolve(request.result);
      } else {
        // console.log("no data?");
        alert('no data?')
        reject();
      }
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function (event) {
      // console.log("read Transaction done!");
      resolve();
    };
    transaction.onerror = function (event) {
      // console.log("read Transaction failed!");
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then((pArr) => pArr[0]);
}

/**
 *
 * @param {*} db
 * @param {*} value
 * @returns
 */
function addIDBItem(db, value) {
  let transaction = db.transaction(["media"], "readwrite");

  let objectStore = transaction.objectStore("media");
  let request = objectStore.add(value);

  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (event) {
      // event.target.result === customer.ssn;
      // console.log("write done!");
      resolve();
    };
    request.onerror = function (event) {
      // console.log("write failed!");
      reject();
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function (event) {
      // console.log("write Transaction done!");
      resolve(value);
    };
    transaction.onerror = function (event) {
      // console.log("write Transaction failed!");
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then(() => value);
}

/**
 *
 * @param {*} db
 * @param {*} value
 * @returns
 */
function putIDBItem(db, value) {
  let transaction = db.transaction(["media"], "readwrite");

  let objectStore = transaction.objectStore("media");
  let request = objectStore.put(value);

  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (event) {
      // event.target.result === customer.ssn;
      // console.log("put done!");
      resolve();
    };
    request.onerror = function (event) {
      // console.log("put failed!");
      reject();
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function (event) {
      // console.log("put Transaction done!");
      resolve(value);
    };
    transaction.onerror = function (event) {
      // console.log("put Transaction failed!");
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then(() => value);
}

function deleteIDBItem(db, key) {
  var transaction = db.transaction(["media"], "readwrite");

  let request = transaction.objectStore("media").delete(key);

  request.onsuccess = function (event) {
    // console.log("deleted success");
  };

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function (event) {
      // console.log("delete Transaction done!");
      resolve();
    };
    transaction.onerror = function (event) {
      // console.log("delete Transaction failed!");
      reject();
    };
  });

  return transactionP;
}

/**
 * respond with cache match always fetch and re-cache
 * may return stale version
 * @returns a Promise with a cache response
 */
function appVersionReq() {
  // return what's on cache
  const cacheRes = caches
    .open(appDataCache)
    .then((cache) => cache.match(dataVerURL));

  const fetchRes = caches
    .open(appDataCache)
    .then((cache) => cache.add(dataVerURL).then(() => cache.match(dataVerURL)));

  return cacheRes || fetchRes;
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
