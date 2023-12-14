import type {
  Optional,
  RawKanji,
  RawPhrase,
  RawVocabulary,
} from "../../src/typings/raw.js";
import md5 from "md5";

type Phrase = Omit<
  RawPhrase,
  "uid" | "tags" | "particles" | "inverse" | "polite"
> & {
  tag?: string;
};

type Vocabulary = Omit<RawVocabulary, "uid" | "tags"> & { tag?: string };
type Kanji = Optional<RawKanji, "uid" | "tags"> & { tag?: string };

export interface SheetData {
  name: string;
  rows: { len: number } & Record<
    number,
    {
      cells: Record<string, { text?: string; merge?: [number, number] | null }>;
    }
  >;
}

/**
 * x to 2d string[][]
 *
 * Creates a matrix of strings from xSpreadsheet data object
 * @param xSheetObj
 */
export function xtom(xSheetObj: SheetData) {
  const matrix = Object.values(xSheetObj.rows).reduce<string[][]>(
    (yCol, row) => {
      if (typeof row !== "number" && row.cells) {
        // if cell is empty row will not contain index
        // missing indexes are normal, orderdering based on index.
        const cellIdx = Object.keys(row.cells);

        const rowArr = cellIdx.reduce((xRow, x) => {
          const { text } = row.cells[x];
          if (text !== undefined) {
            xRow[Number(x)] = text;
          }
          return xRow;
        }, new Array<string>(cellIdx.length));

        yCol = [...yCol, rowArr];
      }
      return yCol;
    },
    []
  );

  return matrix;
}

/**
 * x to cell array
 *
 * Creates a cell array from xSpreadsheet data object
 * @param xSheetObj
 * @param sheetName
 */
export function xtoc(xSheetObj: SheetData) {
  const cellArray = Object.values(xSheetObj.rows).reduce<
    [number, number, string][] | []
  >((acc, row, xIdx) => {
    if (typeof row !== "number" && row.cells) {
      const x = Object.values(row.cells).map<[number, number, string]>(
        (c, yIdx) => [xIdx, yIdx, c.text ?? ""]
      );

      acc = [...acc, ...x];
    }
    return acc;
  }, []);

  return cellArray;
}

export function vocabularyToJSON(sheetData: SheetData) {
  const stringArray = xtom(sheetData);
  return sheets_sync_vocabulary(sheetData.name, stringArray);
}

/**
 * Maps a header name to a header index in the csv
 * @param headers Object to be modified
 * @param hh value of csv header
 * @param headerIndex index of header in csv
 */
function getHeaderIndex(
  headers: Record<string, number>,
  hh: string,
  headerIndex: number
) {
  const isAHeader = Object.keys(headers);

  const h = hh.toLowerCase();
  if (h && h.length > 0 && isAHeader.includes(h)) {
    const k = h;
    headers[k] = headerIndex;
  }
}

export function sheets_sync_vocabulary(
  sheetName: string,
  sheetData: string[][]
) {
  const h = {
    japanese: -1,
    romaji: -1,
    english: -1,
    group: -1,
    subgroup: -1,
    pronunciation: -1,
    tags: -1,
  };

  const vocabularyAfter = sheetData.reduce<Record<string, Vocabulary>>(
    (acc, row, i) => {
      if (i === 0) {
        row.forEach((headVal, headIdx) => {
          getHeaderIndex(h, headVal, headIdx);
        });

        Object.keys(h).forEach((hVal) => {
          const k = hVal as keyof typeof h;
          if (h[k] < 0) {
            throw new Error(
              `Missing or incorrect header '${hVal}' in ${sheetName}.csv`
            );
          }
        });
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

        if (row[h.group] && row[h.group] !== "") {
          vocabulary.grp = row[h.group];
        }

        if (row[h.subgroup] && row[h.subgroup] !== "") {
          vocabulary.subGrp = row[h.subgroup];
        }

        if (row[h.pronunciation] && row[h.pronunciation] !== "") {
          vocabulary.pronounce = row[h.pronunciation];
        }

        if (row[h.tags] && row[h.tags] !== "") {
          vocabulary.tag = row[h.tags];
        }

        if (row[h.romaji] && row[h.romaji] !== "") {
          vocabulary.romaji = row[h.romaji];
        }

        acc[key] = vocabulary;
      }
      return acc;
    },
    {}
  );

  const hash = md5(JSON.stringify(vocabularyAfter)).slice(0, 4);

  return { hash, vocabularyAfter };
}

export function phrasesToJSON(sheetData: SheetData) {
  const stringArray = xtom(sheetData);
  return sheets_sync_phrases(sheetData.name, stringArray);
}

export function sheets_sync_phrases(sheetName: string, sheetData: string[][]) {
  const h = {
    japanese: -1,
    romaji: -1,
    english: -1,
    group: -1,
    subgroup: -1,
    literal: -1,
    lesson: -1,
    tags: -1,
  };

  const phrasesAfter = sheetData.reduce<Record<string, Phrase>>(
    (acc, row, i) => {
      if (i === 0) {
        row.forEach((headVal, headIdx) => {
          getHeaderIndex(h, headVal, headIdx);
        });

        Object.keys(h).forEach((hVal) => {
          const k = hVal as keyof typeof h;
          if (h[k] < 0) {
            throw new Error(
              `Missing or incorrect header '${hVal}' in ${sheetName}.csv`
            );
          }
        });
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

        if (row[h.literal] && row[h.literal] !== "") {
          phrase.lit = row[h.literal];
        }

        if (row[h.group] && row[h.group] !== "") {
          phrase.grp = row[h.group];
        }

        if (row[h.subgroup] && row[h.subgroup] !== "") {
          phrase.subGrp = row[h.subgroup];
        }

        if (row[h.romaji] && row[h.romaji] !== "") {
          phrase.romaji = row[h.romaji];
        }

        if (row[h.lesson] && row[h.lesson] !== "") {
          phrase.lesson = row[h.lesson];
        }

        if (row[h.tags] && row[h.tags] !== "") {
          phrase.tag = row[h.tags];
        }

        acc[key] = phrase;
      }

      return acc;
    },
    {}
  );

  const hash = md5(JSON.stringify(phrasesAfter)).slice(0, 4);

  return { hash, phrasesAfter };
}

export function kanjiToJSON(sheetData: SheetData) {
  const stringArray = xtom(sheetData);
  return sheets_sync_kanji(sheetData.name, stringArray);
}

export function sheets_sync_kanji(sheetName: string, sheetData: string[][]) {
  const h = {
    kanji: -1,
    english: -1,
    onyoumi: -1,
    kunyoumi: -1,
    group: -1,
    tags: -1,
    radex: -1,
  };

  const kanjiList = sheetData.reduce<Record<string, Kanji>>((acc, row, i) => {
    if (i === 0) {
      row.forEach((headVal, headIdx) => {
        getHeaderIndex(h, headVal, headIdx);
      });

      Object.keys(h).forEach((hVal) => {
        const k = hVal as keyof typeof h;
        if (h[k] < 0) {
          throw new Error(
            `Missing or incorrect header '${hVal}' in ${sheetName}.csv`
          );
        }
      });
    }

    if (i > 0) {
      let kanji: Kanji = {
        kanji: row[h.kanji],
        english: row[h.english],
      };

      if (!kanji.kanji) {
        console.log("kanji");

        throw new Error(`Missing first cell [${1},${i + 1}] in ${sheetName}`);
      }

      const key = md5(kanji.kanji);

      if (row[h.onyoumi] && row[h.onyoumi] !== "") {
        kanji.on = row[h.onyoumi];
      }

      if (row[h.kunyoumi] && row[h.kunyoumi] !== "") {
        kanji.kun = row[h.kunyoumi];
      }

      if (row[h.group] && row[h.group] !== "") {
        kanji.grp = row[h.group];
      }

      if (row[h.tags] && row[h.tags] !== "") {
        kanji.tag = row[h.tags];
      }

      if (row[h.radex] && row[h.radex] !== "") {
        kanji.radex = row[h.radex];
      }

      acc[key] = kanji;
    }

    return acc;
  }, {});

  const hash = md5(JSON.stringify(kanjiList)).slice(0, 4);
  return { hash, kanjiList };
}
