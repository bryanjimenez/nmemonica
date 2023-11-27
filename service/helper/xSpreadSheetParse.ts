import {
  utils as XLSX_utils,
  type WorkSheet,
  type CellObject,
  type Range,
} from "xlsx";
import type { SheetData } from "./firebaseParse.js";

/**
 * Converts data from SheetJS to x-spreadsheet
 *
 * @param  {Object} wb SheetJS workbook object
 *
 * @returns {Object[]} An x-spreadsheet data
 */
export function stox<
  T extends { SheetNames: string[]; Sheets: Record<string, WorkSheet> },
>(wb: T, sheetRange: string[] = []) {
  const out: WorkSheet[] = [];
  wb.SheetNames.forEach(function (name) {
    const sheetRng: { [rangeName: string]: string } = sheetRange.reduce(
      (acc, el) => {
        const [name, rng] = el.split("!");

        return { ...acc, [name]: rng };
      },
      {}
    );

    if (Object.keys(sheetRng).includes(name) || sheetRange.length === 0) {
      const o: WorkSheet & {
        rows: Record<number, { cells: SheetData["rows"][0]["cells"] }>;
      } = { name: name, rows: {} };
      const ws: WorkSheet = wb.Sheets[name];

      if (!ws || !ws["!ref"]) return;
      const range = XLSX_utils.decode_range(sheetRng[name] ?? ws["!ref"]);
      // console.log(name+" "+ws['!ref'])
      // sheet_to_json will lost empty row and col at begin as default
      range.s = { r: 0, c: 0 };
      const aoa: string[][] = XLSX_utils.sheet_to_json(ws, {
        raw: false,
        header: 1,
        range: range,
      });

      aoa.forEach(function (r: string[], i) {
        const cells: SheetData["rows"][0]["cells"] = {};
        r.forEach(function (c: string, j) {
          cells[j] = { text: c };

          const cellRef = XLSX_utils.encode_cell({ r: i, c: j });
          const cO: CellObject = ws[cellRef];

          if (cO != null && cO.f != null) {
            cells[j].text = "=" + cO.f;
          }
        });
        o.rows[i] = { cells: cells };
      });

      o.merges = [];
      (ws["!merges"] || []).forEach(function (merge: Range, i: number) {
        //Needed to support merged cells with empty content
        if (o.rows[merge.s.r] == null) {
          o.rows[merge.s.r] = { cells: {} };
        }
        if (o.rows[merge.s.r].cells[merge.s.c] == null) {
          o.rows[merge.s.r].cells[merge.s.c] = {};
        }

        o.rows[merge.s.r].cells[merge.s.c].merge = [
          merge.e.r - merge.s.r,
          merge.e.c - merge.s.c,
        ];

        o.merges[i] = XLSX_utils.encode_range(merge);
      });

      out.push(o);
    }
  });

  return out;
}

/**
 * Converts data from x-spreadsheet to SheetJS
 *
 * @param  {Object[]} sdata An x-spreadsheet data object
 *
 * @returns {Object} A SheetJS workbook object
 */
export function xtos(sdata: SheetData[]) {
  const out = XLSX_utils.book_new();
  sdata.forEach(function (xws: SheetData) {
    const ws: WorkSheet = {};
    const rowobj = xws.rows;
    const minCoord = { r: 0, c: 0 },
      maxCoord = { r: 0, c: 0 };
    for (let ri = 0; ri < rowobj.len; ++ri) {
      const row = rowobj[ri];
      if (!row) continue;
      Object.keys(row.cells).forEach(function (sk) {
        const nk = Number(sk);
        const idx = +nk;
        if (isNaN(idx)) return;

        const lastRef = XLSX_utils.encode_cell({ r: ri, c: idx });
        if (ri > maxCoord.r) maxCoord.r = ri;
        if (idx > maxCoord.c) maxCoord.c = idx;

        let cellText = row.cells[nk].text;
        let dataType = "s";
        if (!cellText) {
          cellText = "";
          dataType = "z";
        } else if (!isNaN(Number(cellText))) {
          dataType = "n";
        } else if (
          typeof cellText === "string" &&
          (cellText.toLowerCase() === "true" ||
            cellText.toLowerCase() === "false")
        ) {
          dataType = "b";
        }

        ws[lastRef] = { v: cellText, t: dataType };
        if (
          dataType == "s" &&
          typeof cellText === "string" &&
          cellText.at(0) == "="
        ) {
          ws[lastRef].f = cellText.slice(1);
        }

        const nkMerge = row.cells[nk].merge;
        if (nkMerge !== null && nkMerge !== undefined) {
          if (ws["!merges"] == null) ws["!merges"] = [];

          ws["!merges"].push({
            s: { r: ri, c: idx },
            e: {
              r: ri + nkMerge[0],
              c: idx + nkMerge[1],
            },
          });
        }
      });
    }
    ws["!ref"] = minCoord
      ? XLSX_utils.encode_range({
          s: minCoord,
          e: maxCoord,
        })
      : "A1";

    XLSX_utils.book_append_sheet(out, ws, xws.name);
  });

  return out;
}
