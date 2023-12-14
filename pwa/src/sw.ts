import {
  SWMsgOutgoing as SWMsgOutgoingType,
  SWMsgIncoming as SWMsgIncomingType,
  type AppEndpoints,
} from "../../src/helper/serviceWorkerHelper";
import { DebugLevel as DebugLevelType } from "../../src/slices/settingHelper";
import { SwFnParams } from "../script/swBuilder";

// only for typescript typing
// will not be included in sw.js code from here
// needs to be injected by swBuilder
let SWMsgOutgoing: typeof SWMsgOutgoingType;
let SWMsgIncoming: typeof SWMsgIncomingType;
let DebugLevel: typeof DebugLevelType;

interface CacheDataObj {
  uid: string;
  blob: Blob;
}

/**
 * Service worker
 *
 * Code within the function will be bundled in sw.js
 * Code outside needs to be injected by swBuilder
 * @param param0
 */
export function initServiceWorker({
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
}: SwFnParams) {
  const swSelf = globalThis.self as unknown as ServiceWorkerGlobalScope;

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
   * @param pushUrl
   * @param name of data set
   * @param hash
   */
  function updateFromLocalService(pushUrl: string, name: string, hash: string) {
    return caches.open(appDataCache).then((cache) => {
      const url = `${pushUrl}/${name}.json.v${hash}`;
      // TODO: what if ip changed?
      // if (url_ServiceData !== pushUrl) {
      clientLogger(
        // "Push service url does not match service worker",
        "Validate override url matches push url",
        DebugLevel.ERROR
      );
      // if they don't match user_DataServiceUrl will be overwritten with serviceUrl's data
      // return;
      // }

      return fetch(`${pushUrl}/${name}.json`).then((fetchRes) =>
        cache
          .match(pushUrl + dataVerPath)
          .then((verRes) => verRes.json())
          .then((verJson: { [k: string]: string }) => {
            verJson[name] = hash;
            return verJson;
          })
          .then((newVerJson) => {
            return Promise.all([
              // update version object
              updateCacheWithJSON(
                appDataCache,
                pushUrl + dataVerPath,
                newVerJson
              ),
              // update data object
              cache.put(url, fetchRes.clone()),
            ]);
          })
      );
    });
  }

  interface PushConfirmation {
    title: string;
    tag: string;
    body: { type: string; msg: string };
  }
  interface PushDataUpdate {
    title: string;
    tag: string;
    body: {
      type: string;
      name: string;
      hash: string;
      url: string;
    };
  }

  type PushMessage = PushConfirmation | PushDataUpdate;

  function isPushConfirmation(m: PushMessage): m is PushConfirmation {
    return (m as PushConfirmation).body.type === "push-subscription";
  }

  function isPushDataUpdate(m: PushMessage): m is PushDataUpdate {
    return (m as PushDataUpdate).body.type === "push-data-update";
  }

  function pushEventHandler(e: PushEvent) {
    const message = e.data?.json() as PushMessage;
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
        }
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
            })
          )
        )
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

  function installEventHandler(_e: ExtendableEvent) {
    void swSelf.skipWaiting();

    const versions = getVersions();
    clientMsg("SW_VERSION", versions);
  }

  function activateEventHandler(e: ExtendableEvent) {
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
          const dataCacheP = cacheAllDataResource(urlDataService);
          const rootCacheP = cacheAllRoot();
          const staticAssetCacheP = cacheAllStaticAssets();

          return Promise.all([dataCacheP, rootCacheP, staticAssetCacheP]);
        })
        .then(() => {
          // Notify app service worker is ready
          clientMsg(SWMsgIncoming.POST_INSTALL_ACTIVATE_DONE, {});
        })
    );
  }

  interface MessageRecacheData {
    type: string;
    endpoints: AppEndpoints;
  }

  interface MessageHardRefresh {
    type: string;
  }

  interface MessageGetVersion {
    type: string;
  }

  type AppSWMessage = MessageHardRefresh | MessageGetVersion;

  function isMessageRecacheData(m: AppSWMessage): m is MessageRecacheData {
    return (m as MessageRecacheData).type === SWMsgOutgoing.RECACHE_DATA;
  }

  function isMessageHardRefresh(m: AppSWMessage): m is MessageHardRefresh {
    return (m as MessageHardRefresh).type === SWMsgOutgoing.DO_HARD_REFRESH;
  }

  function isMessageGetVersion(m: AppSWMessage): m is MessageGetVersion {
    return (m as MessageGetVersion).type === SWMsgOutgoing.SW_VERSION;
  }

  function messageEventHandler(event: ExtendableMessageEvent) {
    const message = event.data as AppSWMessage;

    if (
      isMessageRecacheData(message) &&
      message.type === SWMsgOutgoing.RECACHE_DATA
    ) {
      const dataCacheP = fetch(message.endpoints.data + dataVerPath)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Local Service Unavailable");
          }
        })
        .then(() =>
          cacheAllDataResource(message.endpoints.data ?? urlDataService)
        );

      event.waitUntil(dataCacheP);
      return;
    }

    if (
      isMessageHardRefresh(message) &&
      message.type === SWMsgOutgoing.DO_HARD_REFRESH
    ) {
      fetch(urlDataService + dataVerPath)
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
        .catch((error: Error) => {
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
  function pronounceOverride(url: string) {
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

      const dbResults = dbOpenPromise.then((db: IDBDatabase) => {
        void countIDBItem(db);

        return fetchP
          .then((res) => {
            if (!res.ok) {
              clientLogger("fetch", DebugLevel.ERROR);
              throw new Error(
                "Network response was not OK" +
                  (res.status ? " (" + res.status + ")" : "")
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
              }
            ).then((dataO) => toResponse(dataO))
          );
      });

      return dbResults;
    }
  }

  /**
   * Site media asset
   */
  function pronounce(url: string) {
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

      const dbResults = dbOpenPromise.then((db: IDBDatabase) => {
        return getIDBItem({ db }, uid)
          .then((dataO) =>
            //found
            toResponse(dataO)
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
                      (res.status ? " (" + res.status + ")" : "")
                  );
                }
                return res.blob();
              })
              .then((blob) =>
                addIDBItem({ db }, { uid, blob }).then((dataO) =>
                  toResponse(dataO)
                )
              );
          });
      });
      return dbResults;
    }
  }

  function noCaching(request: Request) {
    // for debugging purposes
    return fetch(request);
  }

  function fetchEventHandler(e: FetchEvent) {
    if (e.request.method !== "GET") {
      return;
    }

    const req = e.request.clone();
    const url = e.request.url;
    const protocol = "https://";
    const path = url.slice(url.indexOf("/", protocol.length + 1));

    switch (true) {
      case /* explicit no cache */
      req.headers.has("X-No-Cache"): {
        // remove header
        let h = {};
        req.headers.forEach((val, key) => {
          if (key !== "x-no-cache") {
            h[key] = val;
          }
        });
        const noCacheReq = new Request(req.url, { headers: new Headers(h) });
        e.respondWith(noCaching(noCacheReq));
        break;
      }

      case /* cache.json */
      path.startsWith(dataPath + dataVerPath):
        e.respondWith(appVersionReq(urlDataService + dataVerPath));
        break;

      case /* data */
      req.headers.has(dataVersionHeader):
        {
          const ver = e.request.headers.get(dataVersionHeader);
          e.respondWith(appDataReq(url, ver));
        }
        break;

      case /* UI asset */
      url.startsWith(urlAppUI) && !url.endsWith(".hot-update.json"):
        e.respondWith(appAssetReq(url));
        break;

      case /* pronounce override */
      path.startsWith(audioPath + override):
        e.respondWith(pronounceOverride(url));
        break;

      case /* pronounce */
      path.startsWith(audioPath):
        e.respondWith(pronounce(url));
        break;

      default:
        /* everything else */
        e.respondWith(noCaching(e.request));
        break;
    }
  }

  /**
   * Creates a request from url
   *
   * Adds authentication in development env
   */
  function toRequest(url: string) {
    const myInit = {
      method: "GET",
    };

    return new Request(url, myInit);
  }

  /**
   * Retrieved cache object to Response
   */
  function toResponse(obj: { uid: string; blob: Blob }) {
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
    version: number = indexedDBVersion,
    objStoreToCreate: string = indexedDBStore,
    objStoreToDelete?: string
  ) {
    let openRequest = indexedDB.open(appMediaCache, version);

    const dbUpgradeP: Promise<{ type: string; val: IDBDatabase }> = new Promise(
      (resolve /*reject*/) => {
        openRequest.onupgradeneeded = function (event) {
          if (event.target === null) throw new Error("onupgradeneeded failed");
          // Save the IDBDatabase interface
          const db = (event.target as IDBRequest<IDBDatabase>).result;

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
      }
    );

    const dbOpenP: Promise<{ type: string; val: IDBDatabase }> = new Promise(
      (resolve, reject) => {
        openRequest.onerror = function (/*event*/) {
          clientLogger("IDB.open X(", DebugLevel.ERROR);
          reject();
        };
        openRequest.onsuccess = function (event) {
          if (event.target === null) throw new Error("openIDB failed");

          const db = (event.target as IDBRequest<IDBDatabase>).result;

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
      }
    );

    return Promise.any([dbUpgradeP, dbOpenP]).then(
      (pArr: { type: string; val: IDBDatabase }) => {
        // if upgradeP happens wait for dbOpenP
        if (pArr.type === "upgrade") {
          return dbOpenP.then((db) => db.val);
        }

        return pArr.val;
      }
    );
  }

  /**
   * Post message to client
   */
  function clientMsg(type: string, msg: { [key: string]: unknown }) {
    void swSelf.clients
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

  /**
   * Log to client
   */
  function clientLogger(msg: string, lvl: number) {
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
  function countIDBItem(db: IDBDatabase, store = indexedDBStore) {
    const transaction = db.transaction([store]);
    const request = transaction.objectStore(store).count();

    const requestP: Promise<number> = new Promise((resolve, reject) => {
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
  function getIDBItem(
    { db, store = indexedDBStore }: { db: IDBDatabase; store?: string },
    key: string
  ) {
    const transaction = db.transaction([store]);
    const request = transaction
      .objectStore(store)
      .get(key) as IDBRequest<CacheDataObj>;

    const requestP: Promise<CacheDataObj> = new Promise((resolve, reject) => {
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
  function addIDBItem(
    { db, store = indexedDBStore }: { db: IDBDatabase; store?: string },
    value: CacheDataObj
  ) {
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

    const transactionP: Promise<typeof value> = new Promise(
      (resolve, reject) => {
        transaction.oncomplete = function () {
          resolve(value);
        };
        transaction.onerror = function () {
          reject();
        };
      }
    );

    return Promise.all([requestP, transactionP]).then((arrP) => arrP[1]);
  }

  /**
   * objectStore.put(value)
   */
  function putIDBItem(
    { db, store = indexedDBStore }: { db: IDBDatabase; store?: string },
    value: CacheDataObj
  ) {
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

    const transactionP: Promise<typeof value> = new Promise(
      (resolve, reject) => {
        transaction.oncomplete = function () {
          resolve(value);
        };
        transaction.onerror = function () {
          reject();
        };
      }
    );

    return Promise.all([requestP, transactionP]).then((arrP) => arrP[1]);
  }

  /**
   * respond with cache match always fetch and re-cache
   * may return stale version
   * @returns a Promise with a cache response
   */
  function appVersionReq(url: string) {
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
    return Promise.any([f, c]).catch((errs: Error[]) =>
      Promise.reject(errs[0].message)
    );
  }

  /**
   * get from cache on fail fetch and re-cache
   * first match may be stale
   * @returns a Promise with a cached dataVersion response
   */
  function appVersionCacheOnFailFetch(authority: string) {
    return caches.open(appDataCache).then((cache) =>
      cache.match(authority + dataPath + dataVerPath).then((cacheRes) => {
        if (cacheRes) {
          return Promise.resolve(cacheRes);
        } else {
          return recache(appDataCache, authority + dataPath + dataVerPath);
        }
      })
    );
  }

  /**
   * When request contains Data-Version != 0 the version is used otherwise
   * the version is searched in the cache
   * @returns a Promise that yieds a cached response
   */
  function appDataReq(url: string, version: string | null) {
    let response: Promise<Response>;
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
  function getVersionForData(url: string) {
    const authority = url.slice(0, url.indexOf("/", "https://".length));
    const filename = url.split("/").pop() || url;
    const [dName] = filename.split(".json");

    return appVersionCacheOnFailFetch(authority)
      .then((res) => res && res.json())
      .then((versions: { [k: string]: string }) => versions[dName]);
  }

  /**
   * when cache match fails fetch and re-cache (only good response)
   * @returns a Promise that yieds a cached response
   */
  function cacheVerData(url: string, v: string) {
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
      })
    );
  }

  /**
   * cache match first otherwise fetch then cache
   * @returns a Promise that yieds a cached response
   */
  function appAssetReq(url: string) {
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
  function appMediaReq(url: string) {
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
  function recache(cacheName: string, url: string | Request) {
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
        cacheNames.reduce<Promise<boolean>[]>((acc, cacheName) => {
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
          requests.reduce<Promise<boolean>[]>((acc, req) => {
            const name = req.url.split("/").pop();
            // files not having . should not have hashes so will be overwritten
            // by caches.add upon install
            if (name && name.indexOf(".") > -1 && !cacheFiles.includes(name)) {
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
   * @returns a promise with the cached jsonObj
   */
  function updateCacheWithJSON(
    cacheName: string,
    url: string,
    jsonObj: { [k: string]: unknown },
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
}
