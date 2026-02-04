import EventEmitter from "events";

import { type SheetData, type Spreadsheet } from "@nmemonica/x-spreadsheet";
import type { RowData } from "@nmemonica/x-spreadsheet/dist/types/core/row";
import type DataProxy from "@nmemonica/x-spreadsheet/types/core/data_proxy";
import { MetaDataObj } from "nmemonica";

import { isNumber } from "./arrayHelper";
import { objectToCSV } from "./csvHelper";
import { jtox } from "./jsonHelper";
import { getLastCellIdx } from "./sheetHelperImport";
import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
} from "../../pwa/helper/idbHelper";
import { AppDispatch } from "../slices";
import {
  clearKanji,
  batchRepetitionUpdate as kanjiBatchMetaUpdate,
} from "../slices/kanjiSlice";
import { clearOpposites } from "../slices/oppositeSlice";
import { clearParticleGame } from "../slices/particleSlice";
import {
  clearPhrases,
  batchRepetitionUpdate as phraseBatchMetaUpdate,
} from "../slices/phraseSlice";
import { deleteMetadata } from "../slices/settingHelper";
import {
  clearVocabulary,
  batchRepetitionUpdate as vocabularyBatchMetaUpdate,
} from "../slices/vocabularySlice";

/**
 * Dataset names
 */
export const dataSetNames = ["phrases", "vocabulary", "kanji"] as const;

/**
 * Keep all naming and order
 */
export const workbookSheetNames = Object.freeze({
  [dataSetNames[0]]: {
    index: 0,
    fileName: "Phrases.csv",
    prettyName: "Phrases",
  },
  [dataSetNames[1]]: {
    index: 1,
    fileName: "Vocabulary.csv",
    prettyName: "Vocabulary",
  },
  [dataSetNames[2]]: { index: 2, fileName: "Kanji.csv", prettyName: "Kanji" },
});

export const metaDataNames = Object.freeze({
  settings: { fileName: "Settings.json", prettyName: "Settings" },
  progress: { fileName: "Progress.json", prettyName: "Progress" },
});

/**
 * Take a DataProxy and build a SheetData
 */
export function dataProxyToSheet(proxy: DataProxy) {
  const sheet = {
    name: proxy.name,
    rows: {
      ...proxy.rows._,
      len: Object.keys(proxy.rows._).length,
    },
  } as SheetData;

  return sheet;
}

export function getActiveSheet(workbook: Spreadsheet) {
  const activeSheetName = workbook.bottombar?.activeEl?.el.innerHTML;
  if (activeSheetName === undefined || activeSheetName.trim() === "") {
    throw new Error("Expected Sheet name");
  }

  return activeSheetName;
}

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 *
 * @param required List of required sheets in workbook. Any missing are created (placeholders).
 */
export function getWorkbookFromIndexDB(
  required?: (keyof typeof workbookSheetNames)[]
) {
  return openIDB()
    .then((db) => {
      // if indexedDB has stored workbook
      const stores = Array.from(db.objectStoreNames);

      const ErrorWorkbookMissing = new Error("Workbook not stored", {
        cause: { code: IDBErrorCause.NoResult },
      });
      if (!stores.includes(IDBStores.WORKBOOK)) {
        throw ErrorWorkbookMissing;
      }

      // use stored workbook
      return getIDBItem({ db, store: IDBStores.WORKBOOK }, "0").then((res) => {
        if (!(IDBStores.WORKBOOK in res) || res.workbook.length === 0) {
          throw ErrorWorkbookMissing;
        }

        required?.forEach((sheetName) => {
          const sheet = res.workbook.find(
            (s) =>
              s.name.toLowerCase() ===
              workbookSheetNames[sheetName].prettyName.toLowerCase()
          );
          if (sheet === undefined) {
            // insert an empty required sheet
            res.workbook.push(
              jtox(
                {
                  /** no data just headers */
                },
                workbookSheetNames[sheetName].prettyName
              )
            );
          }
        });

        return res.workbook;
      });
    })
    .catch(() => {
      return [
        jtox(
          {
            /** no data just headers */
          },
          workbookSheetNames.phrases.prettyName
        ),
        jtox(
          {
            /** no data just headers */
          },
          workbookSheetNames.vocabulary.prettyName
        ),
        jtox(
          {
            /** no data just headers */
          },
          workbookSheetNames.kanji.prettyName
        ),
      ];
    });
}

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 */
export function getSheetFromIndexDB(
  sheetName: keyof typeof workbookSheetNames
) {
  return getWorkbookFromIndexDB().then((workbook) => {
    const sheet = workbook.find(
      (s) =>
        s.name.toLowerCase() ===
        workbookSheetNames[sheetName].prettyName.toLowerCase()
    );
    if (sheet === undefined) {
      throw new Error(`Expected to find ${sheetName} sheet in workbook`);
    }
    return sheet;
  });
}

/**
 * Parse xObject into csv text
 */
export function xObjectToCsvText(xObj: SheetData[]) {
  //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_files

  const filesP = xObj.map((xObjSheet: SheetData) => {
    const fileSim = new EventEmitter();

    const fileWriterSimulator = {
      write: (line: string) => {
        fileSim.emit("write", line);
      },
      end: () => {
        fileSim.emit("end");
      },
    };

    const csvP = new Promise<{ name: string; text: string; len: number }>(
      (resolve, _reject) => {
        let file = "";
        fileSim.on("write", (line) => {
          file += line;
        });

        fileSim.on("end", () => {
          resolve({
            name: xObjSheet.name,
            text: file,
            len: xObjSheet.rows?.len ?? 0,
          });
        });
      }
    );

    objectToCSV(xObjSheet, fileWriterSimulator);

    return csvP;
  });

  return Promise.all(filesP);
}

/**
 * Removes empty rows at the end of a sheet
 * @param sheet A workbook sheet
 */
export function removeLastRowIfBlank<T extends SheetData>(sheet: T) {
  const rows = sheet.rows;
  if (!sheet.rows || !rows || rows.len === 0) {
    return sheet;
  }

  const clone = { ...sheet, rows };

  const calcLength = Object.keys(clone.rows).filter((r) => isNumber(r)).length;
  if (clone.rows.len === undefined || clone.rows.len !== calcLength) {
    // len mismatched
    // fix it here
    clone.rows.len = calcLength;
  }

  let last = getLastCellIdx(sheet.rows);

  while (
    Object.values(sheet.rows[last].cells).every(
      (cell) =>
        cell.text === undefined ||
        cell.text.length === 0 ||
        cell.text.trim() === ""
    )
  ) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete clone.rows[last];
    clone.rows.len -= 1;

    last = getLastCellIdx(clone.rows);
  }

  return clone;
}

/**
 * Appends an empty row to a sheet
 * @param sheet
 */
export function sheetAddExtraRow(sheet: SheetData): SheetData {
  let rows = sheet.rows;
  if (!rows) {
    const name = sheet.name ?? "sheet";
    return {
      name,
      rows: { "0": { cells: {} }, len: 1 },
      autofilter: { ref: null, filters: [], sort: null },
    };
  }

  const last = getLastCellIdx(rows);

  const withExtraRow = {
    ...sheet,
    rows: {
      ...rows,
      [String(last + 1)]: { cells: {} },
      // @ts-expect-error SheetData.rows.len
      len: rows.len + 1,
    },
  };

  return withExtraRow;
}

export function searchInSheet(
  sheet: SheetData,
  query: string
): { ri: number; ci: number; text: string }[] {
  if (!sheet.rows) {
    return [];
  }

  const result = Object.values(sheet.rows).reduce<
    { ri: number; ci: number; text: string }[]
  >((acc, row: RowData, y) => {
    if (typeof row !== "number" && "cells" in row) {
      const find = Object.keys(row.cells).find((c) => {
        const { text } = row.cells[Number(c)];
        if (text === undefined) {
          return false;
        }
        return text.toLowerCase().includes(query.toLowerCase());
      });
      if (find === undefined) return acc;

      const text = row.cells[Number(find)].text;
      if (text === undefined) return acc;

      const x = Number(find);
      acc = [...acc, { ri: y, ci: x, text }];
    }

    return acc;
  }, []);

  return result;
}

/**
 * Validate a sheet cell by cell with a validator function
 * @param sheet
 * @param validator
 */
export function validateInSheet(
  sheet: SheetData,
  validator: (text: string) => Set<unknown>
): { ri: number; ci: number; invalid: Set<unknown> }[] {
  if (!sheet.rows) {
    return [];
  }

  const result = Object.values(sheet.rows).reduce<
    { ri: number; ci: number; invalid: Set<unknown> }[]
  >((acc, row: RowData, y) => {
    if (typeof row !== "number" && "cells" in row) {
      const failedCells = Object.keys(row.cells).reduce<
        { ri: number; ci: number; invalid: Set<unknown> }[]
      >((acc, c) => {
        const x = Number(c);
        const { text } = row.cells[x];
        if (text !== undefined) {
          const invalid = validator(text);
          if (invalid.size > 0) {
            return [...acc, { ri: y, ci: x, invalid }];
          }
        }
        return acc;
      }, []);

      acc = [...acc, ...failedCells];
    }

    return acc;
  }, []);

  return result;
}

/**
 * Finds which row contains the query given a column index
 */
export function findInColumn(sheet: SheetData, column: number, query: string) {
  if (!sheet.rows) {
    return [];
  }

  const result = Object.values(sheet.rows).reduce<[number, number, string][]>(
    (acc, row: RowData, rowIdx) => {
      if (
        typeof row !== "number" &&
        "cells" in row &&
        row.cells[column] !== undefined &&
        "text" in row.cells[column]
      ) {
        const { text } = row.cells[column];
        return text === query ? [...acc, [rowIdx, column, query]] : acc;
      }

      return acc;
    },
    []
  );

  return result;
}

/**
 * Finds which column contains the query given a row index
 */
export function findInRow(sheet: SheetData, row: number, query: string) {
  if (!sheet.rows) {
    return [];
  }

  const r = { ...sheet.rows[row] };
  if (r === undefined || !("cells" in r)) {
    return [];
  }
  const { cells } = r;
  const result = Object.keys(cells).reduce<[number, number, string][]>(
    (acc, colIdx) => {
      if (cells[colIdx] !== undefined && "text" in cells[colIdx]) {
        const { text } = cells[colIdx];
        return text === query ? [...acc, [row, Number(colIdx), query]] : acc;
      }
      return acc;
    },
    []
  );

  return result;
}

/**
 * Check if device has touch screen
 * [MDN mobile detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent)
 * @returns
 */
export function touchScreenCheck() {
  let hasTouchScreen = false;

  if (
    "maxTouchPoints" in navigator &&
    typeof navigator.maxTouchPoints === "number"
  ) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if (
    "msMaxTouchPoints" in navigator &&
    typeof navigator.msMaxTouchPoints === "number"
  ) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    const mQ = matchMedia?.("(pointer:coarse)");
    if (mQ?.media === "(pointer:coarse)") {
      hasTouchScreen = Boolean(mQ.matches);
    } else if ("orientation" in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      const UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}

/**
 * TODO: This file is separated from sheetHelper.ts because it does not depend
 * on imports which break test due to esm + ts-node + mocha
 */

/**
 * Update the metadata of a record that is edited and uid changed
 * @param meta Record of MetaDataObj
 * @param oldList of terms
 * @param newList of terms
 * @returns a metadata record with updated uids
 */
export function updateEditedUID<T extends { uid: string; english: string }>(
  meta: Record<string, MetaDataObj | undefined>,
  oldList: T[],
  newList: T[]
) {
  const prevVocab = new Map(oldList.map((v) => [v.uid, v]));
  const currVocab = new Map<string, (typeof newList)[number]>(
    newList.map((v) => [v.uid, v])
  );
  const currEnglish = new Map<string, string>(
    newList.map((v) => [v.english, v.uid])
  );

  let updatedMeta = {
    ...meta,
  };

  const changed: [string, string][] = [];

  prevVocab.forEach((v) => {
    const uidMeta = meta[v.uid];
    if (
      uidMeta !== undefined && //     old has metadata
      !currVocab.has(v.uid) && //     can't find uid in new data
      currEnglish.has(v.english) //   found english match in new data
    ) {
      const engMatchOld = oldList.filter((n) => n.english === v.english);
      const engMatchNew = newList.filter((n) => n.english === v.english);

      if (
        engMatchNew.length === 1 &&
        engMatchNew.length === engMatchOld.length
      ) {
        // simple case
        const uid = currEnglish.get(v.english);
        if (uid === undefined) {
          throw new Error("Expected uid");
        }

        const oldmeta = { ...uidMeta };

        updatedMeta = {
          ...deleteMetadata([v.uid], updatedMeta).record,
          [uid]: oldmeta,
        };
        changed.push([v.uid, uid]);
      } else if (engMatchNew.length === engMatchOld.length) {
        // mult-match case

        const unmatchedOld = engMatchOld.filter(
          (o) => engMatchNew.find((n) => o.uid === n.uid) === undefined
        );

        const unmatchedNew = engMatchNew.filter(
          (o) => engMatchOld.find((n) => o.uid === n.uid) === undefined
        );

        if (unmatchedOld.length === 1 && unmatchedNew.length === 1) {
          const [oldrecord] = unmatchedOld;
          const [newrecord] = unmatchedNew;

          const oldmeta = { ...uidMeta };

          updatedMeta = {
            ...deleteMetadata([oldrecord.uid], updatedMeta).record,
            [newrecord.uid]: oldmeta,
          };
          changed.push([oldrecord.uid, newrecord.uid]);
        } else {
          // TODO: ask user if this is an individual update?
        }
      }
    }
  });

  return { updatedMeta, changedUID: changed };
}

/*
 * Toggles a tag for a term in a sheet (modifies workbook)
 * @param sheet Sheet to search in
 * @param query A search query to match on
 * @param tag Tag to toggle
 */
export function setTagsFromSheet(sheet: SheetData, query: string, tag: string) {
  const rHeaderJapanese = findInRow(sheet, 0, "Japanese");
  const rHeaderTag = findInRow(sheet, 0, "Tags");
  if (rHeaderJapanese.length !== 1 || rHeaderTag.length !== 1) {
    throw new Error("Missing headers");
  }
  const [_jRow, japaneseCol] = rHeaderJapanese[0];
  const [_tRow, tagCol] = rHeaderTag[0];

  const rTerm = findInColumn(sheet, japaneseCol, query);
  if (rTerm.length !== 1) {
    throw new Error(`Expected to find this term ${query}`);
  }
  const [termRow] = rTerm[0];
  if (sheet.rows === undefined) {
    throw new Error("Expected a row for query result");
  }

  const prevTags = parseTagColumn(sheet, termRow, tagCol);

  // Edit tags
  const lCaseTag = tag.toLowerCase();
  const newTags = {
    tags: prevTags.tags.includes(lCaseTag)
      ? prevTags.tags.filter((t) => t !== lCaseTag)
      : [...prevTags.tags, lCaseTag],
  };

  // avoid adding empty arrays to tag column
  const pCount = Object.keys(prevTags)
    .filter((p) => p !== "tags")
    .reduce((acc, k) => acc + prevTags[k].length, 0);
  const nCount = newTags.tags.length;
  const newTagContent = {
    ...(pCount > 0 ? prevTags : {}),
    ...(nCount > 0 ? newTags : {}),
  };

  sheet.rows[termRow].cells = {
    ...sheet.rows[termRow].cells,
    [tagCol]: {
      text:
        pCount > 0 || nCount > 0 ? JSON.stringify(newTagContent) : undefined,
    },
  };

  return sheet;
}
/**
 * Searches for a term in a sheet returns a parsed tag object
 * @param sheet Sheet to search in
 * @param query A search query to match on
 */
export function getTagsFromSheet(sheet: SheetData, query: string) {
  const rHeaderJapanese = findInRow(sheet, 0, "Japanese");
  const rHeaderTag = findInRow(sheet, 0, "Tags");
  if (rHeaderJapanese.length !== 1 || rHeaderTag.length !== 1) {
    throw new Error("Missing headers");
  }
  const [_jRow, japaneseCol] = rHeaderJapanese[0];
  const [_tRow, tagCol] = rHeaderTag[0];

  const rTerm = findInColumn(sheet, japaneseCol, query);
  if (rTerm.length !== 1) {
    throw new Error(`Expected to find this term ${query}`);
  }
  const [termRow] = rTerm[0];
  if (sheet.rows === undefined) {
    throw new Error("Expected a row for query result");
  }

  const prevTags = parseTagColumn(sheet, termRow, tagCol);

  return prevTags.tags;
}

/**
 * Parses the tag column of a specified row
 * @param s
 * @param termRow The index of the specified row
 * @param tagCol The index of the 'Tags' column
 */
function parseTagColumn(s: SheetData, termRow: number, tagCol: number) {
  if (s.rows === undefined) {
    throw new Error("Expected a row for query result");
  }

  let prevTags: Record<string, string[]>;
  if (
    "cells" in s.rows[termRow] &&
    s.rows[termRow].cells[tagCol] !== undefined
  ) {
    try {
      prevTags = { tags: [] };

      if (
        s.rows[termRow] !== undefined &&
        "cells" in s.rows[termRow] &&
        s.rows[termRow].cells[tagCol] !== undefined &&
        "text" in s.rows[termRow].cells[tagCol]
      ) {
        const { text } = s.rows[termRow].cells[tagCol];
        prevTags =
          text !== undefined
            ? (JSON.parse(text.trim()) as Record<string, string[]>)
            : { tags: [] };
      }
    } catch {
      throw new Error("Failed to parse tags from sheet cell");
    }
  } else {
    prevTags = { tags: [] };
  }

  return prevTags;
}

/**
 * Updates app state with incoming dataset
 * Updates metadata with incoming metadata
 * @param name name of DataSet
 * @param metaUpdateUids Record containing updated uids
 */
export function updateStateAfterWorkbookEdit(
  dispatch: AppDispatch,
  name: string,
  metaUpdatedUids?: Record<string, MetaDataObj | undefined>
) {
  switch (name) {
    case workbookSheetNames.kanji.prettyName:
      dispatch(clearKanji());
      if (metaUpdatedUids) {
        void dispatch(kanjiBatchMetaUpdate(metaUpdatedUids));
      }
      break;
    case workbookSheetNames.vocabulary.prettyName:
      dispatch(clearVocabulary());
      dispatch(clearOpposites());
      if (metaUpdatedUids) {
        void dispatch(vocabularyBatchMetaUpdate(metaUpdatedUids));
      }
      break;
    case workbookSheetNames.phrases.prettyName:
      dispatch(clearPhrases());
      dispatch(clearParticleGame());
      if (metaUpdatedUids) {
        void dispatch(phraseBatchMetaUpdate(metaUpdatedUids));
      }
      break;
    default:
      throw new Error("Incorrect sheet name: " + name);
  }
}
