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
    } else if (req.getProgress === true) {
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
