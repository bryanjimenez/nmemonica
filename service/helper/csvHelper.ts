import fs from "node:fs";
import readline from "node:readline";
// import path from "node:path";
// import { fileURLToPath } from "node:url";

// from firebaseParse.ts
export interface Sheet {
  name: string;
  rows: { len: number } & Record<
    number,
    {
      cells: Record<string, { text?: string; merge?: [number, number] | null }>;
    }
  >;
  cols?: { len: number };
  validations?: unknown[];
  autofilter?: Record<string, unknown>;
  merges?: unknown[];
}

interface Options {
  delimiter?: string;
  name?: string;
}

/** Empty row only ,,, */
const noDataRegEx = new RegExp(/^,*$/);
/** Double quote replacement */
const doubleQuoteValue = '""';
const doubleQuoteToken = "\u0002";
const singleQuoteValue = '"';
const singleQuoteToken = '"';

export function csvToObject(
  csvPath: string,
  options?: Options
): Promise<Sheet> {
  const { delimiter = ",", name: nameOverride } = options ?? {};

  return new Promise((resolve, reject) => {
    try {
      const fileName = csvPath.slice(csvPath.lastIndexOf("/") + 1);
      const sheetName =
        nameOverride ?? fileName.slice(0, fileName.indexOf("."));
      const input = fs.createReadStream(csvPath, { encoding: "utf-8" });

      const lineReader = readline.createInterface({
        input,
        terminal: false,
      });

      let sheet: Sheet = { name: sheetName, rows: { len: 0 }, merges: [] };

      const csvLineToObjParser = csvLineToObjParserBuilder(
        sheetName,
        delimiter
      );

      lineReader.on("line", (line) => {
        sheet = csvLineToObjParser(line);
      });

      lineReader.on("close", () => {
        // console.log("\n")
        // console.log(sheet)
        resolve(sheet);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function objectToCsv(csvPath: string, object: Sheet, options?: Options) {
  objectToCSVInternal(object, csvPath, options);
}

function lineParser(line: string, delimiter: string) {
  let chunk = "";
  let insideStr = false;
  let acc = {};
  let x = 0;

  /** Replace all double quotes */
  const modifiedLine: string = line.replaceAll(
    doubleQuoteValue,
    doubleQuoteToken
  );

  modifiedLine.split("").forEach((token, i) => {
    switch (true) {
      case token === delimiter && !insideStr:
        {
          if (chunk.length > 0) {
            acc = { ...acc, [x]: { text: chunk } };
            chunk = "";
          }
          x++;
        }
        break;

      case token === delimiter && insideStr:
        chunk += token;
        break;

      case token === singleQuoteToken:
        insideStr = !insideStr;
        break;

      case token === doubleQuoteToken:
        chunk += singleQuoteValue;
        break;

      default:
        chunk += token;
        break;
    }

    // add last chunk
    if (i === modifiedLine.length - 1 && chunk !== "") {
      acc = { ...acc, [x]: { text: chunk } };
    }
  });

  return { cells: acc };
}

function csvLineToObjParserBuilder(sheetName: string, delimiter: string) {
  let sheet: Sheet = { name: sheetName, rows: { len: 0 }, merges: [] };

  let y = 0;
  let multiline = "";

  return function csvLineToObjParser(line: string) {
    let l = line;
    if (noDataRegEx.test(l)) {
      // no data skip row
      sheet.rows[y] = { cells: {} };
      y++;
      return sheet;
    }

    if (
      line.includes(singleQuoteToken) &&
      (line.split(singleQuoteToken).length + 1) % 2 !== 0 &&
      multiline === ""
    ) {
      // start

      multiline += l;
      return sheet;
    } else if (
      line.includes(singleQuoteToken) &&
      (line.split(singleQuoteToken).length + 1) % 2 === 0 &&
      multiline !== ""
    ) {
      // mid

      multiline += "\n" + l;
      return sheet;
    } else if (!line.includes(singleQuoteToken) && multiline !== "") {
      // mid

      multiline += "\n" + l;
      return sheet;
    } else if (
      line.includes(singleQuoteToken) &&
      (line.split(singleQuoteToken).length + 1) % 2 !== 0 &&
      multiline !== ""
    ) {
      // end

      l = multiline + "\n" + l;
      multiline = "";
    }

    const row = lineParser(l, delimiter);

    sheet.rows[y] = row;
    sheet.rows.len = y + 1;

    y++;

    return sheet;
  };
}

export function objectToCSVInternal(
  object: Sheet,
  csvPath?: string,
  options?: Options
) {
  const { delimiter = "," } = options ?? {};

  let headeColumn = 0;

  const fileStream = csvPath ? fs.createWriteStream(csvPath) : undefined;

  const v = Object.values(object.rows).reduce<string[]>((acc, row, y) => {
    let rowData = "";

    if (typeof row !== "number" && "cells" in row) {
      const largest = Object.keys(row.cells).reduce(
        (big, x) => (big < Number(x) ? Number(x) : big),
        0
      );
      if (y === 0) {
        // headers
        headeColumn = largest;
      }

      if (largest === 0) {
        rowData = ",".repeat(headeColumn);
      }

      for (let u = 0; u < largest + 1; u++) {
        const text = row.cells[u]?.text;

        switch (true) {
          case text?.includes(delimiter) ||
            text?.includes("\n") ||
            text?.includes(singleQuoteToken):
            rowData +=
              singleQuoteValue +
              text?.replaceAll(singleQuoteValue, doubleQuoteValue) +
              singleQuoteValue;
            break;

          case text !== undefined:
            rowData += text;
            break;

          default:
            break;
        }

        if (u !== largest) {
          rowData += ",";
        }
      }

      // repeat , on empty cells
      if (rowData !== "" && largest < headeColumn) {
        rowData += ",".repeat(headeColumn - largest);
      }

      fileStream?.write(rowData + "\n");

      if (!csvPath) {
        acc = [...acc, rowData];
      }
    }

    return acc;
  }, []);

  fileStream?.end();

  return v;
}

export function objectToCsv_TEST(object: Sheet, options?: Options) {
  const s = objectToCSVInternal(object, undefined, options);

  return s.reduce<string[]>((acc, v) => {
    if (v.includes("\n")) {
      acc = [...acc, ...v.split("\n")];
    }

    return acc;
  }, []);
}

export function csvToObject_TEST(
  value: string[],
  sheetName = "fileMock",
  options?: Options
): Promise<Sheet> {
  const { delimiter = "," } = options ?? {};

  return new Promise((resolve, reject) => {
    try {
      let sheet: Sheet = { name: sheetName, rows: { len: 0 }, merges: [] };

      const csvLineToObjParser = csvLineToObjParserBuilder(
        sheetName,
        delimiter
      );

      value.forEach((line) => {
        sheet = csvLineToObjParser(line);
      });

      resolve(sheet);
    } catch (e) {
      reject(e);
    }
  });
}

// TODO: uncomment this
/*
if(process.argv[1] === fileURLToPath(import.meta.url)){
  // running from cli

  if(!process.argv[2]){
    console.log("\nUsage:")
    console.log("parseCSV.ts example.csv\n")
    throw new Error("Missing input file")
  }
    const csvPath = path.normalize(process.cwd()+"/"+process.argv[2])
  
  csvToObject(csvPath).then(val=>{
    console.log("val = "+JSON.stringify(val, null,2))
  })
}
*/
