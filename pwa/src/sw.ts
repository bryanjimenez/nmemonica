import {
  SWMsgOutgoing,
  SWMsgIncoming,
  SWRequestHeader,
} from "../../src/helper/serviceWorkerHelper";
import {
  IDBStores,
  IDBKeys,
  openIDB,
  addIDBItem,
  getIDBItem,
  putIDBItem,
} from "../helper/idbHelper";
import { DebugLevel } from "../../src/slices/settingHelper";
import { getParam, removeParam } from "../../src/helper/urlHelper";
import {
  audioServicePath,
  dataServiceEndpoint,
  dataServicePath,
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
let urlDataService = dataServiceEndpoint;
let urlPronounceService = pronounceEndoint;
let audioPath = audioServicePath;
let dataPath = dataServicePath;

const swSelf = globalThis.self as unknown as ServiceWorkerGlobalScope;

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

function getVersions() {
  // const main =
  //   cacheFiles.find((f) => f.match(new RegExp(/main.([a-z0-9]+).js/))) ||
  //   "main.00000000.js";
  // const [_jsName, jsVersion] = main.split(".");
  return { swVersion, jsVersion, bundleVersion };
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

    return fetch(`${pushUrl}/${name}.json`, { credentials: "include" }).then(
      (fetchRes) =>
        cache
          .match(pushUrl + dataVerPath)
          .then((verRes) => {
            if (!verRes) {
              throw new Error("Missing cache.json");
            }
            return verRes.json();
          })
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
    const confirmationP = swSelf.registration.showNotification(message.title, {
      body: message.body.msg,
      icon: "",
      tag: message.tag,
    });

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
function cacheAllDataResource(baseUrl: string) {
  return caches
    .open(appDataCache)
    .then((cache) =>
      cache.add(baseUrl + dataVerPath).then(() =>
        Promise.all(
          dataSourcePath.map((path) => {
            const url = baseUrl + path;
            return getVersionForData(new Request(url)).then((v) =>
              cacheVerData(new Request(url), v)
            );
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
        const dataCacheP = isUserEditedData().then((isEdited) => {
          if (!isEdited) {
            return cacheAllDataResource(urlDataService);
          }
          return;
        });
        const rootCacheP = cacheAllRoot();
        const staticAssetCacheP = cacheAllStaticAssets();

        return Promise.all([dataCacheP, rootCacheP, staticAssetCacheP]);
      })
  );
}

interface MsgSaveDataJSON {
  type: string;
  url: string;
  dataset: Record<string, unknown>;
  hash: string;
}

interface MsgHardRefresh {
  type: string;
}

interface MsgGetVersion {
  type: string;
}

type AppSWMessage = MsgHardRefresh | MsgGetVersion;

function isMsgSaveDataJSON(m: AppSWMessage): m is MsgSaveDataJSON {
  return (m as MsgSaveDataJSON).type === SWMsgOutgoing.DATASET_JSON_SAVE;
}

function isMsgHardRefresh(m: AppSWMessage): m is MsgHardRefresh {
  return (m as MsgHardRefresh).type === SWMsgOutgoing.SW_REFRESH_HARD;
}

function isMsgGetVersion(m: AppSWMessage): m is MsgGetVersion {
  return (m as MsgGetVersion).type === SWMsgOutgoing.SW_GET_VERSIONS;
}

function messageEventHandler(event: ExtendableMessageEvent) {
  const message = event.data as AppSWMessage;

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
    fetch(urlDataService + dataVerPath /** no credentials (net check) */)
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
      })
  );

  return fetchCheckP;
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
  const word = decodeURI(getParam(req.url, "q"));

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
          clientLogger("IDB.get [] " + word, DebugLevel.WARN);

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
    case /* cache.json */
    path.startsWith(dataPath + dataVerPath): {
      if (req.headers.get("Cache-Control") === "no-store") {
        // mTLS handshake in progress
        e.respondWith(noCaching(req));
      }

      e.respondWith(appVersionReq(urlDataService + dataVerPath));
      break;
    }

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

    case /* data */
    req.headers.has(SWRequestHeader.DATA_VERSION): {
      const version = req.headers.get(SWRequestHeader.DATA_VERSION);
      const modReq = !url.startsWith(urlDataService) ? req : new Request(url);

      e.respondWith(appDataReq(modReq, version));
      break;
    }

    case /* UI asset */
    url.startsWith(urlAppUI) && !url.endsWith(".hot-update.json"):
      e.respondWith(appAssetReq(url));
      break;

    case /* pronounce */
    path.startsWith(audioPath): {
      const uid = getParam(url, "uid");
      const cleanUrl = removeParam(url, "uid");
      const modRed = req.url.startsWith(urlDataService)
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
 * respond with cache match always fetch and re-cache
 * may return stale version
 * @returns a Promise with a cache response
 */
function appVersionReq(url: string) {
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
      void caches.open(appDataCache).then((cache) => cache.put(url, resClone));

      return res;
    });

    // return whaterver is fastest
    return Promise.any([f, c]).catch((errs: Error[]) =>
      Promise.reject(errs[0].message)
    );
  });
}

/**
 * When request contains Data-Version != 0 the version is used otherwise
 * the version is searched in the cache
 * @returns a Promise that yieds a cached response
 */
function appDataReq(req: Request, version: string | null) {
  let response: Promise<Response>;
  if (!version || version === "0") {
    response = getVersionForData(req).then((v) => cacheVerData(req, v));
  } else {
    response = cacheVerData(req, version);
  }

  return response;
}

/**
 * @returns a Promise that yields the version on the cache for the provided request
 */
function getVersionForData(req: Request) {
  const url = req.url;
  const authority = url.slice(0, url.indexOf("/", "https://".length));
  const filename = url.split("/").pop() || url;
  const [dName] = filename.split(".json");

  /**
   * get from cache on fail fetch and re-cache
   * first match may be stale
   * returns a Promise with a cached dataVersion response
   */
  return caches
    .open(appDataCache)
    .then((cache) =>
      cache.match(authority + dataPath + dataVerPath).then((cacheRes) => {
        if (cacheRes) {
          return Promise.resolve(cacheRes);
        } else {
          return recache(
            appDataCache,
            new Request(authority + dataPath + dataVerPath, {
              credentials: "include",
            })
          );
        }
      })
    )
    .then((res) => res && res.json())
    .then((versions: { [k: string]: string }) => versions[dName]);
}

/**
 * when cache match fails fetch and re-cache (only good response)
 * @returns a Promise that yieds a cached response
 */
function cacheVerData(req: Request, v: string) {
  const urlVersion = req.url + ".v" + v;

  return caches.open(appDataCache).then((cache) =>
    cache.match(urlVersion).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(req).then((fetchRes) => {
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
