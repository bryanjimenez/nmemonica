import { type SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getKanji } from "./kanjiSlice";
import { getPhrase } from "./phraseSlice";
import { getVocabulary } from "./vocabularySlice";
import {
  dataServiceEndpoint,
  sheetServicePath,
} from "../../environment.development";
import { csvToObject } from "../helper/csvHelper";
import { jtox } from "../helper/jsonHelper";
import { swMessageSaveDataJSON } from "../helper/serviceWorkerHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";

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
 * Parse and construct sheet object
 * @param text whole csv text file
 * @param sheetName name of sheet
 */
export function readCsvToSheet(text: string, sheetName: string) {
  const lrSimulator = new LineReadSimulator();
  lrSimulator.addEventListener("line", () => {});

  const objP = csvToObject(lrSimulator, sheetName);

  let lineEnding = !text.includes("\r\n") ? "\n" : "\r\n";
  // console.log('line end '+JSON.stringify(lineEnding))
  text.split(lineEnding).forEach((line) => {
    lrSimulator.line(line);
  });

  lrSimulator.close();

  return objP;
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

export function saveSheetServiceWorker(
  name: string,
  data: Record<string, unknown>,
  hash: string
) {
  const resource = name.toLowerCase();

  return swMessageSaveDataJSON(
    dataServiceEndpoint + "/" + resource + ".json.v" + hash,
    data
  ).then(() => ({
    name: name,
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
