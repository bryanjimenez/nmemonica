interface SwFnParams {
  swVersion: string;
  initCacheVer: string;
  cacheFiles: string[];
  ghURL: string;
  fbURL: string;
  gCloudFnPronounce: string;
  SERVICE_WORKER_LOGGER_MSG: string;
  SERVICE_WORKER_NEW_TERMS_ADDED: string;

  getParam: Function;
  removeParam: Function;
}

interface CacheDataObj {
  uid: string;
  blob: Blob;
}

export function initServiceWorker({
  swVersion,
  initCacheVer,
  cacheFiles,
  ghURL,
  fbURL,
  gCloudFnPronounce,
  SERVICE_WORKER_LOGGER_MSG,
  SERVICE_WORKER_NEW_TERMS_ADDED,

  getParam,
  removeParam,
}: SwFnParams) {
  //@ts-expect-error FIXME: ServiceWorkerGlobalScope
  const swSelf = globalThis.self as ServiceWorkerGlobalScope;

  const appStaticCache = "nmemonica-static";
  const appDataCache = "nmemonica-data";
  const appMediaCache = "nmemonica-media";
  const indexedDBVersion = 2;
  const indexedDBStore = "media";
  const NO_INDEXEDDB_SUPPORT =
    "Your browser doesn't support a stable version of IndexedDB.";

  const dataVerURL = fbURL + "/cache.json";
  const dataURL = [
    fbURL + "/phrases.json",
    fbURL + "/vocabulary.json",
    fbURL + "/opposites.json",
    fbURL + "/kanji.json",
  ];

  let ERROR = 1,
    WARN = 2,
    DEBUG = 3;

  function getVersions() {
    const main =
      cacheFiles.find((f) => f.match(new RegExp(/main.([a-z0-9]+).js/))) ||
      "main.00000000.js";
    const [_jsName, jsVersion] = main.split(".");
    return { swVersion, jsVersion, bundleVersion: initCacheVer };
  }

  swSelf.addEventListener("install", (e) => {
    swSelf.skipWaiting();

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

    const a = ghURL;
    const b = ghURL + "/";
    caches
      .open(appStaticCache)
      .then((cache) => cache.addAll([a, b]))
      .catch((e) => {
        console.log("Prefectch failed for some item");
        console.log(JSON.stringify(e));
      });

    e.waitUntil(
      caches.open(appStaticCache).then((cache) => cache.addAll([...cacheFiles]))
    );
  });

  swSelf.addEventListener("activate", (e) => {
    swSelf.clients
      .matchAll({ includeUncontrolled: true })
      .then(function (clientList) {
        const urls = clientList.map(function (client) {
          return client.url;
        });
        console.log("[ServiceWorker] Matching clients:", urls.join(", "));
        clientLogger("Matching clients:" + urls.join(", "), DEBUG);
      });

    e.waitUntil(
      Promise.all([removeUnknowCaches(), removeOldStaticCaches()])

        // claim the client
        .then(function () {
          console.log("[ServiceWorker] Claiming clients");
          clientLogger("Claiming clients", DEBUG);
          return swSelf.clients.claim();
        })
    );
  });

  swSelf.addEventListener("message", (event) => {
    if (event.data && event.data.type === "DO_HARD_REFRESH") {
      fetch(dataVerURL)
        .then((res) => {
          if (res.status < 400) {
            return caches.delete(appStaticCache).then(() => {
              swSelf.registration.unregister();
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

  swSelf.addEventListener("fetch", (e) => {
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
      const myRequest = toRequest(cleanUrl);

      if (!swSelf.indexedDB) {
        // use cache
        console.log(NO_INDEXEDDB_SUPPORT);
        clientLogger(NO_INDEXEDDB_SUPPORT, WARN);
        e.respondWith(recache(appMediaCache, myRequest));
      } else {
        // use indexedDB
        clientLogger("IDB.override", WARN);

        const fetchP = fetch(myRequest);
        const dbOpenPromise = openIDB();

        const dbResults = dbOpenPromise.then((db: IDBDatabase) => {
          countIDBItem(db);

          return fetchP
            .then((res) => {
              if (!res.ok) {
                clientLogger("fetch", ERROR);
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
              ).then((dataO: CacheDataObj) => toResponse(dataO))
            );
        });

        e.respondWith(dbResults);
      }
    } else if (url.startsWith(gCloudFnPronounce)) {
      // site media asset

      const uid = getParam(url, "uid");
      const word = decodeURI(getParam(url, "q"));

      const cleanUrl = removeParam(url, "uid");
      const myRequest = toRequest(cleanUrl);

      if (!swSelf.indexedDB) {
        // use cache
        console.log(NO_INDEXEDDB_SUPPORT);
        clientLogger(NO_INDEXEDDB_SUPPORT, WARN);
        //@ts-expect-error FIXME: appMediaReq
        e.respondWith(appMediaReq(myRequest));
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
              clientLogger("IDB.get [] " + word, WARN);

              return fetch(myRequest)
                .then((res) => {
                  if (!res.ok) {
                    clientLogger("fetch", ERROR);
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
        e.respondWith(dbResults);
      }
    } else {
      // everything else
      e.respondWith(fetch(e.request));
    }
  });

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
            // clientLogger("IDB.upgrade", DEBUG);
            resolve({ type: "upgrade", val: db });
          };
        };
      }
    );

    const dbOpenP: Promise<{ type: string; val: IDBDatabase }> = new Promise(
      (resolve, reject) => {
        openRequest.onerror = function (/*event*/) {
          clientLogger("IDB.open X(", ERROR);
          reject();
        };
        openRequest.onsuccess = function (event) {
          if (event.target === null) throw new Error("openIDB failed");

          const db = (event.target as IDBRequest<IDBDatabase>).result;

          db.onerror = function (event) {
            // Generic error handler for all errors targeted at this database's
            // requests!
            if (event.target && "errorCode" in event.target) {
              clientLogger("IDB " + event.target.errorCode + " X(", ERROR);
              console.error("Database error: " + event.target.errorCode);
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
   * objectStore.getAll()
   * @returns a promise containing array of results
   */
  function dumpIDB(version: number, store: string) {
    let openRequest = indexedDB.open(appMediaCache, version);

    const dbOpenPromise: Promise<IDBDatabase> = new Promise(
      (resolve, reject) => {
        openRequest.onerror = function (/*event*/) {
          clientLogger("IDB.open X(", ERROR);
          reject();
        };
        openRequest.onsuccess = function (event) {
          if (event.target === null) throw new Error("dumpIDB open failed");

          const db = (event.target as IDBRequest<IDBDatabase>).result;

          db.onerror = function (event) {
            // Generic error handler for all errors targeted at this database's
            // requests!
            if (event.target && "errorCode" in event.target) {
              clientLogger("IDB " + event.target.errorCode + " X(", ERROR);
              console.error("Database error: " + event.target.errorCode);
            }
          };

          // console.log("open success");
          resolve(db);
        };
      }
    );

    return dbOpenPromise.then((db: IDBDatabase) => {
      let transaction = db.transaction([store], "readonly");
      let objectStore = transaction.objectStore(store);

      const getAllP: Promise<IDBDatabase> = new Promise((resolve, reject) => {
        const request = objectStore.getAll();
        request.onerror = () => {
          clientLogger("IDB.getAll X(", ERROR);
          reject();
        };
        request.onsuccess = (event) => {
          db.close();
          if (event.target === null)
            throw new Error("dumpIDB transaction failed");

          const transactionDb = (event.target as IDBRequest<IDBDatabase>)
            .result;

          resolve(transactionDb);
        };
      });

      return getAllP;
    });
  }

  /**
   * Post message to client
   */
  function clientMsg(type: string, msg: Object) {
    return swSelf.clients
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
    return swSelf.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((client) => {
        if (client && client.length) {
          return client[0].postMessage({
            type: SERVICE_WORKER_LOGGER_MSG,
            msg,
            lvl,
          });
        }
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
        clientLogger("IDB.count X(", ERROR);
        reject();
      };
      request.onsuccess = function () {
        if (request.result) {
          clientLogger("IDB [" + request.result + "]", DEBUG);
          resolve(request.result);
        } else {
          clientLogger("IDB []", WARN);
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
    const request = transaction.objectStore(store).get(key);

    const requestP: Promise<CacheDataObj> = new Promise((resolve, reject) => {
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
        clientLogger("IDB.add X(", ERROR);
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
        clientLogger("IDB.put X(", ERROR);
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
   * objectStore.delete(key)
   */
  function deleteIDBItem(db: IDBDatabase, store: string, key: string) {
    const transaction = db.transaction([store], "readwrite");

    let request = transaction.objectStore(store).delete(key);

    request.onsuccess = function (/*event*/) {};
    request.onerror = function () {
      clientLogger("IDB.delete X(", ERROR);
    };

    const transactionP = new Promise((resolve, reject) => {
      transaction.oncomplete = function () {
        resolve(undefined);
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
   */
  function appDataReq(request: Request) {
    const url = request.url;
    const version = request.headers.get("Data-Version");

    let response;
    if (!version || version === "0") {
      // TODO: catch when no version match
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
    const filename = url.split("/").pop() || url;
    const [dName] = filename.split(".json");

    return appVersionCacheOnFailFetch()
      .then((res) => res && res.json())
      .then((versions) => versions[dName]);
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
    jsonObj: Object,
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
          .then((r) => r && r.json())
          .then((resOld) => {
            // create obj with new and old hashes
            let newTermsMsgPromise = Promise.resolve(undefined);
            let versionChange: Record<string, { old: string; new: string }> =
              {};
            let update = false;
            const allowedSets = ["vocabulary", "phrases"];
            for (let n in resNew) {
              if (allowedSets.includes(n)) {
                if (resOld?.[n] !== resNew[n]) {
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

              let newlyAdded: Record<string, { freq: Object[]; dic: Object }> =
                {};
              let ps: Promise<void>[] = [];
              for (let setName in versionChange) {
                const theUrl = fbURL + "/" + setName + ".json";

                ps.push(
                  cacheVerData(theUrl, versionChange[setName].new)
                    .then((d) => d.json())
                    .then((newData: Object) =>
                      cacheVerData(theUrl, versionChange[setName].old)
                        .then((d2) => d2.json())
                        .then((oldData) => {
                          let arr: Object[] = [];
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

                          return Promise.resolve(undefined);
                        })
                    )
                );
              }

              // message results to client
              newTermsMsgPromise = Promise.all(ps).then(() => {
                if (update) {
                  return swSelf.clients
                    .matchAll({ includeUncontrolled: true, type: "window" })
                    .then((client) => {
                      if (client && client.length) {
                        // console.log("[SW] posting message");
                        client[0].postMessage({
                          type: SERVICE_WORKER_NEW_TERMS_ADDED,
                          msg: newlyAdded,
                        });
                      }

                      return Promise.resolve(undefined);
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
}
