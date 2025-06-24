import { type SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { type MetaDataObj } from "nmemonica";

import { dataSetNames, workbookSheetNames } from "../helper/sheetHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";
import type { AppProgressState, AppSettingState } from "../typings/slices";

const INDEXDB_WORKER_NAME = "indexed-db-worker.js";
const SLICE_NAME = "indexedDB";

export interface IndexedDBWorkerReq<T = never> {
  getSheet?: { sheetName: keyof typeof workbookSheetNames };
  getWorkbook?: { required?: (keyof typeof workbookSheetNames)[] };
  getSettings?: true;
  setSettings?: {
    value: Partial<AppSettingState>;
  };
  updateSettings?: {
    state: Partial<AppSettingState>;
    path: string;
    attr: string;
    value?: T;
  };
  deleteSettings?: {
    path: string;
    attr: string;
  };
  getProgress?: { path?: (typeof dataSetNames)[number] };
  updateProgress?: {
    path: (typeof dataSetNames)[number];
    value: Record<string, MetaDataObj | undefined>;
  };
  setProgress?: {
    value: Partial<AppProgressState>;
  };
}

function workerConnection<T>(worker: Worker, req: IndexedDBWorkerReq<T>) {
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

export const getUserSettings = createAsyncThunk(
  `${SLICE_NAME}/getUserSettings`,
  () => {
    const req: IndexedDBWorkerReq = { getSettings: true };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<Partial<AppSettingState>>;
  }
);

export const setUserSettings = createAsyncThunk(
  `${SLICE_NAME}/setUserSettings`,
  (value: NonNullable<IndexedDBWorkerReq["setSettings"]>["value"]) => {
    const req: IndexedDBWorkerReq = { setSettings: { value } };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<Partial<AppSettingState>>;
  }
);

export function updateUserSettings<T = boolean>(
  arg: NonNullable<IndexedDBWorkerReq<T>["updateSettings"]>
) {
  return createAsyncThunk(
    `${SLICE_NAME}/updateUserSettings`,
    ({
      state,
      path,
      attr,
      value,
    }: NonNullable<IndexedDBWorkerReq<T>["updateSettings"]>) => {
      const req: IndexedDBWorkerReq<T> = {
        updateSettings: { state, path, attr, value },
      };
      const worker = new Worker(INDEXDB_WORKER_NAME);

      return workerConnection(worker, req) as Promise<T>;
    }
  )(arg);
}

export const deleteUserSettings = createAsyncThunk(
  `${SLICE_NAME}/deleteUserSettings`,
  ({ path, attr }: NonNullable<IndexedDBWorkerReq["deleteSettings"]>) => {
    const req: IndexedDBWorkerReq = {
      deleteSettings: { path, attr },
    };
    const worker = new Worker(INDEXDB_WORKER_NAME);

    return workerConnection(worker, req) as Promise<undefined>;
  }
);

export const getUserProgress = createAsyncThunk(
  `${SLICE_NAME}/getUserProgress`,
  (path: NonNullable<IndexedDBWorkerReq["getProgress"]>["path"]) => {
    const req: IndexedDBWorkerReq = { getProgress: { path } };
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
