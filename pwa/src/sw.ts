import {
  SWMsgOutgoing,
  SWMsgIncoming,
  SWRequestHeader,
} from "../../src/helper/serviceWorkerHelper";
import {
  IDBStores,
  openIDB,
  addIDBItem,
  getIDBItem,
  putIDBItem,
} from "../helper/idbHelper";
import { DebugLevel } from "../../src/slices/settingHelper";
import { getParam, removeParam } from "../../src/helper/urlHelper";
import {
  audioServicePath,
  pronounceEndoint,
  uiEndpoint,
} from "../../environment.development";

/**
 * FIXME: workaround to prevent ReferenceError: process is not defined (in dev)
 * @see [serviceWorkerCacheHelperPlugin](../plugin/swPlugin.js)
 */
const process = {
  env: {
    SW_CACHE_FILES: [],
    SW_VERSION: "",
    SW_MAIN_VERSION: "",
    SW_BUNDLE_VERSION: "",
  },
};

const cacheFiles: string[] = process.env.SW_CACHE_FILES;
const swVersion = process.env.SW_VERSION;
const jsVersion = process.env.SW_MAIN_VERSION;
const bundleVersion = process.env.SW_BUNDLE_VERSION;

let urlAppUI = uiEndpoint;
let urlPronounceService = pronounceEndoint;
let audioPath = audioServicePath;

const swSelf = globalThis.self as unknown as ServiceWorkerGlobalScope;

swSelf.addEventListener("install", installEventHandler);
swSelf.addEventListener("activate", activateEventHandler);
swSelf.addEventListener("fetch", fetchEventHandler);
swSelf.addEventListener("message", messageEventHandler);

const appStaticCache = "nmemonica-static";
const appDataCache = "nmemonica-data";
const appMediaCache = "nmemonica-media";

const NO_INDEXEDDB_SUPPORT =
  "Your browser doesn't support a stable version of IndexedDB.";

/**
 * Calculate app source versions
 */
function getAppVersion() {
  return { swVersion, jsVersion, bundleVersion };
}

/**
 * Cache all data resources
 */
// function cacheAllDataResource(baseUrl: string) {
//   return caches
//     .open(appDataCache)
//     .then((cache) =>
//       cache.add(baseUrl + dataVerPath).then(() =>
//         Promise.all(
//           dataSourcePath.map((path) => {
//             const url = baseUrl + path;
//             return getVersionForData(new Request(url)).then((v) =>
//               cacheVerData(new Request(url), v)
//             );
//           })
//         )
//       )
//     )
//     .catch(() => {
//       console.log("[ServiceWorker] Data Prefech failed for some item");
//     });
// }
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

  const versions = getAppVersion();
  clientMsg(SWMsgOutgoing.SW_GET_VERSIONS, versions);
}

function activateEventHandler(e: ExtendableEvent) {
  if ("clients" in swSelf) {
    // WORKAROUND check for ServiceWorkerCachePlugin
    // in dev prevent clients is undefined
    void swSelf.clients
      .matchAll({ includeUncontrolled: true })
      .then(function (clientList) {
        const urls = clientList.map(function (client) {
          return client.url;
        });
        console.log("[ServiceWorker] Matching clients:", urls.join(", "));
        clientLogger("Matching clients:" + urls.join(", "), DebugLevel.DEBUG);
      });
  }

  e.waitUntil(
    Promise.all([removeUnknowCaches(), removeOldStaticCaches()])

      // claim the client
      .then(function () {
        console.log("[ServiceWorker] Claiming clients");
        clientLogger("Claiming clients", DebugLevel.DEBUG);
        return swSelf.clients.claim();
      })
      .then(() => {
        const rootCacheP = cacheAllRoot();
        const staticAssetCacheP = cacheAllStaticAssets();

        return Promise.all([rootCacheP, staticAssetCacheP]);
      })
  );
}

interface MsgHardRefresh {
  type: string;
}

interface MsgGetVersion {
  type: string;
}

type AppSWMessage = MsgHardRefresh | MsgGetVersion;

function isMsgHardRefresh(m: AppSWMessage): m is MsgHardRefresh {
  return (m as MsgHardRefresh).type === SWMsgOutgoing.SW_REFRESH_HARD;
}

function isMsgGetVersion(m: AppSWMessage): m is MsgGetVersion {
  return (m as MsgGetVersion).type === SWMsgOutgoing.SW_GET_VERSIONS;
}

function messageEventHandler(event: ExtendableMessageEvent) {
  const message = event.data as AppSWMessage;

  if (
    isMsgHardRefresh(message) &&
    message.type === SWMsgOutgoing.SW_REFRESH_HARD
  ) {
    fetch(urlAppUI + "/robots.txt" /** no credentials (net check) */)
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
      .catch((error: Error) => {
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
    const versions = getAppVersion();
    clientMsg(SWMsgOutgoing.SW_GET_VERSIONS, versions);
    return;
  }

  clientLogger("Unrecognized message", DebugLevel.ERROR);
}

/**
 * User overriding media cached asset
 */
function pronounceOverride(uid: string, req: Request) {
  console.log("[ServiceWorker] Overriding Asset in Cache");

  if (!swSelf.indexedDB) {
    // use cache
    console.log(NO_INDEXEDDB_SUPPORT);
    clientLogger(NO_INDEXEDDB_SUPPORT, DebugLevel.WARN);
    return recache(appMediaCache, req);
  } else {
    // use indexedDB
    clientLogger("IDB.override", DebugLevel.WARN);

    const fetchP = fetch(req);
    const dbOpenPromise = openIDB({ logger: clientLogger });

    const dbResults = dbOpenPromise.then((db: IDBDatabase) => {
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
function pronounce(uid: string, req: Request) {
  if (!swSelf.indexedDB) {
    // use cache
    console.log(NO_INDEXEDDB_SUPPORT);
    clientLogger(NO_INDEXEDDB_SUPPORT, DebugLevel.WARN);
    return appMediaReq(req.url);
  } else {
    // use indexedDB
    const dbOpenPromise = openIDB({ logger: clientLogger });

    const dbResults = dbOpenPromise.then((db: IDBDatabase) => {
      return getIDBItem({ db, store: IDBStores.MEDIA }, uid)
        .then((dataO) =>
          //found
          toResponse(dataO)
        )
        .catch(() => {
          //not found
          clientLogger("IDB.get [] ", DebugLevel.WARN);

          return fetch(req)
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
  if (e.request.method === "OPTIONS") {
    // forward mTLS handshake request
    e.respondWith(noCaching(e.request));
    return;
  }

  if (e.request.method !== "GET") {
    return;
  }

  const req = e.request.clone();
  const url = e.request.url;
  const protocol = "https://";
  const path = url.slice(url.indexOf("/", protocol.length + 1));

  switch (true) {
    case /* github user data */
    url.includes("githubusercontent") &&
      req.headers.has(SWRequestHeader.DATA_VERSION): {
      const version = e.request.headers.get(SWRequestHeader.DATA_VERSION);

      const cacheP = caches
        .open(appDataCache)
        .then((cache) => cache.match(url + ".v" + version))
        .then((v) => {
          if (v === undefined) {
            throw new Error(`Missing ${url + ".v" + version}`);
          }
          return v;
        });
      e.respondWith(cacheP);
      break;
    }

    // case /* data */
    // req.headers.has(SWRequestHeader.DATA_VERSION): {
    //   const version = req.headers.get(SWRequestHeader.DATA_VERSION);
    //   e.respondWith(appDataReq(req, version));
    //   break;
    // }

    case /* UI asset */
    url.startsWith(urlAppUI) && !url.endsWith(".hot-update.json"):
      e.respondWith(appAssetReq(url));
      break;

    case /* pronounce */
    path.startsWith(audioPath): {
      const uid = getParam(url, "uid");
      if (!uid) {
        throw new Error("Request missing uid");
      }
      const cleanUrl = removeParam(url, "uid");
      const modRed = req.url.startsWith(urlPronounceService)
        ? new Request(cleanUrl) //  remove everything for external
        : req; //                   keep auth for local service

      if (req.headers.get("Cache-Control") === "reload") {
        e.respondWith(pronounceOverride(uid, modRed));
      }

      e.respondWith(pronounce(uid, modRed));
      break;
    }

    default:
      /* everything else */
      e.respondWith(noCaching(e.request));
      break;
  }
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
 * Post message to client
 */
function clientMsg(
  type: keyof typeof SWMsgOutgoing,
  msg: Record<string, unknown>
) {
  if ("clients" in swSelf) {
    // WORKAROUND check for ServiceWorkerCachePlugin
    // in dev prevent clients is undefined
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
}

/**
 * Log to client
 */
function clientLogger(msg: string, lvl: number) {
  if ("clients" in swSelf) {
    // WORKAROUND check for ServiceWorkerCachePlugin
    // in dev prevent clients is undefined
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
      return cachedRes || recache(appStaticCache, new Request(url));
    });
}

/**
 * Only used if no IndexedDB support
 * cache match first otherwise fetch then cache
 * @returns a Promise that yieds a cached response
 */
function appMediaReq(url: string) {
  return caches
    .open(appMediaCache)
    .then((cache) => cache.match(url))
    .then((cachedRes) => {
      return cachedRes || recache(appMediaCache, new Request(url));
    });
}

/**
 * @returns a Promise that yields a response from the cache or a rejected Promise
 */
function recache(cacheName: string, req: Request) {
  return caches.open(cacheName).then((cache) =>
    fetch(req)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Could not fetch");
        }

        return cache.put(req.url, res);
      })
      .then(() => cache.match(req.url))
      .then((urlRes) => {
        if (!urlRes) {
          throw new Error("Could not recache");
        }
        return urlRes;
      })
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
