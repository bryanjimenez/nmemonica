import { uiEndpoint } from "../../environment.development";
import { SWMsgOutgoing } from "../../src/helper/serviceWorkerHelper";
import { DebugLevel } from "../../src/helper/consoleHelper";

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

const swSelf = globalThis.self as unknown as ServiceWorkerGlobalScope;

swSelf.addEventListener("install", installEventHandler);
swSelf.addEventListener("activate", activateEventHandler);
swSelf.addEventListener("fetch", fetchEventHandler);
swSelf.addEventListener("message", messageEventHandler);

const appStaticCache = "nmemonica-static";
const appDataCache = "nmemonica-data";
const appMediaCache = "nmemonica-media";

/**
 * Calculate app source versions
 */
function getAppVersion() {
  return { swVersion, jsVersion, bundleVersion };
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

  const url = e.request.url;

  switch (true) {
    case /* UI asset */
    url.startsWith(urlAppUI) && !url.endsWith(".hot-update.json"):
      e.respondWith(appAssetReq(url));
      break;

    default:
      /* everything else */
      e.respondWith(noCaching(e.request));
      break;
  }
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
            type: "SW",
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
        const err = new Error("[ServiceWorker] Network unavailable");
        console.log(err.message);
        return Promise.reject(err);
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
