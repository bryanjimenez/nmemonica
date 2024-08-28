import { type SheetData } from "@nmemonica/x-spreadsheet";
import type { ValuesOf } from "../../src/typings/utils";

export const appDBName = "nmemonica-db";
export const appDBVersion = 1;

export const IDBStores = Object.freeze({
  MEDIA: "media",
  STATE: "state",
  SETTINGS: "settings",
  WORKBOOK: "workbook",
});

export const IDBErrorCause = Object.freeze({
  NoResult: "IDBNoResults",
});

interface StoreMap {
  [IDBStores.MEDIA]: MediaEntry;
  [IDBStores.STATE]: StateEntry;
  [IDBStores.SETTINGS]: SettingsEntry;
  [IDBStores.WORKBOOK]: WorkbookEntry;
}

interface MediaEntry {
  uid: string;
  blob: Blob;
}

interface StateEntry {
  key: string;
  value: unknown;
}

interface SettingsEntry {
  key: string;
  value: unknown; // LocalStorateState, but it's under ./src
}

interface WorkbookEntry {
  key: string;
  workbook: SheetData[];
}

type LoggerLike = (msg: string, severity: number) => void;

export const IDBKeys = Object.freeze({
  State: { EDITED: "localDataEdited" },
});

/**
 * indexedDB.open()
 * @param version
 */
export function openIDB({
  version,
  logger,
}: { version?: number; logger?: LoggerLike } = {}) {
  // const v = version!==undefined?version:appDBVersion;

  let openRequest = indexedDB.open(appDBName, version ?? appDBVersion);
  const dbUpgradeP: Promise<{ type: string; val: IDBDatabase }> = new Promise(
    (resolve /*reject*/) => {
      openRequest.onupgradeneeded = function (event) {
        if (event.target === null) throw new Error("onupgradeneeded failed");
        // Save the IDBDatabase interface
        const db = (event.target as IDBRequest<IDBDatabase>).result;

        switch (event.oldVersion) {
          case 0: {
            // initial install
            // Create an objectStore for this database
            const mediaStore = db.createObjectStore(IDBStores.MEDIA, {
              keyPath: "uid",
            });

            // Use transaction oncomplete to make sure the objectStore creation is
            // finished before adding data into it.
            const mediaStoreP = new Promise<void>((mediaRes, _reject) => {
              mediaStore.transaction.oncomplete = function () {
                mediaRes();
              };
            });

            const stateStore = db.createObjectStore(IDBStores.STATE, {
              keyPath: "key",
            });

            const stateStoreP = new Promise<void>((stateRes, _reject) => {
              stateStore.transaction.oncomplete = function () {
                stateRes();
              };
            });

            const settingsStore = db.createObjectStore(IDBStores.SETTINGS, {
              keyPath: "key",
            });

            const settingStoreP = new Promise<void>((settingRes, _reject) => {
              settingsStore.transaction.oncomplete = function () {
                settingRes();
              };
            });

            const workbookStore = db.createObjectStore(IDBStores.WORKBOOK, {
              keyPath: "key",
            });

            const workbookStoreP = new Promise<void>((workbookRes, _reject) => {
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
    }
  );

  const dbOpenP: Promise<{ type: string; val: IDBDatabase }> = new Promise(
    (resolve, reject) => {
      openRequest.onerror = function (/*event*/) {
        if (typeof logger === "function") {
          logger("IDB.open X(", 1);
        }
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
            if (typeof logger === "function") {
              logger("IDB Open X(", 1);
            }
          }
        };

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
 * objectStore.get(key)
 */
export function getIDBItem<
  S extends ValuesOf<typeof IDBStores>,
  T extends StoreMap[S],
>(
  { db, store, logger }: { db: IDBDatabase; store?: S; logger?: LoggerLike },
  key: string
) {
  const defaultStore = IDBStores.MEDIA;

  const transaction = db.transaction([store ?? defaultStore]);
  const request = transaction
    .objectStore(store ?? defaultStore)
    .get(key) as IDBRequest<T>;

  const requestP: Promise<T> = new Promise((resolve, reject) => {
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
          new Error("No results found", {
            cause: { code: IDBErrorCause.NoResult },
          })
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

/**
 * objectStore.add(value)
 */
export function addIDBItem<
  S extends ValuesOf<typeof IDBStores>,
  T extends StoreMap[S],
>({ db, store }: { db: IDBDatabase; store?: S }, value: T) {
  const defaultStore = IDBStores.MEDIA;

  let transaction = db.transaction([store ?? defaultStore], "readwrite");

  let request = transaction.objectStore(store ?? defaultStore).add(value);

  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (/*event*/) {
      resolve(undefined);
    };
    request.onerror = function () {
      // clientLogger("IDB.add X(", DebugLevel.ERROR);
      reject();
    };
  });

  const transactionP: Promise<typeof value> = new Promise((resolve, reject) => {
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
export function putIDBItem<
  S extends ValuesOf<typeof IDBStores>,
  T extends StoreMap[S],
>({ db, store }: { db: IDBDatabase; store?: S }, value: T) {
  const defaultStore = IDBStores.MEDIA;
  let transaction = db.transaction([store ?? defaultStore], "readwrite");

  let request = transaction.objectStore(store ?? defaultStore).put(value);

  const requestP = new Promise((resolve, reject) => {
    request.onsuccess = function (/*event*/) {
      resolve(undefined);
    };
    request.onerror = function () {
      // clientLogger("IDB.put X(", DebugLevel.ERROR);
      reject();
    };
  });

  const transactionP: Promise<typeof value> = new Promise((resolve, reject) => {
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
 * objectStore.count()
 */
export function countIDBItem(db: IDBDatabase, store = IDBStores.MEDIA) {
  const transaction = db.transaction([store]);
  const request = transaction.objectStore(store).count();

  const requestP: Promise<number> = new Promise((resolve, reject) => {
    request.onerror = function (/*event*/) {
      // clientLogger("IDB.count X(", DebugLevel.ERROR);
      reject();
    };
    request.onsuccess = function () {
      if (request.result) {
        // clientLogger(
        //   `${db.name}.${store} [${request.result}]`,
        //   DebugLevel.DEBUG
        // );
        resolve(request.result);
      } else {
        // clientLogger(`${db.name}.${store} []`, DebugLevel.WARN);
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
 * objectStore.getAll()
 */
export function getAllIDBItem<
  S extends ValuesOf<typeof IDBStores>,
  T extends StoreMap[S],
>(db: IDBDatabase, store: S) {
  const transaction = db.transaction([store]);
  const request = transaction.objectStore(store).getAll();

  const requestP: Promise<T[]> = new Promise((resolve, reject) => {
    request.onerror = function (/*event*/) {
      // clientLogger("IDB.getAll X(", DebugLevel.ERROR);
      reject();
    };
    request.onsuccess = function () {
      if (request.result) {
        resolve(request.result);
      } else {
        resolve([]);
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
