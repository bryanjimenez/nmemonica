import { type SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getWorkbookFromIndexDB,
  setWorkbookFromIndexDB,
} from "./indexedDBSlice";
import { csvToObject } from "../helper/csvHelper";
import { sheetDataToJSON } from "../helper/jsonHelper";
import {
  removeLastRowIfBlank,
  updateEditedUID,
  workbookSheetNames,
} from "../helper/sheetHelper";
import { updateStateAfterWorkbookEdit } from "../helper/sheetHelperExtras";
import {
  type FilledSheetData,
  isFilledSheetData,
} from "../helper/sheetHelperImport";
import type { AppDispatch, RootState } from "../typings/slices";

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
 * @see [readCsvToSheet](../helper/transferHelper.ts)
 * @param text whole csv text file
 * @param sheetName name of sheet
 */
export function readCsvToSheet_INTERNAL(text: string, sheetName: string) {
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

export const saveSheet = createAsyncThunk(
  "sheet/saveSheet",
  (
    arg: {
      activeSheetName: string;
      workbook: SheetData[];
    },
    thunkAPI
  ) => {
    const { activeSheetName, workbook } = arg;
    const trimmed = workbook.map((w) => removeLastRowIfBlank(w));

    const sheet = workbook.find((s) => s.name === activeSheetName);
    if (!sheet || !isFilledSheetData(sheet)) {
      throw new Error("No Worksheet");
    }

    const dispatch = thunkAPI.dispatch as AppDispatch;

    const state = thunkAPI.getState() as RootState;
    const phraseList = state.phrases.value;
    const vocabList = state.vocabulary.value;
    const kanjiList = state.kanji.value;

    const pMeta = state.phrases.metadata;
    const vMeta = state.vocabulary.metadata;
    const kMeta = state.kanji.metadata;

    // update metadata for existing, but edited records (uid)
    const name = sheet.name as keyof typeof selectedData;
    const selectedData = {
      Phrases: {
        meta: pMeta,
        list: phraseList,
      },
      Vocabulary: {
        meta: vMeta,
        list: vocabList,
      },
      Kanji: {
        meta: kMeta,
        list: kanjiList,
      },
    };
    const { meta, list: oldList } = selectedData[name];
    const { data } = sheetDataToJSON(sheet) as {
      data: Record<string, { uid: string; english: string }>;
    };

    const newList: { uid: string; english: string }[] = Object.keys(data).map(
      (k) => ({ uid: k, english: data[k].english })
    );
    const { updatedMeta: metaUpdatedUids } = updateEditedUID(
      meta,
      oldList,
      newList
    );

    // store workbook in indexedDB
    // (keep ordering and notes)
    void dispatch(setWorkbookFromIndexDB(trimmed))
      .unwrap()
      .then(() => {
        updateStateAfterWorkbookEdit(dispatch, name, metaUpdatedUids);
      });
  }
);

export const importWorkbook = createAsyncThunk(
  "sheet/importWorkbook",
  async (workbook: FilledSheetData[], thunkAPI) => {
    const dispatch = thunkAPI.dispatch as AppDispatch;

    const allSheetRequired = Object.keys(workbookSheetNames).map(
      (k) => k as keyof typeof workbookSheetNames
    );
    const workbookP = thunkAPI
      .dispatch(getWorkbookFromIndexDB(allSheetRequired))
      .unwrap()
      .then((dbWorkbook) => {
        const trimmed = Object.values(workbookSheetNames).map((w) => {
          const { prettyName: prettyName } = w;

          const fileSheet = workbook.find(
            (d) => d.name.toLowerCase() === prettyName.toLowerCase()
          );
          if (fileSheet) {
            return removeLastRowIfBlank(fileSheet);
          }

          // dbWorkbook guarantees to contain sheet
          const dbSheetIdx = dbWorkbook.findIndex(
            (d) => d.name.toLowerCase() === prettyName.toLowerCase()
          );
          // keep existing or blank placeholder
          return dbWorkbook[dbSheetIdx];
        });

        // store workbook in indexedDB
        // update cached json objects
        return dispatch(setWorkbookFromIndexDB(trimmed))
          .unwrap()
          .then(() => {
            // reload workbook (update useEffect)
            // setWorkbookImported(Date.now());

            trimmed.forEach((sheet) => {
              updateStateAfterWorkbookEdit(dispatch, sheet.name);
            });

            return;
          });
      });

    return workbookP;
  }
);

const sheetSlice = createSlice({
  name: "sheet",
  initialState,
  reducers: {},
});

export const {} = sheetSlice.actions;
export default sheetSlice.reducer;
