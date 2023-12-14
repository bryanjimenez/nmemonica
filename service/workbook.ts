import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { csvToObject, objectToCsv } from "./helper/csvHelper.js";
import { multipart } from "./helper/multipart.js";
import { CSV_DIR } from "./index.js";
import type { SheetData } from "./helper/jsonHelper.js";
import { sheetDataToJSON, updateDataAndCache } from "./data.js";

const _XLSX_FILE = "Nmemonica.xlsx";

const fileType: string = ".csv"; //".xlsx";
const sheetNames = ["Phrases", "Vocabulary", "Kanji"];

export function getWorkbookXS(req: Request, res: Response, next: NextFunction) {
  let xSheetObj: Promise<SheetData>[];
  switch (fileType) {
    case ".xlsx": {
      // FIXME: hardcoded range in readXLSX
      throw new Error("Incomplete: hardcoded range in readXLSX");
      // const file = fs.readFileSync(`${CSV_DIR}/${XLSX_FILE}`);
      // xSheetObj = readXLSX(file);
      // break;
    }
    default: /** CSV */ {
<<<<<<< HEAD
      xSheetObj = sheetNames.reduce<WorkSheet[]>((acc, sheet) => {
        const file = fs.readFileSync(path.normalize(`${CSV_DIR}/${sheet}.csv`));
        const [cellArr] = readXSheet(file);
        cellArr.name = sheet;
=======
      xSheetObj = sheetNames.reduce<Promise<SheetData>[]>((acc, sheet) => {
        const filePath = path.normalize(`${CSV_DIR}/${sheet}.csv`);
>>>>>>> bac981d (remove dependency xlsx)

        return [...acc, csvToObject(filePath, { name: sheet })];
      }, []);
    }
  }

  Promise.all(xSheetObj)
    .then((vals) => {
      res.status(200).json({ xSheetObj: vals });
    })
    .catch(next);
}

export async function putWorkbookXSAsync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sheetData } = await multipart<SheetData>(req, next);
    let h;
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

          const { data, hash } = sheetDataToJSON(sheetData);

          objectToCsv(`${backup}/${sheetData.name}.csv`, sheetData);

          // working files
          objectToCsv(
            path.normalize(`${CSV_DIR}/${sheetData.name}.csv`),
            sheetData
          );
          const resourceName = sheetData.name.toLowerCase();
          const updateP = updateDataAndCache(resourceName, data, hash);

          updateP.catch(next);
          h = hash;
        }

        res.status(200).json({ hash: h });
    }
  } catch (e) {
    next(e);
  }
}
