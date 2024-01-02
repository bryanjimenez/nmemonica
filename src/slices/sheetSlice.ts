import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getKanji } from "./kanjiSlice";
import { getPhrase } from "./phraseSlice";
import { getVocabulary } from "./vocabularySlice";
import { sheetServicePath } from "../../environment.development";
import { csvToObject } from "@nmemonica/snservice/src/helper/csvHelper";
import { jtox } from "@nmemonica/snservice/src/helper/jsonHelper";
import { FilledSheetData } from "@nmemonica/snservice/src/helper/sheetHelper";
import {
  ExternalSourceType,
  getExternalSourceType,
} from "../components/Form/ExtSourceInput";

import { AppDispatch, RootState } from ".";

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
    const state = thunkAPI.getState() as RootState;

    const externalSource = getExternalSourceType(state.global.localServiceURL);

    const baseUrl = state.global.localServiceURL;

    let dataP: Promise<FilledSheetData[]>;
    switch (externalSource) {
      case /** github repo */
      ExternalSourceType.GitHubUserContent:
        dataP = Promise.all([
          getCSVDataset(baseUrl + "/", "Phrases.csv"),
          getCSVDataset(baseUrl + "/", "Vocabulary.csv"),
          getCSVDataset(baseUrl + "/", "Kanji.csv"),
        ]);
        break;

      case /** local service */
      ExternalSourceType.LocalService:
        dataP = fetch(baseUrl + sheetServicePath)
          .then((res) => res.json())
          .then((data) => data as FilledSheetData[]);
        break;

      default:
        // fetch cache.json then ...
        dataP = getCachedDataset(thunkAPI.dispatch as AppDispatch);
        break;
    }

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

const sheetSlice = createSlice({
  name: "sheet",
  initialState,
  reducers: {},
});

export const {} = sheetSlice.actions;
export default sheetSlice.reducer;
