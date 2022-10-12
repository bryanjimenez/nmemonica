/* globals clients*/
const swVersion = swVersionConst; // eslint-disable-line no-undef
const initCacheVer = initCacheVerConst; //eslint-disable-line no-undef
const cacheFiles = cacheFilesConst; // eslint-disable-line no-undef

const ghURL = ghURLConst; // eslint-disable-line no-undef
const fbURL = fbURLConst; // eslint-disable-line no-undef
const gCloudFnPronounce = gCloudFnPronounceConst; // eslint-disable-line no-undef

const SW_MSG_TYPE_LOGGER = swMsgTypeLoggerConst; // eslint-disable-line no-undef
const SW_MSG_TYPE_NEW_TERMS_ADDED = swMsgTypeNewTermsAddedConst; // eslint-disable-line no-undef

const getParam = getParamConst; // eslint-disable-line no-undef
const removeParam = removeParamConst; // eslint-disable-line no-undef

const appStaticCache = "nmemonica-static";
const appDataCache = "nmemonica-data";
const appMediaCache = "nmemonica-media";
const indexedDBVersion = 2;
const indexedDBStore = "media";
const NO_INDEXEDDB_SUPPORT =
  "Your browser doesn't support a stable version of IndexedDB.";

const dataVerURL = fbURL + "/lambda/cache.json";
const dataURL = [
  fbURL + "/lambda/phrases.json",
  fbURL + "/lambda/vocabulary.json",
  fbURL + "/lambda/opposites.json",
  fbURL + "/lambda/kanji.json",
];

let ERROR = 1,
  WARN = 2,
  DEBUG = 3;

function getVersions(){
  const jsVersion = cacheFiles
    .join(",")
    .match(new RegExp(/main.([a-z0-9]+).js/))[1];
  return { swVersion, jsVersion, bundleVersion: initCacheVer};
}

self.addEventListener("install", (e) => {
  self.skipWaiting();

  const versions = getVersions();
  clientMsg("SW_VERSION", versions);

  caches.open(appDataCache).then((cache) =>
    cache.add(dataVerURL).then(() =>
      Promise.all(
        dataURL.map((url) => {
          return getVersionForData(url).then((v) => cacheVerData(url, v));
        })
      )
    )
  );

  try {
    const a = ghURL;
    const b = ghURL + "/";
    caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([a, b]))
  }
  catch { }

  e.waitUntil(
    caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([...cacheFiles]))
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
      clientLogger("Matching clients:", urls.join(", "), DEBUG);
    });

  e.waitUntil(
    Promise.all([removeUnknowCaches(), removeOldStaticCaches()])

      // claim the client
      .then(function () {
        console.log("[ServiceWorker] Claiming clients");
        clientLogger("Claiming clients", DEBUG);
        return self.clients.claim();
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "DO_HARD_REFRESH") {
    fetch(dataVerURL)
      .then((res) => {
        if (res.status < 400) {
          return caches.delete(appStaticCache).then(() => {
            self.registration.unregister();
            clientMsg("DO_HARD_REFRESH", {
              msg: "Hard Refresh",
              status: res.status,
            });
          });
        } else {
          throw new Error("Service Unavailable");
        }
      })
      .catch((error) => {
        clientMsg("DO_HARD_REFRESH", { msg: "Hard Refresh", error });
      });
  } else if (event.data && event.data.type === "SW_VERSION") {
    const versions = getVersions();
    clientMsg("SW_VERSION", versions);
  }
});

self.addEventListener("fetch", (e) => {
  const req = e.request.clone();
  const url = e.request.url;

  if (e.request.method !== "GET") {
    return;
  }

  if (url === dataVerURL) {
    e.respondWith(appVersionReq());
  } else if (req.headers.get("Data-Version")) {
    e.respondWith(appDataReq(e.request));
  } else if (url.startsWith(ghURL)) {
    // site asset
    e.respondWith(appAssetReq(url));
  } else if (url.startsWith(gCloudFnPronounce + "/override_cache")) {
    // override cache site media asset
    console.log("[ServiceWorker] Overriding Asset in Cache");
    const uid = getParam(url, "uid");
    const cleanUrl = removeParam(url, "uid").replace("/override_cache", "");

    if (!self.indexedDB) {
      // use cache
      console.log(NO_INDEXEDDB_SUPPORT);
      clientLogger(NO_INDEXEDDB_SUPPORT, WARN);
      e.respondWith(recache(appMediaCache, cleanUrl));
    } else {
      // use indexedDB
      clientLogger("IDB.override", WARN);

      const fetchP = fetch(cleanUrl);
      const dbOpenPromise = openIDB();

      const dbResults = dbOpenPromise.then((db) => {
        return fetchP
          .then((res) => res.blob())
          .then((blob) =>
            putIDBItem(
              { db },
              {
                uid,
                blob,
              }
            ).then((dataO) => toResponse(dataO))
          );
      });

      e.respondWith(dbResults);
    }
  } else if (url.startsWith(gCloudFnPronounce)) {
    // site media asset

    const uid = getParam(url, "uid");
    const word = decodeURI(getParam(url, "q"));

    const cleanUrl = removeParam(url, "uid");

    if (!self.indexedDB) {
      // use cache
      console.log(NO_INDEXEDDB_SUPPORT);
      clientLogger(NO_INDEXEDDB_SUPPORT, WARN);
      e.respondWith(appMediaReq(cleanUrl));
    } else {
      // use indexedDB
      const dbOpenPromise = openIDB();

      const dbResults = dbOpenPromise.then((db) => {
        countIDBItem(db);

        return getIDBItem({ db }, uid)
          .then((dataO) =>
            //found
            toResponse(dataO)
          )
          .catch(() => {
            //not found
            clientLogger("IDB.get [] " + word, WARN);

            return fetch(cleanUrl)
              .then((res) => res.blob())
              .then((blob) =>
                addIDBItem({ db }, { uid, blob }).then((dataO) =>
                  toResponse(dataO)
                )
              );
          });
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

/**
 * indexedDB.open()
 * @param {*} version
 * @param {*} objStoreToCreate name of store to open or create
 * @param {{onUpgrDelStore:string}} {onUpgrDelStore} name of store to delete
 * @returns
 */
function openIDB(
  version = indexedDBVersion,
  objStoreToCreate = indexedDBStore,
  objStoreToDelete
) {
  let openRequest = indexedDB.open(appMediaCache, version);

  const dbUpgradeP = new Promise((resolve /*reject*/) => {
    openRequest.onupgradeneeded = function (event) {
      // Save the IDBDatabase interface
      let db = event.target.result;

      if (objStoreToDelete) {
        db.deleteObjectStore(objStoreToDelete);
      }

      // Create an objectStore for this database
      let objectStore = db.createObjectStore(objStoreToCreate, {
        keyPath: "uid",
      });
      // objectStore.createIndex("last", "last", { unique: false });

      // Use transaction oncomplete to make sure the objectStore creation is
      // finished before adding data into it.
      objectStore.transaction.oncomplete = function () {
        // Store values in the newly created objectStore.
        // console.log("upgrade success");
        // clientLogger("IDB.upgrade", DEBUG);
        resolve({ type: "upgrade", val: db });
      };
    };
  });

  const dbOpenP = new Promise((resolve, reject) => {
    openRequest.onerror = function (/*event*/) {
      clientLogger("IDB.open X(", ERROR);
      reject();
    };
    openRequest.onsuccess = function (event) {
      let db = event.target.result;

      db.onerror = function (event) {
        // Generic error handler for all errors targeted at this database's
        // requests!
        clientLogger("IDB " + event.target.errorCode + " X(", ERROR);
        console.error("Database error: " + event.target.errorCode);
      };

      // console.log("open success");
      resolve({ type: "open", val: db });
    };
  });

  return Promise.any([dbUpgradeP, dbOpenP]).then((pArr) => {
    // if upgradeP happens wait for dbOpenP
    if (pArr.type === "upgrade") {
      return dbOpenP.then((db) => db.val);
    }

    return pArr.val;
  });
}

/**
 * objectStore.getAll()
 * @param {number} version
 * @param {string} store
 * @returns {Promise} a promise containing array of results
 */
function dumpIDB(version, store) {
  let openRequest = indexedDB.open(appMediaCache, version);

  const dbOpenPromise = new Promise((resolve, reject) => {
    openRequest.onerror = function (/*event*/) {
      clientLogger("IDB.open X(", ERROR);
      reject();
    };
    openRequest.onsuccess = function (event) {
      let db = event.target.result;

      db.onerror = function (event) {
        // Generic error handler for all errors targeted at this database's
        // requests!
        clientLogger("IDB " + event.target.errorCode + " X(", ERROR);
        console.error("Database error: " + event.target.errorCode);
      };

      // console.log("open success");
      resolve(db);
    };
  });

  return dbOpenPromise.then((db) => {
    let transaction = db.transaction([store], "readonly");
    let objectStore = transaction.objectStore(store);

    const getAllP = new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onerror = () => {
        clientLogger("IDB.getAll X(", ERROR);
        reject();
      };
      request.onsuccess = (event) => {
        db.close();
        resolve(event.target.result);
      };
    });

    return getAllP;
  });
}

function clientMsg(type, msg) {
  return clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((client) => {
      if (client && client.length) {
        return client[0].postMessage({
          type,
          ...msg,
        });
      }
    });
}

function clientLogger(msg, lvl) {
  return clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((client) => {
      if (client && client.length) {
        return client[0].postMessage({
          type: SW_MSG_TYPE_LOGGER,
          msg,
          lvl,
        });
      }
    });
}

/**
 * objectStore.count()
 * @param {*} db
 * @param {string} store
 * @returns
 */
function countIDBItem(db, store = indexedDBStore) {
  var transaction = db.transaction([store]);
  var request = transaction.objectStore(store).count();

  const requestP = new Promise((resolve, reject) => {
    request.onerror = function (/*event*/) {
      clientLogger("IDB.count X(", ERROR);
      reject();
    };
    request.onsuccess = function () {
      if (request.result) {
        clientLogger("IDB [" + request.result + "]", DEBUG);
        resolve(request.result);
      } else {
        clientLogger("IDB []", WARN);
        resolve();
      }
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function () {
      resolve();
    };
    transaction.onerror = function () {
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then((pArr) => pArr[0]);
}

/**
 * objectStore.get(key)
 * @param {{db:*, store:string}} param0
 * @param {*} key
 * @returns
 */
function getIDBItem({ db, store = indexedDBStore }, key) {
  var transaction = db.transaction([store]);
  var request = transaction.objectStore(store).get(key);

  const requestP = new Promise((resolve, reject) => {
    request.onerror = function (/*event*/) {
      clientLogger("IDB.get X(", ERROR);
      reject();
    };
    request.onsuccess = function () {
      if (request.result) {
        resolve(request.result);
      } else {
        reject();
      }
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function () {
      resolve();
    };
    transaction.onerror = function () {
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then((pArr) => pArr[0]);
}

/**
 * objectStore.add(value)
 * @param {{db:*, store:string}} {db, store}
 * @param {*} value
 * @returns
 */
function addIDBItem({ db, store = indexedDBStore }, value) {
  let transaction = db.transaction([store], "readwrite");

  let request = transaction.objectStore(store).add(value);

  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (/*event*/) {
      resolve();
    };
    request.onerror = function () {
      clientLogger("IDB.add X(", ERROR);
      reject();
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function () {
      resolve(value);
    };
    transaction.onerror = function () {
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then((arrP) => arrP[1]);
}

/**
 * objectStore.put(value)
 * @param {{db:*, store:string}} {db, store}
 * @param {*} value
 * @returns
 */
function putIDBItem({ db, store = indexedDBStore }, value) {
  let transaction = db.transaction([store], "readwrite");

  let request = transaction.objectStore(store).put(value);

  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (/*event*/) {
      resolve();
    };
    request.onerror = function () {
      clientLogger("IDB.put X(", ERROR);
      reject();
    };
  });

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function () {
      resolve(value);
    };
    transaction.onerror = function () {
      reject();
    };
  });

  return Promise.all([requestP, transactionP]).then((arrP) => arrP[1]);
}

/**
 * objectStore.delete(key)
 * @param {*} db
 * @param {*} store
 * @param {*} key
 * @returns
 */
function deleteIDBItem(db, store, key) {
  var transaction = db.transaction([store], "readwrite");

  let request = transaction.objectStore(store).delete(key);

  request.onsuccess = function (/*event*/) {};
  request.onerror = function () {
    clientLogger("IDB.delete X(", ERROR);
  };

  const transactionP = new Promise((resolve, reject) => {
    transaction.oncomplete = function () {
      resolve();
    };
    transaction.onerror = function () {
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

  // fetch, compare, update
  const fetchAndUpdateRes = fetchVerSendNewDiffsMsg();

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

/**
 * @returns {Promise} a promise with the cached jsonObj
 * @param {String} cacheName
 * @param {String} url
 * @param {Object} jsonObj
 * @param {String} type
 * @param {Number} status
 * @param {String} statusText
 */
function updateCacheWithJSON(
  cacheName,
  url,
  jsonObj,
  type = "application/json",
  status = 200,
  statusText = "OK"
) {
  // update cache with fetched version results
  const blob = new Blob([JSON.stringify(jsonObj)], {
    type,
  });
  const init = { status, statusText };
  const createdRes = new Response(blob, init);

  return caches
    .open(cacheName)
    .then((cache) => cache.put(url, createdRes).then(() => cache.match(url)));
}

// TODO: refactor this
/**
 * Finds changed term lists based on version.
 * Creates object with newly added terms.
 * Messages client with updates data.
 * @returns {Promise} a promise containing the fetched res
 */
function fetchVerSendNewDiffsMsg() {
  return fetch(dataVerURL)
    .then((r) => r.json())
    .then((resNew) =>
      caches
        .open(appDataCache)
        .then((cache) => cache.match(dataVerURL))
        .then((r) => r.json())
        .then((resOld) => {
          // create obj with new and old hashes
          let newTermsMsgPromise = Promise.resolve();
          let versionChange = {};
          let update = false;
          const allowedSets = ["vocabulary", "phrases"];
          for (let n in resNew) {
            if (allowedSets.includes(n)) {
              if (resOld[n] !== resNew[n]) {
                versionChange[n] = { old: resOld[n], new: resNew[n] };
                update = !update ? true : true;
              }
            }
          }

          // update cache with fetched version results
          const fetchRes = updateCacheWithJSON(
            appDataCache,
            dataVerURL,
            resNew
          );

          // look for changes in terms with new & old hashes values
          if (update) {
            update = false;
            // console.log("v: " + JSON.stringify(versionChange));

            let newlyAdded = {};
            let ps = [];
            for (let setName in versionChange) {
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

            // message results to client
            newTermsMsgPromise = Promise.all(ps).then(() => {
              if (update) {
                return clients
                  .matchAll({ includeUncontrolled: true, type: "window" })
                  .then((client) => {
                    if (client && client.length) {
                      // console.log("[SW] posting message");
                      return client[0].postMessage({
                        type: SW_MSG_TYPE_NEW_TERMS_ADDED,
                        msg: newlyAdded,
                      });
                    }

                    return Promise.resolve();
                  });
              }
            });
          }

          return Promise.all([fetchRes, newTermsMsgPromise]).then(
            (allPromises) => allPromises[0]
          );
        })
    );
}
