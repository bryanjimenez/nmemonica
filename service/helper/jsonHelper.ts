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
  return sheets_sync_vocabulary(stringArray);
}

export function sheets_sync_vocabulary(sheetData: string[][]) {
  const JP = 1,
    // ORDER = 0,
    RM = 2,
    EN = 3,
    GRP = 4,
    SUBG = 5,
    PRN = 6,
    TAG = 7;
  // UID = 7;

  const vocabularyAfter = sheetData.reduce<Record<string, Vocabulary>>(
    (acc, el, i) => {
      if (i > 0) {
        let vocabulary: Vocabulary = {
          japanese: el[JP],
          romaji: el[RM],
          english: el[EN],
        };

        if (!vocabulary.japanese) {
          throw new Error("Missing first cell (index)");
        }

        const key: string = md5(vocabulary.japanese);

        if (el[GRP] && el[GRP] !== "") {
          vocabulary.grp = el[GRP];
        }

        if (el[SUBG] && el[SUBG] !== "") {
          vocabulary.subGrp = el[SUBG];
        }

        if (el[PRN] && el[PRN] !== "") {
          vocabulary.pronounce = el[PRN];
        }

        if (el[TAG] && el[TAG] !== "") {
          vocabulary.tag = el[TAG];
        }

        if (el[RM] && el[RM] !== "") {
          vocabulary.romaji = el[RM];
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
  return sheets_sync_phrases(stringArray);
}

export function sheets_sync_phrases(sheetData: string[][]) {
  const JP = 0,
    // ORDER = -1,
    RM = 1,
    EN = 2,
    LIT = 3,
    GRP = 4,
    SUBG = 5,
    LSN = 6,
    TAG = 7;

  const phrasesAfter = sheetData.reduce<Record<string, Phrase>>(
    (acc, el, i) => {
      if (i > 0) {
        let phrase: Phrase = {
          japanese: el[JP],
          english: el[EN],
        };

        if (!phrase.japanese) {
          throw new Error("Missing first cell (index)");
        }

        const key = md5(phrase.japanese);

        if (el[LIT] && el[LIT] !== "") {
          phrase.lit = el[LIT];
        }

        if (el[GRP] && el[GRP] !== "") {
          phrase.grp = el[GRP];
        }

        if (el[SUBG] && el[SUBG] !== "") {
          phrase.subGrp = el[SUBG];
        }

        if (el[RM] && el[RM] !== "") {
          phrase.romaji = el[1];
        }

        if (el[LSN] && el[LSN] !== "") {
          phrase.lesson = el[LSN];
        }

        if (el[TAG] && el[TAG] !== "") {
          phrase.tag = el[TAG];
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
  return sheets_sync_kanji(stringArray);
}

export function sheets_sync_kanji(sheetData: string[][]) {
  const KANJI = 0,
    EN = 1,
    ON = 2,
    KUN = 3,
    GRP = 4,
    TAG = 5,
    RADEX = 6; // Radical: example usage in a Kanji

  const kanjiList = sheetData.reduce<Record<string, Kanji>>((acc, el, i) => {
    if (i > 0) {
      let kanji: Kanji = {
        kanji: el[KANJI],
        english: el[EN],
      };

      if (!kanji.kanji) {
        throw new Error("Missing first cell (index)");
      }

      const key = md5(kanji.kanji);

      if (el[ON] && el[ON] !== "") {
        kanji.on = el[ON];
      }

      if (el[KUN] && el[KUN] !== "") {
        kanji.kun = el[KUN];
      }

      if (el[GRP] && el[GRP] !== "") {
        kanji.grp = el[GRP];
      }

      if (el[TAG] && el[TAG] !== "") {
        kanji.tag = el[TAG];
      }

      if (el[RADEX] && el[RADEX] !== "") {
        kanji.radex = el[RADEX];
      }

      acc[key] = kanji;
    }

    return acc;
  }, {});

  const hash = md5(JSON.stringify(kanjiList)).slice(0, 4);
  return { hash, kanjiList };
}
