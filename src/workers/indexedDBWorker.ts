import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
} from "../../pwa/helper/idbHelper";
import { jtox } from "../helper/jsonHelper";
import { workbookSheetNames } from "../helper/sheetHelper";
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
    }
  } catch (exception) {
    wSelf.postMessage(exception);
  }
}
