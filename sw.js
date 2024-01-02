const buildConstants = {
  swVersion: "cefb131d",
  initCacheVer: "1882e58b",
  urlAppUI: "https://bryanjimenez.github.io/nmemonica",
  urlDataService: "https://nmemonica-9d977.firebaseio.com/lambda",
  urlPronounceService:
    "https://us-east1-nmemonica-9d977.cloudfunctions.net/g_translate_pronounce",
  audioPath: "/g_translate_pronounce",
  dataPath: "/lambda",
};

const SWMsgOutgoing = {
  SW_GET_VERSIONS: "SW_GET_VERSIONS",
  SW_REFRESH_HARD: "SW_REFRESH_HARD",
  DATASET_JSON_SAVE: "DATASET_JSON_SAVE",
};

const SWMsgIncoming = {
  POST_INSTALL_ACTIVATE_DONE: "POST_INSTALL_ACTIVATE_DONE",
  SERVICE_WORKER_LOGGER_MSG: "service_worker_logger_msg",
  SERVICE_WORKER_NEW_TERMS_ADDED: "service_worker_new_terms",
};

const SWRequestHeader = {
  NO_CACHE: "X-No-Cache",
  DATA_VERSION: "Data-Version",
};

const IDBStores = {
  MEDIA: "media",
  STATE: "state",
  SETTINGS: "settings",
  WORKBOOK: "workbook",
};

const IDBKeys = { State: { EDITED: "localDataEdited" } };

const DebugLevel = { OFF: 0, ERROR: 1, WARN: 2, DEBUG: 3 };

const appDBName = "nmemonica-db";

const appDBVersion = 1;

const IDBErrorCause = { NoResult: "IDBNoResults" };

function openIDB({ version, logger } = {}) {
  // const v = version!==undefined?version:appDBVersion;
  let openRequest = indexedDB.open(
    appDBName,
    version !== null && version !== void 0 ? version : appDBVersion,
  );
  const dbUpgradeP = new Promise((resolve /*reject*/) => {
    openRequest.onupgradeneeded = function (event) {
      if (event.target === null) throw new Error("onupgradeneeded failed");
      // Save the IDBDatabase interface
      const db = event.target.result;
      switch (event.oldVersion) {
        case 0: {
          // initial install
          // Create an objectStore for this database
          const mediaStore = db.createObjectStore(IDBStores.MEDIA, {
            keyPath: "uid",
          });
          // Use transaction oncomplete to make sure the objectStore creation is
          // finished before adding data into it.
          const mediaStoreP = new Promise((mediaRes, _reject) => {
            mediaStore.transaction.oncomplete = function () {
              mediaRes();
            };
          });
          const stateStore = db.createObjectStore(IDBStores.STATE, {
            keyPath: "key",
          });
          const stateStoreP = new Promise((stateRes, _reject) => {
            stateStore.transaction.oncomplete = function () {
              stateRes();
            };
          });
          const settingsStore = db.createObjectStore(IDBStores.SETTINGS, {
            keyPath: "key",
          });
          const settingStoreP = new Promise((settingRes, _reject) => {
            settingsStore.transaction.oncomplete = function () {
              settingRes();
            };
          });
          const workbookStore = db.createObjectStore(IDBStores.WORKBOOK, {
            keyPath: "key",
          });
          const workbookStoreP = new Promise((workbookRes, _reject) => {
            workbookStore.transaction.oncomplete = function () {
              workbookRes();
            };
          });
          void Promise.all([
            mediaStoreP,
            stateStoreP,
            settingStoreP,
            workbookStoreP,
          ]).then(() => {
            // DONE creating db and stores
            resolve({ type: "upgrade", val: db });
          });
          break;
        }
      }
    };
  });
  const dbOpenP = new Promise((resolve, reject) => {
    openRequest.onerror = function (/*event*/) {
      if (typeof logger === "function") {
        logger("IDB.open X(", 1);
      }
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
          if (typeof logger === "function") {
            logger("IDB Open X(", 1);
          }
        }
      };
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

function getIDBItem({ db, store, logger }, key) {
  const defaultStore = IDBStores.MEDIA;
  const transaction = db.transaction([
    store !== null && store !== void 0 ? store : defaultStore,
  ]);
  const request = transaction
    .objectStore(store !== null && store !== void 0 ? store : defaultStore)
    .get(key);
  const requestP = new Promise((resolve, reject) => {
    request.onerror = function (/*event*/) {
      if (typeof logger === "function") {
        logger("IDB.get X(", 1);
      }
      reject();
    };
    request.onsuccess = function () {
      if (request.result) {
        resolve(request.result);
      } else {
        reject(
          // @ts-expect-error Error.cause
          new Error("No results found", {
            cause: { code: IDBErrorCause.NoResult },
          }),
        );
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

function putIDBItem({ db, store }, value) {
  const defaultStore = IDBStores.MEDIA;
  let transaction = db.transaction(
    [store !== null && store !== void 0 ? store : defaultStore],
    "readwrite",
  );
  let request = transaction
    .objectStore(store !== null && store !== void 0 ? store : defaultStore)
    .put(value);
  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (/*event*/) {
      resolve(undefined);
    };
    request.onerror = function () {
      // clientLogger("IDB.put X(", DebugLevel.ERROR);
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

function addIDBItem({ db, store }, value) {
  const defaultStore = IDBStores.MEDIA;
  let transaction = db.transaction(
    [store !== null && store !== void 0 ? store : defaultStore],
    "readwrite",
  );
  let request = transaction
    .objectStore(store !== null && store !== void 0 ? store : defaultStore)
    .add(value);
  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (/*event*/) {
      resolve(undefined);
    };
    request.onerror = function () {
      // clientLogger("IDB.add X(", DebugLevel.ERROR);
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
  urlAppUI,
  urlDataService,
  urlPronounceService: _urlPronounceService,
  audioPath,
  dataPath,
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
  const NO_INDEXEDDB_SUPPORT =
    "Your browser doesn't support a stable version of IndexedDB.";
  const dataVerPath = "/cache.json";
  const dataSourcePath = [
    "/phrases.json",
    "/vocabulary.json",
    "/opposites.json",
    "/kanji.json",
  ];
  /** Pronounce cache override */
  const override = "/override_cache";
  function getVersions() {
    const main =
      cacheFiles.find((f) => f.match(new RegExp(/main.([a-z0-9]+).js/))) ||
      "main.00000000.js";
    const [_jsName, jsVersion] = main.split(".");
    return { swVersion, jsVersion, bundleVersion: initCacheVer };
  }
  /**
   * Update specified data set and hash cache from the local service.
   * @param pushUrl
   * @param name of data set
   * @param hash
   */
  function updateFromLocalService(pushUrl, name, hash) {
    return caches.open(appDataCache).then((cache) => {
      const url = `${pushUrl}/${name}.json.v${hash}`;
      // TODO: what if ip changed?
      // if (url_ServiceData !== pushUrl) {
      clientLogger(
        // "Push service url does not match service worker",
        "Validate override url matches push url",
        DebugLevel.ERROR,
      );
      // if they don't match user_DataServiceUrl will be overwritten with serviceUrl's data
      // return;
      // }
      return fetch(`${pushUrl}/${name}.json`).then((fetchRes) =>
        cache
          .match(pushUrl + dataVerPath)
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
                pushUrl + dataVerPath,
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
  function cacheAllDataResource(baseUrl) {
    return caches
      .open(appDataCache)
      .then((cache) =>
        cache.add(baseUrl + dataVerPath).then(() =>
          Promise.all(
            dataSourcePath.map((path) => {
              const url = baseUrl + path;
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
    const a = urlAppUI;
    const b = urlAppUI + "/";
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
    clientMsg(SWMsgOutgoing.SW_GET_VERSIONS, versions);
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
          const dataCacheP = isUserEditedData().then((isEdited) => {
            if (!isEdited) {
              return cacheAllDataResource(urlDataService);
            }
            return;
          });
          const rootCacheP = cacheAllRoot();
          const staticAssetCacheP = cacheAllStaticAssets();
          return Promise.all([dataCacheP, rootCacheP, staticAssetCacheP]);
        }),
    );
  }
  function isMsgSaveDataJSON(m) {
    return m.type === SWMsgOutgoing.DATASET_JSON_SAVE;
  }
  function isMsgHardRefresh(m) {
    return m.type === SWMsgOutgoing.SW_REFRESH_HARD;
  }
  function isMsgGetVersion(m) {
    return m.type === SWMsgOutgoing.SW_GET_VERSIONS;
  }
  function messageEventHandler(event) {
    const message = event.data;
    if (
      isMsgSaveDataJSON(message) &&
      message.type === SWMsgOutgoing.DATASET_JSON_SAVE
    ) {
      // update data object
      const dataP = caches.open(appDataCache).then((cache) => {
        const blob = new Blob([JSON.stringify(message.dataset)], {
          type: "application/json; charset=utf-8",
        });
        const d = new Response(blob);
        return cache.put(message.url, d);
      });
      event.waitUntil(dataP);
      return;
    }
    if (
      isMsgHardRefresh(message) &&
      message.type === SWMsgOutgoing.SW_REFRESH_HARD
    ) {
      fetch(urlDataService + dataVerPath)
        .then((res) => {
          if (res.status < 400) {
            return caches.delete(appStaticCache).then(() => {
              void swSelf.registration.unregister();
              clientMsg(SWMsgOutgoing.SW_REFRESH_HARD, {
                msg: "Hard Refresh",
                status: res.status,
              });
            });
          } else {
            throw new Error("Service Unavailable");
          }
        })
        .catch((error) => {
          clientMsg(SWMsgOutgoing.SW_REFRESH_HARD, {
            msg: "Hard Refresh",
            error,
          });
        });
      return;
    }
    if (
      isMsgGetVersion(message) &&
      message.type === SWMsgOutgoing.SW_GET_VERSIONS
    ) {
      const versions = getVersions();
      clientMsg(SWMsgOutgoing.SW_GET_VERSIONS, versions);
      return;
    }
    clientLogger("Unrecognized message", DebugLevel.ERROR);
  }
  /**
   * User has edited datasets
   * -  do not fetch cache.json
   * -  do not overwrite caches on install
   */
  function isUserEditedData() {
    const fetchCheckP = openIDB({ logger: clientLogger }).then((db) =>
      getIDBItem({ db, store: IDBStores.STATE }, IDBKeys.State.EDITED)
        .then((v) => v.value)
        .catch(() => {
          // doesn't exist
          return false;
        }),
    );
    return fetchCheckP;
  }
  /**
   * User overriding media cached asset
   */
  function pronounceOverride(url) {
    console.log("[ServiceWorker] Overriding Asset in Cache");
    const uid = getParam(url, "uid");
    const cleanUrl = removeParam(url, "uid").replace(override, "");
    const myRequest = new Request(cleanUrl, {
      headers: new Headers({ [SWRequestHeader.NO_CACHE]: "ReFetch" }),
    });
    if (!swSelf.indexedDB) {
      // use cache
      console.log(NO_INDEXEDDB_SUPPORT);
      clientLogger(NO_INDEXEDDB_SUPPORT, DebugLevel.WARN);
      return recache(appMediaCache, myRequest);
    } else {
      // use indexedDB
      clientLogger("IDB.override", DebugLevel.WARN);
      const fetchP = fetch(myRequest);
      const dbOpenPromise = openIDB({ logger: clientLogger });
      const dbResults = dbOpenPromise.then((db) => {
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
      const dbOpenPromise = openIDB({ logger: clientLogger });
      const dbResults = dbOpenPromise.then((db) => {
        return getIDBItem({ db, store: IDBStores.MEDIA }, uid)
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
  function noCaching(request) {
    // for debugging purposes
    return fetch(request);
  }
  function fetchEventHandler(e) {
    if (e.request.method !== "GET") {
      return;
    }
    const req = e.request.clone();
    const url = e.request.url;
    const protocol = "https://";
    const path = url.slice(url.indexOf("/", protocol.length + 1));
    switch (true) {
      case /* explicit no cache */ req.headers.has(SWRequestHeader.NO_CACHE): {
        // remove header
        let h = {};
        req.headers.forEach((val, key) => {
          if (key !== SWRequestHeader.NO_CACHE.toLowerCase()) {
            h[key] = val;
          }
        });
        const noCacheReq = new Request(req.url, { headers: new Headers(h) });
        e.respondWith(noCaching(noCacheReq));
        break;
      }
      case /* cache.json */ path.startsWith(dataPath + dataVerPath):
        e.respondWith(appVersionReq(urlDataService + dataVerPath));
        break;
      case /* github user cache.json */ path.endsWith(dataVerPath): {
        const verP = caches
          .open(appDataCache)
          .then((cache) => cache.match(url));
        e.respondWith(verP);
        break;
      }
      case /* github user data */ url.includes("githubusercontent") &&
        req.headers.has(SWRequestHeader.DATA_VERSION): {
        const version = e.request.headers.get(SWRequestHeader.DATA_VERSION);
        const cacheP = caches
          .open(appDataCache)
          .then((cache) => cache.match(url + ".v" + version));
        e.respondWith(cacheP);
        break;
      }
      case /* data */ req.headers.has(SWRequestHeader.DATA_VERSION): {
        const version = e.request.headers.get(SWRequestHeader.DATA_VERSION);
        e.respondWith(appDataReq(url, version));
        break;
      }
      case /* UI asset */ url.startsWith(urlAppUI) &&
        !url.endsWith(".hot-update.json"):
        e.respondWith(appAssetReq(url));
        break;
      case /* pronounce override */ path.startsWith(audioPath + override):
        e.respondWith(pronounceOverride(url));
        break;
      case /* pronounce */ path.startsWith(audioPath):
        e.respondWith(pronounce(url));
        break;
      default:
        /* everything else */
        e.respondWith(noCaching(e.request));
        break;
    }
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
   * respond with cache match always fetch and re-cache
   * may return stale version
   * @returns a Promise with a cache response
   */
  function appVersionReq(url) {
    const fetchCheckP = isUserEditedData();
    return fetchCheckP.then((cacheOnly) => {
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
      if (cacheOnly) {
        // don't fetch when user in-app
        // has edited datasets
        return c;
      }
      // fetch new versions
      const f = fetch(url).then((res) => {
        const resClone = res.clone();
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        // update cache from new
        void caches
          .open(appDataCache)
          .then((cache) => cache.put(url, resClone));
        return res;
      });
      // return whaterver is fastest
      return Promise.any([f, c]).catch((errs) =>
        Promise.reject(errs[0].message),
      );
    });
  }
  /**
   * get from cache on fail fetch and re-cache
   * first match may be stale
   * @returns a Promise with a cached dataVersion response
   */
  function appVersionCacheOnFailFetch(authority) {
    return caches.open(appDataCache).then((cache) =>
      cache.match(authority + dataPath + dataVerPath).then((cacheRes) => {
        if (cacheRes) {
          return Promise.resolve(cacheRes);
        } else {
          return recache(appDataCache, authority + dataPath + dataVerPath);
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
   * Only used if no IndexedDB support
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
  "192.124611a9.css",
  "192.124611a9.js",
  "23.76f9155b.js",
  "230.392d51c9.js",
  "232.eb650563.css",
  "232.eb650563.js",
  "331225628f00d1a9fb35.jpeg",
  "352.b3c756ee.js",
  "4156f5574d12ea2e130b.png",
  "463.c457155e.css",
  "463.c457155e.js",
  "568.ba17d67f.js",
  "657.dee830c3.js",
  "71565d048a3f03f60ac5.png",
  "802.036eb0ab.css",
  "802.036eb0ab.js",
  "832.7d9e08e1.css",
  "832.7d9e08e1.js",
  "856.f9bd9358.js",
  "927.bfc4db9c.js",
  "dc7b0140cb7644f73ef2.png",
  "ee636d032d073f55d622.png",
  "favicon.ico",
  "icon192.png",
  "icon512.png",
  "index.html",
  "main.964b9373.css",
  "main.964b9373.js",
  "manifest.webmanifest",
  "maskable512.png",
];

initServiceWorker({ ...buildConstants, getParam, removeParam, cacheFiles });
