import { getLastCellIdx } from "@nmemonica/snservice/src/helper/sheetHelper";
import { type SheetData, type Spreadsheet } from "@nmemonica/x-spreadsheet";

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
 * Removes empty rows at the end of a sheet
 * @param sheet A workbook sheet
 */
export function removeLastRowIfBlank<T extends SheetData>(sheet: T) {
  const rows = sheet.rows;
  if (!sheet.rows || !rows || rows.len === 0) {
    return sheet;
  }

  const clone = { ...sheet, rows };

  if (clone.rows.len === undefined) {
    // TODO: set row length?
    throw new Error("Expected row length");
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
    return { name, rows: { "0": { cells: {} }, len: 1 }, autofilter: {} };
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
    (acc, row, x) => {
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
