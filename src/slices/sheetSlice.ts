import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getKanji } from "./kanjiSlice";
import { getPhrase } from "./phraseSlice";
import { getVocabulary } from "./vocabularySlice";
import {
  FileErrorCause,
  JSONErrorCause,
  csvToObject,
  validateCSVSheet,
  validateJSONSettings,
} from "../helper/csvHelper";
import { jtox, sheetDataToJSON } from "../helper/jsonHelper";
import { metaDataNames, workbookSheetNames } from "../helper/sheetHelper";
import { type FilledSheetData } from "../helper/sheetHelperImport";
import { unusualApostrophe } from "../helper/unicodeHelper";

import {
  AppDispatch,
  type AppProgressState,
  type AppSettingState,
  isValidAppSettingsState,
  isValidStudyProgress,
} from ".";

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

  if (invalidInput.size > 0) {
    return Promise.reject(
      new Error("CSV contains invalid characters", {
        cause: {
          code: FileErrorCause.InvalidCharacters,
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

  return objP.then((sheet) => {
    sheetDataToJSON(sheet);
    // TODO: check csv column contains expected datatypes
    return sheet;
  });
}

/**
 * Settings text to object parser
 * @param jsonText settings in json format
 * @throws when text contains invalid characters or if json is malformed
 */
export function readSettings(jsonText: string) {
  try {
    const invalidInput = validateJSONSettings(jsonText);

    if (invalidInput.size > 0) {
      return new Error("Settings contains invalid characters", {
        cause: {
          code: FileErrorCause.InvalidCharacters,
          details: invalidInput,
        },
      });
    }

    const settingsObject = JSON.parse(jsonText) as Partial<AppSettingState>;
    if (!isValidAppSettingsState(settingsObject)) {
      return new Error(
        `Unrecognized settings in ${metaDataNames.settings.prettyName}`,
        {
          cause: {
            code: FileErrorCause.InvalidContents,
            details: metaDataNames.settings.prettyName,
          },
        }
      );
    }

    return settingsObject;
  } catch {
    return new Error(`Malformed JSON ${metaDataNames.settings.prettyName}`, {
      cause: { code: JSONErrorCause.InvalidJSONStructure },
    });
  }
}

/**
 * Study Progress text to object parser
 * @param jsonText study progress in json format
 * @throws when text contains invalid characters or if json is malformed
 */
export function readStudyProgress(jsonText: string) {
  try {
    const invalidInput = validateJSONSettings(jsonText);

    if (invalidInput.size > 0) {
      return new Error("Progress contains invalid characters", {
        cause: {
          code: FileErrorCause.InvalidCharacters,
          details: invalidInput,
        },
      });
    }

    const studyProgressObject = JSON.parse(
      jsonText
    ) as Partial<AppProgressState>;
    if (!isValidStudyProgress(studyProgressObject)) {
      return new Error(
        `Unrecognized values in ${metaDataNames.progress.prettyName}`,
        {
          cause: {
            code: FileErrorCause.InvalidContents,
            details: metaDataNames.progress.prettyName,
          },
        }
      );
    }

    return studyProgressObject;
  } catch {
    return new Error(`Malformed JSON ${metaDataNames.progress.prettyName}`, {
      cause: { code: JSONErrorCause.InvalidJSONStructure },
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
