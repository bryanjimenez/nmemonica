import {
  jtox,
  sheetDataToJSON,
} from "@nmemonica/snservice/src/helper/jsonHelper";
import { FilledSheetData } from "@nmemonica/snservice/src/helper/sheetHelper";
import type { SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getKanji } from "./kanjiSlice";
import { getPhrase } from "./phraseSlice";
import { getVocabulary } from "./vocabularySlice";
import {
  dataServiceEndpoint,
  sheetServicePath,
} from "../../environment.development";
import { swMessageSaveDataJSON } from "../helper/serviceWorkerHelper";

import { AppDispatch } from ".";

export interface SheetInitSlice {}

const initialState: SheetInitSlice = {};

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

export function saveSheetServiceWorker(sheet: FilledSheetData) {
  const { data, hash } = sheetDataToJSON(sheet);

  const resource = sheet.name.toLowerCase();

  return swMessageSaveDataJSON(
    dataServiceEndpoint + "/" + resource + ".json.v" + hash,
    data,
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
