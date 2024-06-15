import EventEmitter from "events";

import { type SheetData, type Spreadsheet } from "@nmemonica/x-spreadsheet";
import { RowData } from "@nmemonica/x-spreadsheet/dist/types/core/row";
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
import { deleteMetadata } from "../slices/settingHelper";

/**
 * Keep all naming and order
 */
export const workbookSheetNames = Object.freeze({
  phrases: { index: 0, file: "Phrases.csv", prettyName: "Phrases" },
  vocabulary: { index: 1, file: "Vocabulary.csv", prettyName: "Vocabulary" },
  kanji: { index: 2, file: "Kanji.csv", prettyName: "Kanji" },
});

export const metaDataNames = Object.freeze({
  settings: { file: "Settings.json", prettyName: "Settings" },
});

export function getActiveSheet(workbook: Spreadsheet) {
  const sheets = workbook.exportValues();

  if (sheets.length === 1) {
    const name = sheets[0].name;
    const data = removeLastRowIfBlank(sheets[0]);

    return { activeSheetName: name, activeSheetData: data };
  }

  const activeSheetName = workbook.bottombar?.activeEl?.el.innerHTML;
  if (activeSheetName === undefined) {
    throw new Error("Expected Sheet name");
  }
  const activeSheetData =
    sheets.find((sheet) => sheet.name === activeSheetName) ?? sheets[0];

  const data = removeLastRowIfBlank(activeSheetData);

  return { activeSheetName, activeSheetData: data };
}

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 *
 * @param dispatch
 * @param getDatasets fetch action (if no indexedDB)
 */
export function getWorkbookFromIndexDB() {
  return openIDB()
    .then((db) => {
      // if indexedDB has stored workbook
      const stores = Array.from(db.objectStoreNames);

      const ErrorWorkbookMissing = new Error("Workbook not stored", {
        cause: { code: IDBErrorCause.NoResult },
      });
      if (!stores.includes("workbook")) {
        throw ErrorWorkbookMissing;
      }

      // use stored workbook
      return getIDBItem({ db, store: IDBStores.WORKBOOK }, "0").then((res) => {
        if (!res.workbook || res.workbook.length === 0) {
          throw ErrorWorkbookMissing;
        }

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

    const csvP = new Promise<{ name: string; text: string }>(
      (resolve, _reject) => {
        let file = "";
        fileSim.on("write", (line) => {
          file += line;
        });

        fileSim.on("end", () => {
          resolve({ name: xObjSheet.name, text: file });
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

export function searchInSheet(sheet: SheetData, query: string) {
  if (!sheet.rows) {
    return [];
  }

  const result = Object.values(sheet.rows).reduce<[number, number, string][]>(
    (acc, row: RowData, x) => {
      if (typeof row !== "number" && "cells" in row) {
        const find = Object.keys(row.cells).find((c) =>
          row.cells[Number(c)].text?.toLowerCase().includes(query.toLowerCase())
        );
        if (find === undefined) return acc;

        const text = row.cells[Number(find)].text;
        if (text === undefined) return acc;

        const y = Number(find);
        acc = [...acc, [x, y, text]];
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
