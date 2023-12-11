const buildConstants = { swVersion: "c76059dc", initCacheVer: "27794e89" };

const SWMsgOutgoing = {
  SW_CACHE_DATA: "SW_CACHE_DATA",
  SW_VERSION: "SW_VERSION",
  SET_ENDPOINT: "SET_ENDPOINT",
  DO_HARD_REFRESH: "DO_HARD_REFRESH",
  RECACHE_DATA: "RECACHE_DATA",
};

const SWMsgIncoming = {
  POST_INSTALL_ACTIVATE_DONE: "POST_INSTALL_ACTIVATE_DONE",
  SERVICE_WORKER_LOGGER_MSG: "service_worker_logger_msg",
  SERVICE_WORKER_NEW_TERMS_ADDED: "service_worker_new_terms",
};

const DebugLevel = { OFF: 0, ERROR: 1, WARN: 2, DEBUG: 3 };

function getParam(baseUrl, param) {
  const queryPart = baseUrl.includes("?") ? baseUrl.split("?")[1] : "";
  const search = new URLSearchParams(queryPart);
  const result = search.get(param);
  return result;
}

function removeParam(baseUrl, param) {
  const [basePart, queryPart] = baseUrl.includes("?")
    ? baseUrl.split("?")
    : [baseUrl, ""];
  const search = new URLSearchParams(queryPart);
  search.delete(param);
  return [basePart, search.toString()].join("?");
}

function initServiceWorker({
  swVersion,
  initCacheVer,
  cacheFiles,
  getParam,
  removeParam,
}) {
  const swSelf = globalThis.self;
  swSelf.addEventListener("install", installEventHandler);
  swSelf.addEventListener("activate", activateEventHandler);
  swSelf.addEventListener("fetch", fetchEventHandler);
  swSelf.addEventListener("message", messageEventHandler);
  swSelf.addEventListener("push", pushEventHandler);
  const appStaticCache = "nmemonica-static";
  const appDataCache = "nmemonica-data";
  const appMediaCache = "nmemonica-media";
  const indexedDBVersion = 2;
  const indexedDBStore = "media";
  const NO_INDEXEDDB_SUPPORT =
    "Your browser doesn't support a stable version of IndexedDB.";
  let urlSourceUI;
  let urlServiceData;
  let urlServicePronounceURL;
  let getDataPath;
  let getAudioPath;
  const dataVerPath = "/cache.json";
  const dataSourcePath = [
    "/phrases.json",
    "/vocabulary.json",
    "/opposites.json",
    "/kanji.json",
  ];
  /** Pronounce cache override */
  const override = "/override_cache";
  const dataVersionHeader = "Data-Version";
  function getVersions() {
    const main =
      cacheFiles.find((f) => f.match(new RegExp(/main.([a-z0-9]+).js/))) ||
      "main.00000000.js";
    const [_jsName, jsVersion] = main.split(".");
    return { swVersion, jsVersion, bundleVersion: initCacheVer };
  }
  /**
   * Update specified data set and hash cache from the local service.
   * @param serviceUrl
   * @param name of data set
   * @param hash
   */
  function updateFromLocalService(serviceUrl, name, hash) {
    return caches.open(appDataCache).then((cache) => {
      const url = `${urlServiceData}/${name}.json.v${hash}`;
      if (urlServiceData !== serviceUrl) {
        clientLogger(
          "Push service url does not match service worker",
          DebugLevel.ERROR,
        );
        // if they don't match user_DataServiceUrl will be overwritten with serviceUrl's data
        return;
      }
      return fetch(`${serviceUrl}/${name}.json`).then((fetchRes) =>
        cache
          .match(urlServiceData + dataVerPath)
          .then((verRes) => verRes.json())
          .then((verJson) => {
            verJson[name] = hash;
            return verJson;
          })
          .then((newVerJson) => {
            return Promise.all([
              // update version object
              updateCacheWithJSON(
                appDataCache,
                urlServiceData + dataVerPath,
                newVerJson,
              ),
              // update data object
              cache.put(url, fetchRes.clone()),
            ]);
          }),
      );
    });
  }
  function isPushConfirmation(m) {
    return m.body.type === "push-subscription";
  }
  function isPushDataUpdate(m) {
    return m.body.type === "push-data-update";
  }
  function pushEventHandler(e) {
    var _a;
    const message =
      (_a = e.data) === null || _a === void 0 ? void 0 : _a.json();
    if (!message) {
      clientLogger("Bad message", DebugLevel.ERROR);
      return;
    }
    if (isPushConfirmation(message)) {
      const confirmationP = swSelf.registration.showNotification(
        message.title,
        {
          body: message.body.msg,
          icon: "",
          tag: message.tag,
        },
      );
      e.waitUntil(confirmationP);
      return;
    }
    if (isPushDataUpdate(message)) {
      const { name, hash, url } = message.body;
      const n = name.toLowerCase();
      const cacheP = updateFromLocalService(url, n, hash);
      const doneP = cacheP.then(() => {
        const notifP = swSelf.registration.showNotification(message.title, {
          body: `${name}.json.v${hash}`,
          icon: "",
          tag: message.tag,
        });
        return notifP;
      });
      e.waitUntil(doneP);
      // const notification = new Notification("Verify", {
      //   body: "message",
      //   tag: "simple-push-demo-notification",
      //   // icon,
      // });
      // notification.addEventListener("click", () => {
      //   console.log("confirmed")
      //   // swSelf.clients.openWindow(
      //   //   "https://example.blog.com/2015/03/04/something-new.html"
      //   // );
      // });
    }
  }
  /**
   * Cache all data resources
   */
  function cacheAllDataResource() {
    return caches
      .open(appDataCache)
      .then((cache) =>
        cache.add(urlServiceData + dataVerPath).then(() =>
          Promise.all(
            dataSourcePath.map((path) => {
              const url = urlServiceData + path;
              return getVersionForData(url).then((v) => cacheVerData(url, v));
            }),
          ),
        ),
      )
      .catch(() => {
        console.log("[ServiceWorker] Data Prefech failed for some item");
      });
  }
  /**
   * Cache all static site assets
   */
  function cacheAllStaticAssets() {
    return caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([...cacheFiles]))
      .catch(() => {
        console.log("[ServiceWorker] Asset Prefectch failed for some item");
      });
  }
  /**
   * Cache the root / assets
   */
  function cacheAllRoot() {
    const a = urlSourceUI;
    const b = urlSourceUI + "/";
    return caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([a, b]))
      .catch(() => {
        console.log("[ServiceWorker] / Prefectch failed for some item");
      });
  }
  function installEventHandler(_e) {
    void swSelf.skipWaiting();
    const versions = getVersions();
    clientMsg("SW_VERSION", versions);
  }
  /**
   * Cache all resources
   * @param e
   */
  function postInstallEventHandler(e) {
    const dataCacheP = cacheAllDataResource();
    const rootCacheP = cacheAllRoot();
    const staticAssetCacheP = cacheAllStaticAssets();
    e.waitUntil(Promise.all([dataCacheP, staticAssetCacheP, rootCacheP]));
  }
  function activateEventHandler(e) {
    void swSelf.clients
      .matchAll({ includeUncontrolled: true })
      .then(function (clientList) {
        const urls = clientList.map(function (client) {
          return client.url;
        });
        console.log("[ServiceWorker] Matching clients:", urls.join(", "));
        clientLogger("Matching clients:" + urls.join(", "), DebugLevel.DEBUG);
      });
    e.waitUntil(
      Promise.all([removeUnknowCaches(), removeOldStaticCaches()])
        // claim the client
        .then(function () {
          console.log("[ServiceWorker] Claiming clients");
          clientLogger("Claiming clients", DebugLevel.DEBUG);
          return swSelf.clients.claim();
        })
        .then(() => {
          // Notify app service worker is ready
          clientMsg(SWMsgIncoming.POST_INSTALL_ACTIVATE_DONE, {});
        }),
    );
  }
  /** Post serviceworker install */
  function isMessageInitCache(m) {
    return m.type === SWMsgOutgoing.SW_CACHE_DATA;
  }
  function isMessageRecacheData(m) {
    return m.type === SWMsgOutgoing.RECACHE_DATA;
  }
  /** User changing default service endpoint */
  function isMessageOverrideEndpoint(m) {
    return m.type === SWMsgOutgoing.SET_ENDPOINT;
  }
  function isMessageHardRefresh(m) {
    return m.type === SWMsgOutgoing.DO_HARD_REFRESH;
  }
  function isMessageGetVersion(m) {
    return m.type === SWMsgOutgoing.SW_VERSION;
  }
  function messageEventHandler(event) {
    const message = event.data;
    if (
      isMessageInitCache(message) &&
      message.type === SWMsgOutgoing.SW_CACHE_DATA
    ) {
      const { ui, data, media } = message.endpoint;
      urlSourceUI = ui;
      urlServiceData = data;
      urlServicePronounceURL = media;
      getDataPath = data.slice(data.lastIndexOf("/"));
      getAudioPath = media.slice(media.lastIndexOf("/"));
      // Cache stuff
      postInstallEventHandler(event);
      return;
    }
    if (
      isMessageRecacheData(message) &&
      message.type === SWMsgOutgoing.RECACHE_DATA
    ) {
      const dataCacheP = cacheAllDataResource();
      event.waitUntil(dataCacheP);
      return;
    }
    if (
      isMessageOverrideEndpoint(message) &&
      message.type === SWMsgOutgoing.SET_ENDPOINT
    ) {
      const { data, media } = message.endpoint;
      urlServiceData = data;
      urlServicePronounceURL = media;
      getDataPath = data.slice(data.lastIndexOf("/"));
      getAudioPath = media.slice(media.lastIndexOf("/"));
      return;
    }
    if (
      isMessageHardRefresh(message) &&
      message.type === SWMsgOutgoing.DO_HARD_REFRESH
    ) {
      fetch(urlServiceData + dataVerPath)
        .then((res) => {
          if (res.status < 400) {
            return caches.delete(appStaticCache).then(() => {
              void swSelf.registration.unregister();
              clientMsg(SWMsgOutgoing.DO_HARD_REFRESH, {
                msg: "Hard Refresh",
                status: res.status,
              });
            });
          } else {
            throw new Error("Service Unavailable");
          }
        })
        .catch((error) => {
          clientMsg(SWMsgOutgoing.DO_HARD_REFRESH, {
            msg: "Hard Refresh",
            error,
          });
        });
      return;
    }
    if (
      isMessageGetVersion(message) &&
      message.type === SWMsgOutgoing.SW_VERSION
    ) {
      const versions = getVersions();
      clientMsg(SWMsgOutgoing.SW_VERSION, versions);
      return;
    }
    clientLogger("Unrecognized message", DebugLevel.ERROR);
  }
  /**
   * User overriding media cached asset
   */
  function pronounceOverride(url) {
    console.log("[ServiceWorker] Overriding Asset in Cache");
    const uid = getParam(url, "uid");
    const cleanUrl = removeParam(url, "uid").replace(override, "");
    const myRequest = toRequest(cleanUrl);
    if (!swSelf.indexedDB) {
      // use cache
      console.log(NO_INDEXEDDB_SUPPORT);
      clientLogger(NO_INDEXEDDB_SUPPORT, DebugLevel.WARN);
      return recache(appMediaCache, myRequest);
    } else {
      // use indexedDB
      clientLogger("IDB.override", DebugLevel.WARN);
      const fetchP = fetch(myRequest);
      const dbOpenPromise = openIDB();
      const dbResults = dbOpenPromise.then((db) => {
        void countIDBItem(db);
        return fetchP
          .then((res) => {
            if (!res.ok) {
              clientLogger("fetch", DebugLevel.ERROR);
              throw new Error(
                "Network response was not OK" +
                  (res.status ? " (" + res.status + ")" : ""),
              );
            }
            return res.blob();
          })
          .then((blob) =>
            putIDBItem(
              { db },
              {
                uid,
                blob,
              },
            ).then((dataO) => toResponse(dataO)),
          );
      });
      return dbResults;
    }
  }
  /**
   * Site media asset
   */
  function pronounce(url) {
    const uid = getParam(url, "uid");
    const word = decodeURI(getParam(url, "q"));
    const cleanUrl = removeParam(url, "uid");
    if (!swSelf.indexedDB) {
      // use cache
      console.log(NO_INDEXEDDB_SUPPORT);
      clientLogger(NO_INDEXEDDB_SUPPORT, DebugLevel.WARN);
      return appMediaReq(cleanUrl);
    } else {
      // use indexedDB
      const dbOpenPromise = openIDB();
      const dbResults = dbOpenPromise.then((db) => {
        return getIDBItem({ db }, uid)
          .then((dataO) =>
            //found
            toResponse(dataO),
          )
          .catch(() => {
            //not found
            clientLogger("IDB.get [] " + word, DebugLevel.WARN);
            return fetch(cleanUrl)
              .then((res) => {
                if (!res.ok) {
                  clientLogger("fetch", DebugLevel.ERROR);
                  throw new Error(
                    "Network response was not OK" +
                      (res.status ? " (" + res.status + ")" : ""),
                  );
                }
                return res.blob();
              })
              .then((blob) =>
                addIDBItem({ db }, { uid, blob }).then((dataO) =>
                  toResponse(dataO),
                ),
              );
          });
      });
      return dbResults;
    }
  }
  function noCaching(e) {
    // for debugging purposes
    return fetch(e.request);
  }
  function fetchEventHandler(e) {
    const req = e.request.clone();
    const url = e.request.url;
    const protocol = "https://";
    const path = url.slice(url.indexOf("/", protocol.length + 1));
    if (e.request.method !== "GET") {
      return;
    }
    switch (true) {
      case /* cache.json */ path.startsWith(getDataPath + dataVerPath):
        e.respondWith(appVersionReq(urlServiceData + dataVerPath));
        break;
      case /* data */ req.headers.get(dataVersionHeader) !== null:
        {
          const asset = path.slice(path.lastIndexOf("/"));
          const rewriteUrl = urlServiceData + asset;
          const ver = e.request.headers.get(dataVersionHeader);
          e.respondWith(appDataReq(rewriteUrl, ver));
        }
        break;
      case /* UI asset */ url.startsWith(urlSourceUI) &&
        !url.endsWith(".hot-update.json"):
        {
          // No rewrite for UI
          e.respondWith(appAssetReq(url));
        }
        break;
      case /* pronounce override */ path.startsWith(getAudioPath + override):
        {
          const query = path.slice(path.lastIndexOf("?"));
          const rewriteUrl = urlServicePronounceURL + query;
          e.respondWith(pronounceOverride(rewriteUrl));
        }
        break;
      case /* pronounce */ path.startsWith(getAudioPath):
        {
          const query = path.slice(path.lastIndexOf("?"));
          const rewriteUrl = urlServicePronounceURL + query;
          e.respondWith(pronounce(rewriteUrl));
        }
        break;
      default:
        /* everything else */
        e.respondWith(noCaching(e));
        break;
    }
  }
  /**
   * Creates a request from url
   *
   * Adds authentication in development env
   */
  function toRequest(url) {
    const myInit = {
      method: "GET",
    };
    return new Request(url, myInit);
  }
  /**
   * Retrieved cache object to Response
   */
  function toResponse(obj) {
    const status = 200,
      statusText = "OK";
    const init = { status, statusText };
    return new Response(obj.blob, init);
  }
  /**
   * indexedDB.open()
   * @param version
   * @param objStoreToCreate name of store to open or create
   * @param objStoreToDelete name of store to delete
   */
  function openIDB(
    version = indexedDBVersion,
    objStoreToCreate = indexedDBStore,
    objStoreToDelete,
  ) {
    let openRequest = indexedDB.open(appMediaCache, version);
    const dbUpgradeP = new Promise((resolve /*reject*/) => {
      openRequest.onupgradeneeded = function (event) {
        if (event.target === null) throw new Error("onupgradeneeded failed");
        // Save the IDBDatabase interface
        const db = event.target.result;
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
          // clientLogger("IDB.upgrade", DebugLevel.DEBUG);
          resolve({ type: "upgrade", val: db });
        };
      };
    });
    const dbOpenP = new Promise((resolve, reject) => {
      openRequest.onerror = function (/*event*/) {
        clientLogger("IDB.open X(", DebugLevel.ERROR);
        reject();
      };
      openRequest.onsuccess = function (event) {
        if (event.target === null) throw new Error("openIDB failed");
        const db = event.target.result;
        db.onerror = function (event) {
          // Generic error handler for all errors targeted at this database's
          // requests!
          if (event.target && "errorCode" in event.target) {
            const { errorCode: _errorCode } = event.target;
            clientLogger("IDB Open X(", DebugLevel.ERROR);
          }
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
   * Post message to client
   */
  function clientMsg(type, msg) {
    void swSelf.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((client) => {
        if (client && client.length) {
          return client[0].postMessage(Object.assign({ type }, msg));
        }
      });
  }
  /**
   * Log to client
   */
  function clientLogger(msg, lvl) {
    swSelf.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((client) => {
        if (client && client.length) {
          return client[0].postMessage({
            type: SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG,
            msg,
            lvl,
          });
        }
      })
      .catch((err) => {
        console.log("[ServiceWorker] clientLogger failed");
        console.log(err);
      });
  }
  /**
   * objectStore.count()
   */
  function countIDBItem(db, store = indexedDBStore) {
    const transaction = db.transaction([store]);
    const request = transaction.objectStore(store).count();
    const requestP = new Promise((resolve, reject) => {
      request.onerror = function (/*event*/) {
        clientLogger("IDB.count X(", DebugLevel.ERROR);
        reject();
      };
      request.onsuccess = function () {
        if (request.result) {
          clientLogger("IDB [" + request.result + "]", DebugLevel.DEBUG);
          resolve(request.result);
        } else {
          clientLogger("IDB []", DebugLevel.WARN);
          resolve(-1);
        }
      };
    });
    const transactionP = new Promise((resolve, reject) => {
      transaction.oncomplete = function () {
        resolve(undefined);
      };
      transaction.onerror = function () {
        reject();
      };
    });
    return Promise.all([requestP, transactionP]).then((pArr) => pArr[0]);
  }
  /**
   * objectStore.get(key)
   */
  function getIDBItem({ db, store = indexedDBStore }, key) {
    const transaction = db.transaction([store]);
    const request = transaction.objectStore(store).get(key);
    const requestP = new Promise((resolve, reject) => {
      request.onerror = function (/*event*/) {
        clientLogger("IDB.get X(", DebugLevel.ERROR);
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
        resolve(undefined);
      };
      transaction.onerror = function () {
        reject();
      };
    });
    return Promise.all([requestP, transactionP]).then((pArr) => pArr[0]);
  }
  /**
   * objectStore.add(value)
   */
  function addIDBItem({ db, store = indexedDBStore }, value) {
    let transaction = db.transaction([store], "readwrite");
    let request = transaction.objectStore(store).add(value);
    const requestP = new Promise((resolve, reject) => {
      request.onsuccess = function (/*event*/) {
        resolve(undefined);
      };
      request.onerror = function () {
        clientLogger("IDB.add X(", DebugLevel.ERROR);
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
   */
  function putIDBItem({ db, store = indexedDBStore }, value) {
    let transaction = db.transaction([store], "readwrite");
    let request = transaction.objectStore(store).put(value);
    const requestP = new Promise((resolve, reject) => {
      request.onsuccess = function (/*event*/) {
        resolve(undefined);
      };
      request.onerror = function () {
        clientLogger("IDB.put X(", DebugLevel.ERROR);
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
   * respond with cache match always fetch and re-cache
   * may return stale version
   * @returns a Promise with a cache response
   */
  function appVersionReq(url) {
    // fetch new versions
    const f = fetch(url).then((res) => {
      const resClone = res.clone();
      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
      // update cache from new
      void caches.open(appDataCache).then((cache) => cache.put(url, resClone));
      return res;
    });
    // check if in cache
    const c = caches
      .open(appDataCache)
      .then((cache) => cache.match(url))
      .then((cacheRes) => {
        if (!cacheRes) {
          throw new Error("Not in cache");
        }
        return cacheRes;
      });
    // return whaterver is fastest
    return Promise.any([f, c]).catch((errs) => Promise.reject(errs[0].message));
  }
  /**
   * get from cache on fail fetch and re-cache
   * first match may be stale
   * @returns a Promise with a cached dataVersion response
   */
  function appVersionCacheOnFailFetch(authority) {
    return caches.open(appDataCache).then((cache) =>
      cache.match(authority + getDataPath + dataVerPath).then((cacheRes) => {
        if (cacheRes) {
          return Promise.resolve(cacheRes);
        } else {
          return recache(appDataCache, authority + getDataPath + dataVerPath);
        }
      }),
    );
  }
  /**
   * When request contains Data-Version != 0 the version is used otherwise
   * the version is searched in the cache
   * @returns a Promise that yieds a cached response
   */
  function appDataReq(url, version) {
    let response;
    if (!version || version === "0") {
      response = getVersionForData(url).then((v) => cacheVerData(url, v));
    } else {
      response = cacheVerData(url, version);
    }
    return response;
  }
  /**
   * @returns a Promise that yields the version on the cache for the provided request
   */
  function getVersionForData(url) {
    const authority = url.slice(0, url.indexOf("/", "https://".length));
    const filename = url.split("/").pop() || url;
    const [dName] = filename.split(".json");
    return appVersionCacheOnFailFetch(authority)
      .then((res) => res && res.json())
      .then((versions) => versions[dName]);
  }
  /**
   * when cache match fails fetch and re-cache (only good response)
   * @returns a Promise that yieds a cached response
   */
  function cacheVerData(url, v) {
    const urlVersion = url + ".v" + v;
    return caches.open(appDataCache).then((cache) =>
      cache.match(urlVersion).then((cacheRes) => {
        return (
          cacheRes ||
          fetch(url).then((fetchRes) => {
            if (fetchRes.status < 400) {
              void cache.put(urlVersion, fetchRes.clone());
            }
            return fetchRes;
          })
        );
      }),
    );
  }
  /**
   * cache match first otherwise fetch then cache
   * @returns a Promise that yieds a cached response
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
   */
  function recache(cacheName, url) {
    return caches.open(cacheName).then((cache) =>
      cache
        .add(url)
        .then(() => cache.match(url))
        .catch(() => {
          console.log("[ServiceWorker] Network unavailable");
          return Promise.reject();
        }),
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
        }, []),
      ),
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
            if (name && name.indexOf(".") > -1 && !cacheFiles.includes(name)) {
              console.log("[ServiceWorker] Removed static asset: " + name);
              return [...acc, cache.delete(req.url)];
            }
            return acc;
          }, []),
        ),
      ),
    );
  }
  /**
   * @returns a promise with the cached jsonObj
   */
  function updateCacheWithJSON(
    cacheName,
    url,
    jsonObj,
    type = "application/json",
    status = 200,
    statusText = "OK",
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
}

const cacheFiles = [
  "11f4a4136ea351b3efb4.png",
  "125.5d152486.js",
  "192.4333daee.css",
  "192.4333daee.js",
  "229.cda58fc5.js",
  "23.6af8dc54.js",
  "232.ba17d5d3.css",
  "232.ba17d5d3.js",
  "331225628f00d1a9fb35.jpeg",
  "352.b3c756ee.js",
  "4156f5574d12ea2e130b.png",
  "463.dd239938.css",
  "463.dd239938.js",
  "657.a73fb00d.js",
  "71565d048a3f03f60ac5.png",
  "802.65d665ab.css",
  "802.65d665ab.js",
  "832.c1a7f121.css",
  "832.c1a7f121.js",
  "856.f9bd9358.js",
  "927.bfc4db9c.js",
  "dc7b0140cb7644f73ef2.png",
  "ee636d032d073f55d622.png",
  "favicon.ico",
  "icon192.png",
  "icon512.png",
  "index.html",
  "main.60955266.css",
  "main.60955266.js",
  "manifest.webmanifest",
  "maskable512.png",
];

initServiceWorker({ ...buildConstants, getParam, removeParam, cacheFiles });
