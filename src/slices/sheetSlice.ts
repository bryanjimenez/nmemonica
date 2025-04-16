import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getKanji } from "./kanjiSlice";
import { getPhrase } from "./phraseSlice";
import { getVocabulary } from "./vocabularySlice";
import {
  CSVErrorCause,
  SettingsErrorCause,
  csvToObject,
  validateCSVSheet,
  validateJSONSettings,
} from "../helper/csvHelper";
import { jtox } from "../helper/jsonHelper";
import { workbookSheetNames } from "../helper/sheetHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";
import { unusualApostrophe } from "../helper/unicodeHelper";

import { AppDispatch, AppSettingState, isValidAppSettingsState } from ".";

const initialState = {};

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
  // replace unsual, but valid symbols with common ones
  text = text.replaceAll(unusualApostrophe, "'");

  const invalidInput = validateCSVSheet(text);
  // TODO: check csv contains correct headers
  // TODO: check csv column contains expected datatypes

  if (invalidInput.size > 0) {
    return Promise.reject(
      new Error("CSV contains invalid characters", {
        cause: {
          code: CSVErrorCause.BadFileContent,
          details: invalidInput,
          sheetName,
        },
      })
    );
  }

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

/**
 * Settings text to json parser
 * @param text settings
 * @throws when text contains invalid characters or if json is malformed
 */
export function readJsonSettings(text: string) {
  try {
    const invalidInput = validateJSONSettings(text);

    if (invalidInput.size > 0) {
      return new Error("Settings contains invalid characters", {
        cause: {
          code: SettingsErrorCause.BadFileContent,
          details: invalidInput,
        },
      });
    }

    const settingsObject = JSON.parse(text) as Partial<AppSettingState>;
    if (!isValidAppSettingsState(settingsObject)) {
      return new Error("Unrecognized Settings", {
        cause: { code: SettingsErrorCause.InvalidSettings },
      });
    }

    return settingsObject;
  } catch {
    return new Error("Malformed JSON", {
      cause: { code: SettingsErrorCause.InvalidJSONStructure },
    });
  }
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

  const sheets = [
    workbookSheetNames.phrases.prettyName,
    workbookSheetNames.vocabulary.prettyName,
    workbookSheetNames.kanji.prettyName,
  ];

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
