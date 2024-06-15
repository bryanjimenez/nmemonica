import md5 from "md5";
import type {
  RawKanji,
  RawPhrase,
  RawVocabulary,
  SourceKanji,
  SourcePhrase,
  SourceVocabulary,
} from "nmemonica";

import { type FilledSheetData } from "./sheetHelperImport";
import { Optional } from "../typings/utils";

type Phrase = Omit<
  RawPhrase,
  "uid" | "tags" | "particles" | "inverse" | "polite"
> & {
  tag?: string;
};

type Vocabulary = Omit<RawVocabulary, "uid" | "tags"> & { tag?: string };
type Kanji = Optional<RawKanji, "uid" | "tags"> & { tag?: string };

const prettyHeaders = {
  english: ["English"],
  japanese: ["Japanese"],
  romaji: ["Romaji"],
  grp: ["Group"],
  subGrp: ["Sub Group", "Subgroup"],
  tag: ["Tags"],
  pronounce: ["Pronounced", "Pronounce", "Pronunciation"],
  opposite: ["Opposites", "Opposite"],
  lit: ["Literal"],
  lesson: ["Lesson"],
  kanji: ["Kanji"],
};

const phraseMinHeaders = {
  japanese: -1,
  english: -1,
  lit: -1,
  romaji: -1,
  grp: -1,
  subGrp: -1,
  lesson: -1,
  tag: -1,
};

const vocabularyMinHeaders = {
  japanese: -1,
  english: -1,
  romaji: -1,
  grp: -1,
  subGrp: -1,
  pronounce: -1,
  opposite: -1,
  tag: -1,
};

const kanjiMinHeaders = {
  kanji: -1,
  english: -1,
  pronounce: -1,
  tag: -1,
};

/**
 * x to 2d string[][]
 *
 * Creates a matrix of strings from xSpreadsheet data object
 * @param xObj
 */
export function xtom(xObj: FilledSheetData) {
  const matrix = Object.values(xObj.rows).reduce<string[][]>((yCol, row) => {
    if (
      typeof row !== "number" &&
      typeof row.cells === "object" &&
      Object.keys(row.cells).length > 0
    ) {
      // if cell is empty row will not contain index
      // missing indexes are normal, orderdering based on index.
      const cellIdx = Object.keys(row.cells).map((k) => Number(k));

      const rowArr = cellIdx.reduce((xRow, x) => {
        if (row.cells[x] !== undefined && "text" in row.cells[x]) {
          const { text } = row.cells[x];
          if (text !== undefined) {
            xRow[Number(x)] = text;
          }
        }
        return xRow;
      }, new Array<string>(cellIdx.length));

      yCol = [...yCol, rowArr];
    }
    return yCol;
  }, []);

  return matrix;
}

/**
 * x to cell array
 *
 * Creates a cell array from xSpreadsheet data object
 * @param xObj
 * @param sheetName
 */
export function xtoc(xObj: FilledSheetData) {
  const cellArray = Object.values(xObj.rows).reduce<
    [number, number, string][] | []
  >((acc, row, xIdx) => {
    if (typeof row !== "number" && typeof row.cells === "object") {
      const x = Object.values(row.cells).map<[number, number, string]>(
        (c, yIdx) => [xIdx, yIdx, c.text ?? ""]
      );

      acc = [...acc, ...x];
    }
    return acc;
  }, []);

  return cellArray;
}

/**
 * JSON object to x
 */
export function jtox(
  appJSONData: Record<string, SourceVocabulary | SourcePhrase | SourceKanji>,
  dataSetName: string
) {
  const xObj: FilledSheetData = {
    name: dataSetName,
    rows: { len: 0 },
    autofilter: { ref: null, filters: [], sort: null },
  };

  let h: Partial<Record<keyof typeof prettyHeaders, number>>;

  switch (dataSetName) {
    case "Vocabulary":
      {
        h = { ...vocabularyMinHeaders };
      }
      break;

    case "Phrases":
      {
        h = { ...phraseMinHeaders };
      }
      break;

    case "Kanji":
      {
        h = { ...kanjiMinHeaders };
      }
      break;

    default:
      throw new Error(`Mapping for ${dataSetName} not implemented`);
  }

  const headerIdx = Object.keys(h) as (keyof typeof prettyHeaders)[];
  headerIdx.forEach((head, i) => {
    xObj.rows[0] = {
      cells: {
        ...(xObj.rows[0]?.cells ?? {}),
        [i]: { text: prettyHeaders[head][0] },
      },
    };
  });

  let rowIdx = 1;
  for (const [_uid, entry] of Object.entries(appJSONData)) {
    for (const [field, value] of Object.entries(entry)) {
      const cellIdx = (headerIdx as string[]).indexOf(field);
      if (cellIdx > -1) {
        if (
          xObj.rows[rowIdx] === undefined ||
          xObj.rows[rowIdx].cells === undefined
        ) {
          xObj.rows[rowIdx] = { cells: {} };
        }

        if (Array.isArray(value)) {
          xObj.rows[rowIdx].cells[cellIdx] = { text: value.join("\n") };
        } else if (typeof value === "string") {
          xObj.rows[rowIdx].cells[cellIdx] = { text: value };
        }
      }
    }
    rowIdx++;
  }
  xObj.rows.len = rowIdx;

  return xObj;
}

/**
 * Parses sheet data into app's json format
 */
export function sheetDataToJSON(sheetData: FilledSheetData) {
  let data: Record<string, Phrase | Vocabulary | Kanji> = {};
  let hash = "";

  switch (sheetData.name) {
    case "Vocabulary": {
      const { vocabularyRecord, hash: h } = vocabularyToJSON(sheetData);
      data = vocabularyRecord;
      hash = h;
      break;
    }
    case "Phrases": {
      const { phrasesRecord, hash: h } = phrasesToJSON(sheetData);
      data = phrasesRecord;
      hash = h;
      break;
    }
    case "Kanji": {
      const { kanjiRecord, hash: h } = kanjiToJSON(sheetData);
      data = kanjiRecord;
      hash = h;
      break;
    }
    default:
      throw new Error(`Unknown sheet format ${sheetData.name}`);
  }

  return { data, hash };
}

export function vocabularyToJSON(sheetData: FilledSheetData) {
  const stringArray = xtom(sheetData);
  return sheets_sync_vocabulary(sheetData.name, stringArray);
}

/**
 * Maps a header name to a header index in the csv
 * @param headers Object to be modified
 * @param headerValue value of csv header
 * @param headerIndex index of header in csv
 */
function getHeaderIndex(
  headers: Record<string, number>,
  headerValue: string,
  headerIndex: number
) {
  const search = headerValue.toLowerCase();

  const headerMap = Object.entries(prettyHeaders);
  const key = 0;
  if (search && search.length > 0) {
    const index = headerMap.findIndex(
      ([_kk, vv]) => vv.find((v) => v.toLowerCase() === search) !== undefined
    );
    if (index !== -1) {
      headers[headerMap[index][key]] = headerIndex;
    }
  }
}

export function sheets_sync_vocabulary(
  sheetName: string,
  sheetData: string[][]
) {
  const h = { ...vocabularyMinHeaders };

  const vocabularyRecord = sheetData.reduce<Record<string, Vocabulary>>(
    (acc, row, i) => {
      if (i === 0) {
        row.forEach((headVal, headIdx) => {
          getHeaderIndex(h, headVal, headIdx);
        });
      }

      if (
        h.english < 0 ||
        h.japanese < 0 ||
        h.romaji < 0 ||
        h.grp < 0 ||
        h.subGrp < 0 ||
        h.tag < 0 ||
        h.pronounce < 0
      ) {
        const theHeaders = Object.entries(h);
        const missIdx = theHeaders.findIndex(([_k, v]) => v < 0);
        const name = 0;
        throw new Error(
          `Missing or incorrect header '${theHeaders[missIdx][name]}' in ${sheetName}.csv`
        );
      }

      if (i > 0) {
        let vocabulary: Vocabulary = {
          japanese: row[h.japanese],
          romaji: row[h.romaji],
          english: row[h.english],
        };

        if (!vocabulary.japanese) {
          throw new Error(`Missing first cell [${1},${i + 1}] in ${sheetName}`);
        }

        const key: string = md5(vocabulary.japanese);

        if (row[h.grp] && row[h.grp] !== "") {
          vocabulary.grp = row[h.grp];
        }

        if (row[h.subGrp] && row[h.subGrp] !== "") {
          vocabulary.subGrp = row[h.subGrp];
        }

        if (row[h.pronounce] && row[h.pronounce] !== "") {
          vocabulary.pronounce = row[h.pronounce];
        }

        if (row[h.tag] && row[h.tag] !== "") {
          vocabulary.tag = row[h.tag];
        }

        if (row[h.romaji] && row[h.romaji] !== "") {
          vocabulary.romaji = row[h.romaji];
        }

        if (row[h.opposite] && row[h.opposite] !== "") {
          vocabulary.opposite = row[h.opposite].split("\n");
        }

        acc[key] = vocabulary;
      }
      return acc;
    },
    {}
  );

  const hash = md5(JSON.stringify(vocabularyRecord)).slice(0, 4);

  return { hash, vocabularyRecord };
}

export function phrasesToJSON(sheetData: FilledSheetData) {
  const stringArray = xtom(sheetData);
  return sheets_sync_phrases(sheetData.name, stringArray);
}

export function sheets_sync_phrases(sheetName: string, sheetData: string[][]) {
  const h = { ...phraseMinHeaders };

  const phrasesRecord = sheetData.reduce<Record<string, Phrase>>(
    (acc, row, i) => {
      if (i === 0) {
        row.forEach((headVal, headIdx) => {
          getHeaderIndex(h, headVal, headIdx);
        });
      }

      if (
        h.english < 0 ||
        h.japanese < 0 ||
        h.romaji < 0 ||
        h.grp < 0 ||
        h.subGrp < 0 ||
        h.tag < 0 ||
        h.lit < 0 ||
        h.lesson < 0
      ) {
        const theHeaders = Object.entries(h);
        const missIdx = theHeaders.findIndex(([_k, v]) => v < 0);
        const name = 0;
        throw new Error(
          `Missing or incorrect header '${theHeaders[missIdx][name]}' in ${sheetName}.csv`
        );
      }

      if (i > 0) {
        let phrase: Phrase = {
          japanese: row[h.japanese],
          english: row[h.english],
        };

        if (!phrase.japanese) {
          throw new Error(`Missing first cell [${1},${i + 1}] in ${sheetName}`);
        }

        const key = md5(phrase.japanese);

        if (row[h.lit] && row[h.lit] !== "") {
          phrase.lit = row[h.lit];
        }

        if (row[h.grp] && row[h.grp] !== "") {
          phrase.grp = row[h.grp];
        }

        if (row[h.subGrp] && row[h.subGrp] !== "") {
          phrase.subGrp = row[h.subGrp];
        }

        if (row[h.romaji] && row[h.romaji] !== "") {
          phrase.romaji = row[h.romaji];
        }

        if (row[h.lesson] && row[h.lesson] !== "") {
          phrase.lesson = row[h.lesson];
        }

        if (row[h.tag] && row[h.tag] !== "") {
          phrase.tag = row[h.tag];
        }

        acc[key] = phrase;
      }

      return acc;
    },
    {}
  );

  const hash = md5(JSON.stringify(phrasesRecord)).slice(0, 4);

  return { hash, phrasesRecord };
}

export function kanjiToJSON(sheetData: FilledSheetData) {
  const stringArray = xtom(sheetData);
  return sheets_sync_kanji(sheetData.name, stringArray);
}

export function sheets_sync_kanji(sheetName: string, sheetData: string[][]) {
  const h = { ...kanjiMinHeaders };

  const kanjiRecord = sheetData.reduce<Record<string, Kanji>>((acc, row, i) => {
    if (i === 0) {
      row.forEach((headVal, headIdx) => {
        getHeaderIndex(h, headVal, headIdx);
      });
    }

    if (h.english < 0 || h.kanji < 0 || h.pronounce < 0 || h.tag < 0) {
      const theHeaders = Object.entries(h);
      const missIdx = theHeaders.findIndex(([_k, v]) => v < 0);
      const name = 0;
      throw new Error(
        `Missing or incorrect header '${theHeaders[missIdx][name]}' in ${sheetName}.csv`
      );
    }

    if (i > 0) {
      let kanji: Kanji = {
        kanji: row[h.kanji],
        english: row[h.english],
      };

      if (!kanji.kanji) {
        throw new Error(`Missing first cell [${1},${i + 1}] in ${sheetName}`);
      }

      const key = md5(kanji.kanji);

      if (row[h.pronounce] && row[h.pronounce] !== "") {
        kanji.pronounce = row[h.pronounce];
      }

      if (row[h.tag] && row[h.tag] !== "") {
        kanji.tag = row[h.tag];
      }

      acc[key] = kanji;
    }

    return acc;
  }, {});

  const hash = md5(JSON.stringify(kanjiRecord)).slice(0, 4);
  return { hash, kanjiRecord };
}
