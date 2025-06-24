import { type MetaDataObj } from "nmemonica";

import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../pwa/helper/idbHelper";
import { jtox } from "../helper/jsonHelper";
import { dataSetNames, workbookSheetNames } from "../helper/sheetHelper";
import { IndexedDBWorkerReq } from "../slices/indexedDBSlice";
import type { AppSettingState } from "../typings/slices";
import type { ValuesOf } from "../typings/utils";

// TODO: from slices
const settingsKeys = [
  "global",
  "vocabulary",
  "phrases",
  "kanji",
  "kana",
  "opposite",
  "particle",
] as const;

/**
 * Reads a value from storage
 */
export function usingPathRead<T>(
  storage: Partial<AppSettingState>,
  path: (keyof AppSettingState)[]
): T {
  if (path.length === 1) {
    const attr = path[0];
    return storage[attr] as T;
  }

  const [first, ...rest] = path;
  const child = storage[first] ?? {};

  return usingPathRead(child, rest);
}

/**
 * Writes a value to storage
 */
export function usingPathWrite(
  storage: Partial<AppSettingState>,
  path: (keyof AppSettingState)[],
  value: unknown
): Partial<AppSettingState> {
  if (path.length === 1) {
    const attr = path[0];
    return { ...storage, [attr]: value };
  }

  const [first, ...rest] = path;
  const child = storage[first] ?? {};

  return {
    ...storage,
    [first]: usingPathWrite(child, rest, value),
  };
}

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 *
 * @param required List of required sheets in workbook. Any missing are created (placeholders).
 */
export function getWorkbookFromIndexDB(
  required?: (keyof typeof workbookSheetNames)[]
) {
  return openIDB()
    .then((db) => {
      // if indexedDB has stored workbook
      const stores = Array.from(db.objectStoreNames);

      const ErrorWorkbookMissing = new Error("Workbook not stored", {
        cause: { code: IDBErrorCause.NoResult },
      });
      if (!stores.includes(IDBStores.WORKBOOK)) {
        throw ErrorWorkbookMissing;
      }

      // use stored workbook
      return getIDBItem({ db, store: IDBStores.WORKBOOK }, "0").then((res) => {
        if (!(IDBStores.WORKBOOK in res) || res.workbook.length === 0) {
          throw ErrorWorkbookMissing;
        }

        required?.forEach((sheetName) => {
          const sheet = res.workbook.find(
            (s) =>
              s.name.toLowerCase() ===
              workbookSheetNames[sheetName].prettyName.toLowerCase()
          );
          if (sheet === undefined) {
            // insert an empty required sheet
            res.workbook.push(
              jtox(
                {
                  /** no data just headers */
                },
                workbookSheetNames[sheetName].prettyName
              )
            );
          }
        });

        return res.workbook;
      });
    })
    .catch(() => {
      return [
        jtox(
          {
            /** no data just headers */
          },
          workbookSheetNames.phrases.prettyName
        ),
        jtox(
          {
            /** no data just headers */
          },
          workbookSheetNames.vocabulary.prettyName
        ),
        jtox(
          {
            /** no data just headers */
          },
          workbookSheetNames.kanji.prettyName
        ),
      ];
    });
}

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 */
export function getSheetFromIndexDB(
  sheetName: keyof typeof workbookSheetNames
) {
  return getWorkbookFromIndexDB().then((workbook) => {
    const sheet = workbook.find(
      (s) =>
        s.name.toLowerCase() ===
        workbookSheetNames[sheetName].prettyName.toLowerCase()
    );
    if (sheet === undefined) {
      throw new Error(`Expected to find ${sheetName} sheet in workbook`);
    }
    return sheet;
  });
}

/**
 * Retrieve the settings object stored in IndexDB
 */
export function getIndexDBUserSettings(): Promise<Partial<AppSettingState>> {
  return Promise.allSettled(
    settingsKeys.map((key) =>
      openIDB().then((db) => {
        // if indexedDB has stored setttings
        const stores = Array.from(db.objectStoreNames);

        const ErrorSettingsMissing = new Error("User settings not stored", {
          cause: { code: IDBErrorCause.NoResult },
        });
        if (!stores.includes(IDBStores.SETTINGS)) {
          throw ErrorSettingsMissing;
        }

        return getIDBItem({ db, store: IDBStores.SETTINGS }, key).then(
          (res) => {
            let initialState: ValuesOf<AppSettingState> | null = null;

            if (
              typeof res.value === "object" &&
              !Array.isArray(res.value) &&
              res.value !== null
            ) {
              initialState = res.value as ValuesOf<AppSettingState>;
            }

            return initialState;
          }
        );
      })
    )
  ).then((keyValues) =>
    settingsKeys.reduce<Partial<AppSettingState>>((acc, key, i) => {
      if (keyValues[i].status === "fulfilled") {
        return { ...acc, [key]: keyValues[i].value };
      }

      return acc;
    }, {})
  );
}

/**
 * Store a whole settings object
 */
export function setIndexDBUserSettings(value: Partial<AppSettingState>) {
  return Promise.all(
    (Object.keys(value) as (keyof AppSettingState)[]).map((key) =>
      openIDB().then((db) =>
        putIDBItem(
          { db, store: IDBStores.SETTINGS },
          { key, value: value[key] }
        )
      )
    )
  ).then(() => {});
}

export function indexDBUserSettingAttrUpdate(
  state: Partial<AppSettingState>,
  path: string,
  attr: string
): Promise<boolean>;

export function indexDBUserSettingAttrUpdate<T>(
  state: Partial<AppSettingState>,
  path: string,
  attr: string,
  value: T
): Promise<T>;
/**
 * Modifies an attribute or toggles the existing value
 * @param state required when toggling `attr` for prev value
 * @param path
 * @param attr
 * @param value optional if absent `attr` will be toggled
 */
export function indexDBUserSettingAttrUpdate<T>(
  state: Partial<AppSettingState>,
  path: string,
  attr: string,
  value?: T
) {
  return getIndexDBUserSettings().then((res) => {
    let initialState = res ?? {};

    const cleanPath = [
      ...path.split("/").filter((p) => p !== ""),
      attr,
    ] as (keyof AppSettingState)[];

    let boolValue: boolean | undefined;
    if (value === undefined) {
      // toggle
      boolValue = !usingPathRead<boolean>(state, cleanPath);
    }

    const modifiedState = usingPathWrite(
      { ...initialState },
      cleanPath,
      boolValue ?? value
    );
    const modifiedValue = usingPathRead<T>(modifiedState, cleanPath);

    return setIndexDBUserSettings({
      ...modifiedState,
    }).then(() => modifiedValue);
  });
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function indexDBUserSettingAttrDelete(path: string, attr: string) {
  return getIndexDBUserSettings().then((res) => {
    const initialState = res ?? {};
    const cleanPath = [
      ...path.split("/").filter((p) => p !== ""),
      attr,
    ] as (keyof AppSettingState)[];

    const modifiedState = usingPathWrite(
      { ...initialState },
      cleanPath,
      undefined
    );

    return setIndexDBUserSettings({
      ...modifiedState,
    });
  });
}

/**
 * Retrieve the study progress object stored in IndexDB
 */
export function getIndexDBStudyProgress(path: (typeof dataSetNames)[number]) {
  return openIDB()
    .then((db) => {
      // if indexedDB has stored
      const stores = Array.from(db.objectStoreNames);

      const ErrorSettingsMissing = new Error("Progress not stored", {
        cause: { code: IDBErrorCause.NoResult },
      });
      if (!stores.includes(IDBStores.PROGRESS)) {
        throw ErrorSettingsMissing;
      }

      return getIDBItem({ db, store: IDBStores.PROGRESS }, path).then((res) => {
        let initialState: Record<string, MetaDataObj | undefined> = {};

        if (
          typeof res.value === "object" &&
          !Array.isArray(res.value) &&
          res.value !== null
        ) {
          initialState = res.value as Record<string, MetaDataObj | undefined>;
        }

        return initialState;
      });
    })
    .catch((err) => {
      if (err instanceof Error && "cause" in err) {
        const errData = err.cause as { code: string };
        if (errData.code === "IDBNoResults") {
          // study progress not yet initialized
          return {} as Record<string, MetaDataObj | undefined>;
        }
      }

      // all else ...

      // eslint-disable-next-line
      console.log(err);
      throw err;
    });
}

/**
 * Store a whole study-state object
 */
export function setIndexDBStudyProgress(
  path: (typeof dataSetNames)[number],
  value: Record<string, MetaDataObj | undefined>
) {
  return openIDB().then((db) =>
    putIDBItem({ db, store: IDBStores.PROGRESS }, { key: path, value: value })
  );
}

export function indexDBUserStudyProgressAttrUpdate(
  path: (typeof dataSetNames)[number],
  value: Record<string, MetaDataObj | undefined>
) {
  return getIndexDBStudyProgress(path).then((res) => {
    let initialState = res ?? {};

    return setIndexDBStudyProgress(path, {
      ...initialState,
      ...value,
    });
  });
}

const wSelf = globalThis.self as unknown as Worker;

wSelf.addEventListener("message", messageHandler);

function messageHandler(event: MessageEvent) {
  const req = event.data as IndexedDBWorkerReq;

  const { getProgress, setSettings, updateSettings, deleteSettings } = req;

  try {
    if (req.getSheet !== undefined) {
      const { sheetName } = req.getSheet;
      if (sheetName === undefined) {
        throw new Error("Required sheetName");
      }
      void getSheetFromIndexDB(sheetName).then((sheet) =>
        wSelf.postMessage(sheet)
      );
    } else if (req.getWorkbook !== undefined) {
      const { required } = req.getWorkbook;
      void getWorkbookFromIndexDB(required).then((workbook) =>
        wSelf.postMessage(workbook)
      );
    } else if (req.getSettings === true) {
      void getIndexDBUserSettings().then((settings) =>
        wSelf.postMessage(settings)
      );
    } else if (setSettings !== undefined) {
      const { value } = setSettings;
      void setIndexDBUserSettings(value).then((settings) =>
        wSelf.postMessage(settings)
      );
    } else if (updateSettings !== undefined) {
      const { state, path, attr, value } = updateSettings;
      void indexDBUserSettingAttrUpdate(state, path, attr, value).then(
        (settings) => wSelf.postMessage(settings)
      );
    } else if (deleteSettings !== undefined) {
      const { path, attr } = deleteSettings;

      void indexDBUserSettingAttrDelete(path, attr).then(() =>
        wSelf.postMessage(undefined)
      );
    } else if (getProgress !== undefined) {
      const { path } = getProgress;

      if (path !== undefined) {
        void getIndexDBStudyProgress(path).then((progress) =>
          wSelf.postMessage(progress)
        );
        return;
      }

      void Promise.all(
        dataSetNames.map((name) => getIndexDBStudyProgress(name))
      )
        .then((states) =>
          states.reduce(
            (acc, state, i) => {
              if (state !== null && Object.keys(state).length > 0) {
                return { ...acc, [dataSetNames[i]]: state };
              }

              return acc;
            },
            {} as Partial<
              Record<(typeof dataSetNames)[number], Record<string, MetaDataObj>>
            >
          )
        )
        .then((progress) => wSelf.postMessage(progress));
    } else if (req.updateProgress !== undefined) {
      const { path, value } = req.updateProgress;
      void indexDBUserStudyProgressAttrUpdate(path, value).then((progress) =>
        wSelf.postMessage(progress)
      );
    } else if (req.setProgress !== undefined) {
      const { value } = req.setProgress;

      void Promise.all(
        dataSetNames.reduce((acc, name) => {
          if (value[name] !== undefined) {
            return [...acc, setIndexDBStudyProgress(name, value[name])];
          }
          return acc;
        }, [] as Promise<unknown>[])
      ).then((result) => {
        wSelf.postMessage(result);
      });
    }
  } catch (exception) {
    wSelf.postMessage(exception);
  }
}
