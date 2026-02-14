import classNames from "classnames";
import type { FuriganaParseObject, RawJapanese } from "nmemonica";
import React from "react";

import {
  isFullWNumber,
  isHiragana,
  isKanji,
  isKatakana,
  isPunctuation,
  toEnglishNumber,
} from "./kanaHelper";
import { buildRubyElement, getParseObjectMask, wrap } from "./kanjiHelper";
import { ideographicSpace } from "./unicodeHelper";
import type { kanaHintBuilder as kanaHintBuilderType } from "../helper/kanaHelper";
import type { furiganaHintBuilder as furiganaHintBuilderType } from "../helper/kanjiHelper";

export class JapaneseText {
  _furigana: string;
  _kanji?: string;
  _parseObj: FuriganaParseObject;
  slang: boolean;
  keigo: boolean;
  adj: string;

  constructor(furigana: string, kanji?: string) {
    this._furigana = furigana;
    this._kanji = kanji;

    this._parseObj = {
      furiganas: [],
      kanjis: [],
      okuriganas: [],
      startsWKana: false,
    };

    this.slang = false;
    this.keigo = false;
    this.adj = "";
  }

  get [Symbol.toStringTag]() {
    return "JapaneseText";
  }

  get furigana() {
    return this._furigana;
  }

  set furigana(furigana) {
    this._furigana = furigana;
  }

  get kanji() {
    return this._kanji;
  }

  set kanji(kanji) {
    this._kanji = kanji;
  }

  get parseObj() {
    if (
      this._parseObj.furiganas.length === 0 &&
      this._parseObj.kanjis.length === 0 &&
      this._parseObj.okuriganas.length === 0 &&
      !this._parseObj.startsWKana
    ) {
      if (this.hasFurigana()) {
        const parseTry = furiganaParseRetry(
          this.getPronunciation(),
          this.getSpellingRAW()
        );
        if (parseTry instanceof Error) {
          throw parseTry;
        }
        this._parseObj = parseTry;
      } else {
        this._parseObj = {
          okuriganas: [this.getSpellingRAW()],
          startsWKana: true,
          kanjis: [],
          furiganas: [],
        };
      }
    }

    return this._parseObj;
  }

  hasFurigana() {
    return this._kanji !== undefined ? true : false;
  }

  /**
   * may contain workaround space
   * @returns {string} spelling may contain kanji
   */
  getSpellingRAW() {
    if (this._kanji !== undefined) {
      return this._kanji;
    } else {
      return this._furigana;
    }
  }

  /**
   * removes workaround space
   * @returns {string} spelling may contain kanji
   */
  getSpelling() {
    if (this._kanji !== undefined) {
      return removeAllWorkaroundSpaces(this._kanji);
    } else {
      return removeAllWorkaroundSpaces(this._furigana);
    }
  }

  /**
   * @returns pronunciation only in hiragana
   */
  getPronunciation(): string {
    return this._furigana;
  }

  getObject() {
    return { furigana: this._furigana, kanji: this._kanji };
  }

  static parse = (rawObj: RawJapanese) => japaneseTextParse(rawObj);
  static parser = japaneseTextParse;

  isSlang() {
    return this.slang;
  }

  isKeigo() {
    return this.keigo;
  }

  isNaAdj() {
    return this.adj === "na";
  }

  isIAdj() {
    return this.adj === "i";
  }

  debug() {
    return JSON.stringify(this);
  }

  append(value = "") {
    if (this.hasFurigana()) {
      return new JapaneseText(
        this.getPronunciation() + value,
        this.getSpelling() + value
      );
    } else {
      return new JapaneseText(this.getSpelling() + value);
    }
  }

  toString(): string {
    return (
      this._furigana + (this._kanji !== undefined ? "\n" + this._kanji : "")
    );
  }

  /**
   * @param {number} minimumMora
   * @returns {boolean} meets minimumMora criteria and is parsable
   */
  isHintable(minimumMora = 3) {
    let hint = true;

    const isKanaOrKanjiOnly = jaStrToCharArray(this.toString()).every(
      (char) =>
        isKanji(char) || isHiragana(char) || isKatakana(char) || char === "\n"
    );
    if (!isKanaOrKanjiOnly) return false;

    if (this.hasFurigana()) {
      const pronunciation = this.getPronunciation();
      const orthography = this.getSpellingRAW();

      if (pronunciation.length < minimumMora) {
        hint = false;
      } else {
        try {
          furiganaParseRetry(pronunciation, orthography);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
          // TODO: take a callback to log fail
          hint = false;
        }
      }
    } else {
      // no kanji
      const kana = this.getSpelling();
      if (kana.length < minimumMora) {
        hint = false;
      }
    }

    return hint;
  }

  /**
   * @param kanaHintBuilder
   * @param furiganaHintBuilder
   * @param minMora minimum mora japaneseText must have for hint
   * @param hintMora number of mora to hint
   */
  getHint(
    kanaHintBuilder: typeof kanaHintBuilderType,
    furiganaHintBuilder: typeof furiganaHintBuilderType,
    minMora = 3,
    hintMora = 1
  ) {
    const hiddenElCSS = "invisible";
    const shownElCSS = "hint-mora";

    const hintCSS = { shown: shownElCSS, hidden: hiddenElCSS };

    let hint: React.JSX.Element | null;

    if (!this.isHintable(minMora)) {
      hint = null;
    } else {
      if (this.hasFurigana()) {
        const pronunciation = this.getPronunciation();
        const orthography = this.getSpellingRAW();

        const parseTry = furiganaParseRetry(pronunciation, orthography);
        if (parseTry instanceof Error === false) {
          const { kanjis, furiganas, okuriganas, startsWKana } = parseTry;

          hint = furiganaHintBuilder(
            hintCSS,
            kanjis,
            furiganas,
            okuriganas,
            startsWKana,
            hintMora
          );
        } else {
          hint = null;
        }
      } else {
        // no kanji
        const kana = this.getSpelling();
        hint = kanaHintBuilder(hintCSS, kana, hintMora);
      }
    }

    return hint;
  }

  toHTML(options?: {
    showError?: boolean;
    furigana?: { show?: boolean; toggle?: () => void };
  }): React.JSX.Element {
    let htmlElement: React.JSX.Element;

    const furiganaHide = options?.furigana?.show === false;
    const furiganaToggle = options?.furigana?.toggle;

    const eClass = classNames({
      "incorrect-color": true,
      "d-block": true,
    });

    const fallBackHtml = (
      <span>
        <span className={eClass}>{this.getPronunciation()}</span>
        <span>{this.getSpelling()}</span>
      </span>
    );

    if (!this.hasFurigana()) {
      htmlElement = <span>{this.getSpelling()}</span>;
    } else {
      try {
        const { kanjis, furiganas, okuriganas, startsWKana } = this.parseObj;

        const mask = getParseObjectMask(this.parseObj);

        const clickableCss =
          classNames({ clickable: Boolean(furiganaToggle) }) || undefined;
        const toggleHandler = furiganaToggle
          ? (furiganaToggle as React.MouseEventHandler)
          : undefined;
        const hideFuriganaCss = furiganaHide ? "transparent-font" : undefined;

        htmlElement = (
          <span className={clickableCss} onClick={toggleHandler}>
            {mask.map((el, i) => {
              const sk = wrap(kanjis[i]);
              const hk = wrap();

              const sf = wrap(furiganas[i], hideFuriganaCss);
              const hf = wrap();

              const so = wrap(okuriganas[i]);
              const ho = wrap();

              return buildRubyElement(
                i,
                { sk, hk },
                { sf, hf },
                { so, ho },
                startsWKana
              );
            })}
          </span>
        );
      } catch (e) {
        if (options?.showError !== false) {
          // eslint-disable-next-line no-console
          console.log(e);
          // TODO: take a callback to log fail
        }
        htmlElement = fallBackHtml;
      }
    }

    return htmlElement;
  }
}

/**
 * Static parsing fn for JapaneseText and sub types
 */
function japaneseTextParse(
  rawObj: RawJapanese,
  constructorFn?: (constructorParams: RawJapanese) => JapaneseText
) {
  const constructorParams = rawObj.japanese.split("\n");

  let jText;
  if (typeof constructorFn === "function") {
    jText = constructorFn(rawObj);
  } else {
    const [furigana, kanji] = constructorParams;
    jText = new JapaneseText(furigana, kanji);
  }

  if (rawObj.slang === true) {
    jText.slang = true;
  }
  if (rawObj.keigo === true) {
    jText.keigo = true;
  }
  if (rawObj?.adj === "na" || rawObj?.adj === "i") {
    jText.adj = rawObj.adj;
  }

  return jText;
}

/**
 * @returns object containing parse info or Error if the two phrases do not match or if the parsed output is invalid.
 * @param pronunciationStr (hiragana)
 * @param ortographyStr (kanji)
 */
export function furiganaParseRetry(
  pronunciationStr: string,
  ortographyStr: string
) {
  let kanjis, furiganas, okuriganas, startsWKana;
  const parseTry = furiganaParse(pronunciationStr, ortographyStr);
  if (parseTry instanceof Error) {
    // don't retry unless parse error
    const cause = parseTry.cause as { code: string };

    if (cause?.code === "ParseError") {
      // reverse try

      const rP = jaStrToCharArray(pronunciationStr).reverse().join("");
      const rW = jaStrToCharArray(ortographyStr).reverse().join("");

      const parseRevTry = furiganaParse(rP, rW);
      if (parseRevTry instanceof Error) {
        return parseRevTry;
      }
      const { kanjis: rk, furiganas: rf, okuriganas: ro } = parseRevTry;

      kanjis = rk.map((v) => jaStrToCharArray(v).reverse().join("")).reverse();
      furiganas = rf
        .map((v) => jaStrToCharArray(v).reverse().join(""))
        .reverse();
      okuriganas = ro
        .map((v) => jaStrToCharArray(v).reverse().join(""))
        .reverse();
      startsWKana = !isKanji(ortographyStr.charAt(0));

      return { kanjis, furiganas, okuriganas, startsWKana };
    }
  }

  return parseTry;
}

/**
 * is orthography[pos] a number that has furigana
 * @param pos the characters position in ortography
 * @param pronunciation
 * @param orthography
 * @returns whether is numeric with furigana
 */
export function isNumericCounter(
  pos: number,
  pronunciation: string[],
  orthography: string[]
) {
  const char = orthography[pos];

  return (
    (Number.isInteger(toEnglishNumber(char)) || // is Japanese arabic number char
      Number.isInteger(Number.parseInt(char))) && // is a number
    !pronunciation.includes(char) && // the number has furigana
    !isKanji(char) &&
    !isHiragana(char) &&
    !isKatakana(char) &&
    pos < orthography.length - 1 // cannot be the last character
  );
}
/**
 * Japanese string to character array
 *
 * This will provide a proper length (unicode code point len) and
 * an array of Japanese characters (Kanji, and/or Kana as unicode code points)
 *
 * `Array.from` and spread operator `[...str]` split at character boundary
 * `string.prototype.split("")` splits at the utf-16 code unit boundary **not** character boundary
 */
export function jaStrToCharArray(utf16String: string) {
  return Array.from(utf16String);
}

/**
 * Any whitespace including ideographic space also tabs
 */
const anySpace = new RegExp(/\s/);

/**
 * When there is ambiguitity aligning furigana,  
 * spacing is added to characters of  
 * the pronunciation and orthography  
 *
 * ascii space and cjk space
 */
const workaroundSpace = new RegExp("[" + "\u0020" + ideographicSpace + "]");

export function removeAllWorkaroundSpaces(some: string) {
  // global regexp have several pitfalls
  const globalWSpace = new RegExp(workaroundSpace.source, "g");

  return some.replace(globalWSpace, "");
}

/**
 * Accumulate furigana by iterating until `limitChar` is found
 * @param limitChar
 * @param pronunciation
 * @param pronIdx
 * @param fword
 *
 * @param hasWhiteSpace Error info
 * @param orthography Error info
 * @param kanjis Error info
 * @param furiganas Error info
 * @param okuriganas Error info
 */
function iterPronuncUntilOrtographLimit(
  limitChar: string,
  pronunciation: string[],
  pronIdx: number,
  fword: string,

  hasWhiteSpace: boolean,
  orthography: string[],
  kanjis: string[],
  furiganas: string[],
  okuriganas: string[]
) {
  while (pronunciation[pronIdx] !== limitChar) {
    if (!workaroundSpace.test(pronunciation[pronIdx])) {
      fword += pronunciation[pronIdx];
    }
    pronIdx++;

    if (pronIdx > pronunciation.length) {
      const msg =
        "The two phrases do not match" +
        (hasWhiteSpace ? " (contains white space)" : "");

      return new Error(msg, {
        cause: {
          code: "InputError",
          info: {
            input: { pronunciation, orthography },
            kanjis,
            furiganas,
            okuriganas,
          },
        },
      });
    }
  }

  return { last: pronIdx, acc: fword };
}

/**
 * @returns object containing parse info or Error if the two phrases do not match or if the parsed output is invalid.
 * @param pronunciationStr (furigana)
 * @param orthographyStr (kanji)
 */
export function furiganaParse(
  pronunciationStr: string,
  orthographyStr: string
) {
  const pronunciation = jaStrToCharArray(pronunciationStr);
  const orthography = jaStrToCharArray(orthographyStr);

  if (orthography.every((c) => isKanji(c) || isPunctuation(c))) {
    return {
      kanjis: [orthographyStr],
      furiganas: [pronunciationStr],
      okuriganas: [],
      startsWKana: false,
    };
  }

  const hasWhiteSpace =
    anySpace.test(pronunciationStr) || anySpace.test(orthographyStr);

  const startsWKana =
    !isKanji(orthography[0]) && !isFullWNumber(orthography[0]);

  let pronIdx = 0;
  let furiganas: string[] = [];
  let kanjis: string[] = [];
  let okuriganas: string[] = [];
  let fword = "";
  let kword = "";
  let oword = "";
  let prevWasKanji = false;

  let ortIdx = 0;
  for (let ortChar of orthography) {
    if (
      !isKanji(ortChar) &&
      !isNumericCounter(ortIdx, pronunciation, orthography)
    ) {
      //kana
      if (prevWasKanji) {
        const result = iterPronuncUntilOrtographLimit(
          ortChar,
          pronunciation,
          pronIdx,
          fword,

          // error info
          hasWhiteSpace,
          orthography,
          kanjis,
          furiganas,
          okuriganas
        );

        if (result instanceof Error) {
          return result;
        }
        const { last, acc } = result;
        pronIdx = last;
        furiganas.push(acc);
        fword = "";
      }
      if (!workaroundSpace.test(ortChar)) {
        oword += ortChar;
      }

      if (kword.length > 0) {
        kanjis.push(kword);
        kword = "";
      }

      pronIdx++;
      prevWasKanji = false;
    } else {
      // kanji
      if (!workaroundSpace.test(pronunciation[pronIdx])) {
        fword += pronunciation[pronIdx];
      }
      if (!workaroundSpace.test(ortChar)) {
        kword += ortChar;
      }
      prevWasKanji = true;
      pronIdx++;
      if (oword.length > 0) {
        okuriganas.push(oword);
        oword = "";
      }

      if (orthography.length - ortIdx === 1) {
        // (this) last character is a kanji

        // aggregate all remaining pronunciation w/o spaces
        const remainFword = pronunciation.slice(pronIdx).join("");
        fword += removeAllWorkaroundSpaces(remainFword);
        furiganas.push(fword);
        kanjis.push(kword);
      }
    }
    ortIdx++;
  }

  if (oword.length > 0) {
    const remainOword = removeAllWorkaroundSpaces(oword);
    okuriganas.push(remainOword);
  }

  const [pronunciationOutput, orthographyOutput] = validateParseFurigana(
    kanjis,
    furiganas,
    okuriganas,
    startsWKana
  );

  // remove spaces which are used as a workaround for parsing failure due to repeated chars
  const pronunciationNoSpace = removeAllWorkaroundSpaces(pronunciationStr);
  const ortographyNoSpace = removeAllWorkaroundSpaces(orthographyStr);

  if (
    pronunciationOutput !== pronunciationNoSpace ||
    orthographyOutput !== ortographyNoSpace
  ) {
    const msg =
      "Failed to parse text to build furigana" +
      (hasWhiteSpace ? " (contains white space)" : "");

    return new Error(msg, {
      cause: {
        code: "ParseError",
        info: {
          input: { pronunciation, orthography },
          output: {
            pronunciation: pronunciationOutput,
            orthography: orthographyOutput,
          },
        },
      },
    });
  }

  return { kanjis, furiganas, okuriganas, startsWKana };
}

/**
 * @returns [pronunciation, orthography]
 * @param kanjis
 * @param furiganas
 * @param okuriganas
 * @param startsWKana
 */
export function validateParseFurigana(
  kanjis: string[],
  furiganas: string[],
  okuriganas: string[],
  startsWKana: boolean
): [string, string] {
  let pronunciation, orthography;

  if (startsWKana) {
    orthography = okuriganas.reduce((a, n, i) => a + n + (kanjis[i] || ""), "");
    pronunciation = okuriganas.reduce(
      (a, n, i) => a + n + (furiganas[i] || ""),
      ""
    );
  } else {
    orthography = kanjis.reduce((a, k, i) => a + k + (okuriganas[i] || ""), "");
    pronunciation = furiganas.reduce(
      (a, f, i) => a + f + (okuriganas[i] || ""),
      ""
    );
  }

  return [pronunciation, orthography];
}

/**
 * when word has override pronounce attr it is used otherwise the spelling is used
 * @returns kana pronunciation or it's spelling
 * @param vocabulary data object
 */
export function audioPronunciation(vocabulary: RawJapanese) {
  let q;
  if (vocabulary.pronounce !== undefined) {
    const isAllKana = jaStrToCharArray(vocabulary.pronounce).every(
      (c) => isHiragana(c) || isKatakana(c)
    );

    if (isAllKana) {
      q = vocabulary.pronounce;
    } else {
      return new Error("No valid pronunciation", {
        cause: { code: "InvalidPronunciation", value: vocabulary },
      });
    }
  } else {
    const w = JapaneseText.parse(vocabulary);
    const spelling = w.getSpelling();
    // remove workaround-spaces
    q = removeAllWorkaroundSpaces(spelling);
  }
  return q;
}
