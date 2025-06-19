import { createAsyncThunk } from "@reduxjs/toolkit";

import { workbookSheetNames } from "../helper/sheetHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";

const INDEXDB_WORKER_NAME = "indexed-db-worker.js";

export interface IndexedDBWorkerReq {
  action: "sheet" | "workbook";
  sheetName?: keyof typeof workbookSheetNames;
  required?: (keyof typeof workbookSheetNames)[];
}

function workerConnection(worker: Worker, req: IndexedDBWorkerReq) {
  return new Promise<FilledSheetData>((resolve, reject) => {
    const wMsgHandler = (event: MessageEvent<FilledSheetData | Error>) => {
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
  async (sheetName: keyof typeof workbookSheetNames) => {
    const req: IndexedDBWorkerReq = { action: "sheet", sheetName };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req);
  }
);

export const getWorkbookFromIndexDBAsync = createAsyncThunk(
  "indexedDB/getWorkbookFromIndexDB",
  async (required: (keyof typeof workbookSheetNames)[]) => {
    const req: IndexedDBWorkerReq = { action: "workbook", required };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req);
  }
);
