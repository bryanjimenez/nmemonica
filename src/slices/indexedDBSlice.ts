import { type SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { workbookSheetNames } from "../helper/sheetHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";

const INDEXDB_WORKER_NAME = "indexed-db-worker.js";

export interface IndexedDBWorkerReq {
  getSheet?: { sheetName: keyof typeof workbookSheetNames };
  getWorkbook?: { required?: (keyof typeof workbookSheetNames)[] };
}

function workerConnection(worker: Worker, req: IndexedDBWorkerReq) {
  return new Promise<unknown>((resolve, reject) => {
    const wMsgHandler = (event: MessageEvent<unknown>) => {
      if (event.data instanceof Error) {
        reject(event.data);
      } else {
        resolve(event.data);
      }
      worker.terminate();
    };

    const wErrHandler = (event: ErrorEvent | MessageEvent) => {
      reject(event);
      worker.terminate();
    };

    worker.addEventListener("error", wErrHandler, { once: true });
    worker.addEventListener("messageerror", wErrHandler, { once: true });
    worker.addEventListener("message", wMsgHandler, { once: true });
    worker.postMessage(req);
  });
}

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 */
export const getSheetFromIndexDB = createAsyncThunk(
  "indexedDB/getSheetFromIndexDB",
  (sheetName: keyof typeof workbookSheetNames) => {
    const req: IndexedDBWorkerReq = { getSheet: { sheetName } };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<FilledSheetData>;
  }
);

/**
 * Retrieves workbook from:
 * indexedDB
 * cache
 * or creates placeholders
 */
export const getWorkbookFromIndexDB = createAsyncThunk(
  "indexedDB/getWorkbookFromIndexDB",
  (required?: (keyof typeof workbookSheetNames)[]) => {
    const req: IndexedDBWorkerReq = { getWorkbook: { required } };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<SheetData[]>;
  }
);
