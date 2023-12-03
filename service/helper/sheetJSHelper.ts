// @deno-types="https://deno.land/x/sheetjs@v0.18.3/types/index.d.ts"
// import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";
import fs from "fs";
import { read as XLSX_read, writeFile as XLSX_writeFile, set_fs } from "xlsx";
import { stox, xtos } from "./xSpreadSheetParse.js";
import type { SheetData } from "./firebaseParse.js";

export function readXLSX(file: unknown) {
  const wb = XLSX_read(file);

  // Kanji!A1:G577
  // Phrases!A1:H1007
  // Vocabulary!A1:H2072

  // export const xSheetObj = stox(wb, ["Vocabulary", "Phrases","Kanji"], ["A1:H3000","A1:H1000","A1:G300"]);
  const xSheetObj = stox(wb, [
    "Vocabulary!A1:H2072",
    "Phrases!A1:H1007",
    "Kanji!A1:G577",
  ]);

  return xSheetObj;
}

/**
 * XLSX read csv file
 * returns array of cells [number, number, string][] and count of rows
 */
export function readXSheet(file: unknown) {
  const wb = XLSX_read(file);
  return stox(wb);
}

/**
 * XLSX write csv file
 */
export function writeXSheet(filename: string, xSheetObj: SheetData[]) {
  // FIXME: set_fs for sheetJS
  // pass fs into sheetJS
  set_fs(fs);
  const wb = xtos(xSheetObj);
  XLSX_writeFile(wb, filename, { compression: true });
}
