import { csvToObject } from "@nmemonica/snservice/src/helper/csvHelper";
import {
  jtox,
  sheetDataToJSON,
} from "@nmemonica/snservice/src/helper/jsonHelper";
import { FilledSheetData } from "@nmemonica/snservice/src/helper/sheetHelper";
import type Spreadsheet from "@nmemonica/x-spreadsheet";
import type { SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { logger } from "./globalSlice";
import { getKanji } from "./kanjiSlice";
import { getPhrase } from "./phraseSlice";
import { DebugLevel } from "./settingHelper";
import { getVocabulary } from "./vocabularySlice";
import {
  dataServiceEndpoint,
  pushServicePubKeyPath,
  pushServiceRegisterClientPath,
  pushServiceSheetDataUpdatePath,
  sheetServicePath,
} from "../../environment.development";
import { swMessageSaveDataJSON } from "../helper/serviceWorkerHelper";
import { getActiveSheet } from "../helper/sheetHelper";

import { AppDispatch } from ".";

export interface SheetInitSlice {}

const initialState: SheetInitSlice = {};

class LineReadSimulator extends EventTarget {
  line(value: string) {
    this.dispatchEvent(new CustomEvent("line", { detail: value }));
  }

  close(value?: string) {
    this.dispatchEvent(new CustomEvent("close", { detail: value }));
  }

  on(type: string, callback: (line: string) => void) {
    const listener: EventListener = (ev): void => {
      // for line event
      if ("detail" in ev && typeof ev.detail === "string") {
        const { detail } = ev;
        return callback(detail);
      }

      // for close event
      return callback("");
    };

    switch (type) {
      case "line":
        this.addEventListener("line", listener);
        break;

      case "close":
        this.addEventListener("close", listener);
        break;
    }
  }
}

/**
 * From GitHub get user's dataset
 * @param url github usercontent url
 * @param name of csv sheet
 */
function getCSVDataset(url: string, name: string) {
  const n = name.slice(0, name.indexOf("."));
  return fetch(url + name)
    .then((res) => {
      if (!res.ok) {
        throw new Error("bad response?");
      }

      return res.text();
    })
    .then((text) => {
      const lrSimulator = new LineReadSimulator();
      lrSimulator.addEventListener("line", () => {});

      const objP = csvToObject(lrSimulator, n);

      let lineEnding = !text.includes("\r\n") ? "\n" : "\r\n";
      // console.log('line end '+JSON.stringify(lineEnding))
      text.split(lineEnding).forEach((line) => {
        lrSimulator.line(line);
      });

      lrSimulator.close();

      return objP;
    });
}

export const importDatasets = createAsyncThunk(
  "sheet/importDatasets",
  async (arg, thunkAPI) => {
    // fetch cache.json then ...
    const dataP = getCachedDataset(thunkAPI.dispatch as AppDispatch);

    return dataP;
  }
);

function getCachedDataset(dispatch: AppDispatch) {
  const vocabP = dispatch(getVocabulary()).unwrap();
  const phraseP = dispatch(getPhrase()).unwrap();
  const kanjiP = dispatch(getKanji()).unwrap();

  const sheets = ["Phrases", "Vocabulary", "Kanji"];

  return Promise.all([phraseP, vocabP, kanjiP]).then((arr) =>
    arr.reduce<FilledSheetData[]>((acc, { value }, i) => {
      return [...acc, jtox(value, sheets[i])];
    }, [])
  );
}

export const getDatasets = createAsyncThunk(
  "sheet/getDatasets",
  async (arg, thunkAPI) => {
    return getCachedDataset(thunkAPI.dispatch as AppDispatch);
  }
);

export function saveSheetLocalService(
  activeSheetData: SheetData,
  serviceBaseUrl: string
) {
  if (!activeSheetData.name) return Promise.reject(new Error("Missing sheet"));

  const activeSheetName = activeSheetData.name;

  const container = new FormData();
  const data = new Blob([JSON.stringify(activeSheetData)], {
    type: "application/json",
  });

  container.append("sheetType", "xSheetObj");
  container.append("sheetName", activeSheetName);
  container.append("sheetData", data);

  return fetch(serviceBaseUrl + sheetServicePath, {
    method: "PUT",
    credentials: "include",
    body: container,
  })
    .then((res) => {
      if (res.status === 307) {
        // received an httpOnly cookie
        return fetch(serviceBaseUrl + sheetServicePath, {
          method: "PUT",
          credentials: "include",
          body: container,
        }).then((res) => {
          if (!res.ok) {
            throw new Error("Redirected and failed to save sheet");
          }
          return res;
        });
      }

      if (!res.ok) {
        throw new Error("Failed to save sheet");
      }
      return res;
    })
    .then((res) => res.json())
    .then(({ hash }: { hash: string }) => ({ hash, name: activeSheetName }));
}

/**
 * Borrowed from MDN serviceworker cookbook
 * @link https://github.com/mdn/serviceworker-cookbook/blob/master/tools.js
 */
export function urlBase64ToUint8Array(base64String: string) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
/**
 * Register Service Worker to a subscription service from `serviceURL`
 * @param dispatch
 * @param serviceURL
 */
export function registerSWForSubscription(
  dispatch: AppDispatch,
  serviceURL: string
) {
  void navigator.serviceWorker.ready.then((registration) => {
    void registration.pushManager
      .getSubscription()
      .then(async (subscription) => {
        if (subscription) {
          return subscription;
        }

        const res = await fetch(serviceURL + pushServicePubKeyPath);
        const keyBase64String = await res.text();
        // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
        // urlBase64ToUint8Array() is defined in /tools.js
        const keyUint8Array = urlBase64ToUint8Array(keyBase64String);

        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyUint8Array,
        });
      })
      .then((subscription) => {
        void fetch(serviceURL + pushServiceRegisterClientPath, {
          method: "post",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            subscription,
          }),
        });
      })
      .catch((err: Error) => {
        dispatch(logger("Push API: " + err.message, DebugLevel.ERROR));
      });
  });
}

/**
 * Send push to subscribed clients
 */
function pushSheet(workbook: Spreadsheet | null, serviceBaseUrl: string) {
  if (!workbook) return;

  const { activeSheetName, activeSheetData } = getActiveSheet(workbook);

  const container = new FormData();
  const data = new Blob([JSON.stringify(activeSheetData)], {
    type: "application/json",
  });

  container.append("sheetType", "xSheetObj");
  container.append("sheetName", activeSheetName);
  container.append("sheetData", data);

  void fetch(serviceBaseUrl + pushServiceSheetDataUpdatePath, {
    method: "POST",
    body: container,
  });
}

export function saveSheetServiceWorker(sheet: FilledSheetData) {
  const { data, hash } = sheetDataToJSON(sheet);

  const resource = sheet.name.toLowerCase();

  return swMessageSaveDataJSON(
    dataServiceEndpoint + "/" + resource + ".json.v" + hash,
    data,
    ""
  ).then(() => ({
    name: sheet.name,
    hash,
  }));
}

const sheetSlice = createSlice({
  name: "sheet",
  initialState,
  reducers: {},
});

export const {} = sheetSlice.actions;
export default sheetSlice.reducer;
