import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { writeXSheet, readXSheet } from "./helper/sheetJSHelper.js";
import { multipart } from "./helper/multipart.js";
import { CSV_DIR } from "./index.js";
import type { SheetData } from "./helper/firebaseParse.js";
import { sheetDataToJSON, updateDataAndCache } from "./data.js";
import type { WorkSheet } from "xlsx";

const _XLSX_FILE = "Nmemonica.xlsx";

const fileType: string = ".csv"; //".xlsx";
const sheetNames = ["Phrases", "Vocabulary", "Kanji"];

export function getWorkbookXS(req: Request, res: Response) {
  let xSheetObj: WorkSheet[];
  switch (fileType) {
    case ".xlsx": {
      // FIXME: hardcoded range in readXLSX
      throw new Error("Incomplete: hardcoded range in readXLSX");
      // const file = fs.readFileSync(`${CSV_DIR}/${XLSX_FILE}`);
      // xSheetObj = readXLSX(file);
      // break;
    }
    default: /** CSV */ {
      xSheetObj = sheetNames.reduce<WorkSheet[]>((acc, sheet) => {
        const file = fs.readFileSync(path.normalize(`${CSV_DIR}/${sheet}.csv`));
        const [cellArr] = readXSheet(file);
        cellArr.name = sheet;

        return [...acc, cellArr];
      }, []);
    }
  }

  return res.status(200).json({ xSheetObj });
}

export async function putWorkbookXSAsync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sheetName, sheetData } = await multipart<SheetData[]>(req, next);
    switch (fileType) {
      case ".xlsx": {
        // FIXME: will override other sheets in wb!
        throw new Error("Incomplete: will override other sheets in wb!");
        // write(`${WRITE_DIR}${XLSX_FILE}`, xSheetObj);
        // break;
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
          const { data, hash } = sheetDataToJSON(sheetName, sheetData);
          // const dataString = JSON.stringify(data, null, 2);
          // fs.writeFile(`${JSON_DIR}/${sheetName}.json`,dataString, next);
          const resourceName = sheetName.toLowerCase();
          const updateP = updateDataAndCache(resourceName, data, hash);

          updateP.catch(next);
        }

        res.sendStatus(200);
    }
  } catch (e) {
    next(e);
  }
}
