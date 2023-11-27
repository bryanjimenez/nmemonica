import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { readXLSX, writeXSheet, readXSheet } from "./helper/sheetJSHelper.js";
import { multipart } from "./helper/multipart.js";
import { CSV_DIR } from "./index.js";
import type { SheetData } from "./helper/firebaseParse.js";

const XLSX_FILE = "Nmemonica.xlsx";

const fileType: string = ".csv"; //".xlsx";
const sheetNames = ["Phrases", "Vocabulary", "Kanji"];

export function getWorkbookXS(req: Request, res: Response) {
  let xSheetObj;
  switch (fileType) {
    case ".xlsx": {
      throw new Error("FIXME: hardcoded range in readXLSX");
      const file = fs.readFileSync(`${CSV_DIR}/${XLSX_FILE}`);
      xSheetObj = readXLSX(file);
      break;
    }
    default: /** CSV */ {
      //@ts-expect-error
      xSheetObj = sheetNames.reduce((acc, sheet) => {
        const file = fs.readFileSync(path.normalize(`${CSV_DIR}/${sheet}.csv`));
        const [cellArr] = readXSheet(file);
        cellArr.name = sheet;

        return [...acc, cellArr];
      }, []);
    }
  }

  return res.status(200).json({ xSheetObj });
}

export async function putWorkbookXS(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { sheetName, sheetData } = await multipart<SheetData[]>(req, next);
  switch (fileType) {
    case ".xlsx": {
      // FIXME: will override other sheets in wb!
      throw new Error("FIXME: will override other sheets in wb!");
      // write(`${WRITE_DIR}${XLSX_FILE}`, xSheetObj);
      break;
    }
    default:
      /** CSV */ {
        const t = new Date().toJSON();

        const backup = path.normalize(`${CSV_DIR}/backup/CSV-${t}`);
        // backup files
        if (!fs.existsSync(backup)) {
          fs.mkdirSync(backup, { recursive: true });
        }
        writeXSheet(`${backup}/${sheetName}.csv`, sheetData);

        // working files
        writeXSheet(path.normalize(`${CSV_DIR}/${sheetName}.csv`), sheetData);
      }

      res.sendStatus(200);
  }
}
