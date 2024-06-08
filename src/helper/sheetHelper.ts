import { getLastCellIdx } from "@nmemonica/snservice/src/helper/sheetHelper";
import type Spreadsheet from "@nmemonica/x-spreadsheet";
import { SheetData } from "@nmemonica/x-spreadsheet";

export function getActiveSheet(workbook: Spreadsheet) {
  // TODO: fix SpreadSheet.getData type
  const sheets = workbook.exportValues() as SheetData[];

  const activeSheetName: string = workbook.bottombar.activeEl.el.innerHTML;
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
  if (!sheet.rows || !rows) {
    return sheet;
  }

  const clone = { ...sheet, rows };

  let last = getLastCellIdx(sheet.rows);

  while (
    Object.values(sheet.rows[last].cells).every(
      (cell) => cell.text === undefined || cell.text.length === 0 || cell.text.trim() === ""
    )
  ) {
    delete clone.rows[last];
    // @ts-expect-error SheetData.rows.len
    clone.rows.len -= 1;

    last = getLastCellIdx(clone.rows);
  }

  return clone;
}

export function addExtraRow(xObj: SheetData[]) {
  const extraAdded = xObj.reduce<SheetData[]>((acc, o) => {
    let rows = o.rows;
    if (!rows) {
      return [...acc, { rows: { "0": { cells: {} } }, len: 1 }];
    }

    const last = getLastCellIdx(rows);

    const n = {
      ...o,
      rows: {
        ...rows,
        [String(last + 1)]: { cells: {} },
        // @ts-expect-error SheetData.rows.len
        len: rows.len + 1,
      },
    };

    return [...acc, n];
  }, []);

  return extraAdded;
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
