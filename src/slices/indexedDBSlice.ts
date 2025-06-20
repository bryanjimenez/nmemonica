import { type SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { type MetaDataObj } from "nmemonica";

import { dataSetNames, workbookSheetNames } from "../helper/sheetHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";

import { type AppProgressState } from ".";

const INDEXDB_WORKER_NAME = "indexed-db-worker.js";
const SLICE_NAME = "indexedDB";

export interface IndexedDBWorkerReq {
  getSheet?: { sheetName: keyof typeof workbookSheetNames };
  getWorkbook?: { required?: (keyof typeof workbookSheetNames)[] };
  getProgress?: true;
  updateProgress?: {
    path: (typeof dataSetNames)[number];
    value: Record<string, MetaDataObj | undefined>;
  };
  setProgress?: {
    value: Partial<AppProgressState>;
  };
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
  `${SLICE_NAME}/getSheetFromIndexDB`,
  (sheetName: NonNullable<IndexedDBWorkerReq["getSheet"]>["sheetName"]) => {
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
  `${SLICE_NAME}/getWorkbookFromIndexDB`,
  (required?: NonNullable<IndexedDBWorkerReq["getWorkbook"]>["required"]) => {
    const req: IndexedDBWorkerReq = { getWorkbook: { required } };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<SheetData[]>;
  }
);

export const getUserProgress = createAsyncThunk(
  `${SLICE_NAME}/getUserProgress`,
  () => {
    const req: IndexedDBWorkerReq = { getProgress: true };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<
      Partial<
        Record<(typeof dataSetNames)[number], Record<string, MetaDataObj>>
      >
    >;
  }
);

export const updateUserProgress = createAsyncThunk(
  `${SLICE_NAME}/updateUserProgress`,
  ({ path, value }: NonNullable<IndexedDBWorkerReq["updateProgress"]>) => {
    const req: IndexedDBWorkerReq = { updateProgress: { path, value } };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<{
      key: "phrases" | "vocabulary" | "kanji";
      value: Record<string, MetaDataObj | undefined>;
    }>;
  }
);

export const setUserProgress = createAsyncThunk(
  `${SLICE_NAME}/setUserProgress`,
  (value: NonNullable<IndexedDBWorkerReq["setProgress"]>["value"]) => {
    const req: IndexedDBWorkerReq = { setProgress: { value } };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<void>;
  }
);
