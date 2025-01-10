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
      return this._kanji.replaceAll(" ", "");
    } else {
      return this._furigana.replaceAll(" ", "");
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

    const isKanaOrKanjiOnly = this.toString()
      .split("")
      .every(
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
 * @param pronunciation (hiragana)
 * @param ortography (kanji)
 */
export function furiganaParseRetry(pronunciation: string, ortography: string) {
  let kanjis, furiganas, okuriganas, startsWKana;
  const parseTry = furiganaParse(pronunciation, ortography);
  if (parseTry instanceof Error) {
    // don't retry unless parse error
    const cause = parseTry.cause as { code: string };

    if (cause?.code === "ParseError") {
      // reverse try

      const rP = pronunciation.split("").reverse().join("");
      const rW = ortography.split("").reverse().join("");

      const parseRevTry = furiganaParse(rP, rW);
      if (parseRevTry instanceof Error) {
        return parseRevTry;
      }
      const { kanjis: rk, furiganas: rf, okuriganas: ro } = parseRevTry;

      kanjis = rk.map((v) => v.split("").reverse().join("")).reverse();
      furiganas = rf.map((v) => v.split("").reverse().join("")).reverse();
      okuriganas = ro.map((v) => v.split("").reverse().join("")).reverse();
      startsWKana = !isKanji(ortography.charAt(0));

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
  pronunciation: string,
  orthography: string
) {
  const char = orthography.charAt(pos);

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
 * @returns object containing parse info or Error if the two phrases do not match or if the parsed output is invalid.
 * @param pronunciation (furigana)
 * @param orthography (kanji)
 */
export function furiganaParse(pronunciation: string, orthography: string) {
  if (orthography.split("").every((c) => isKanji(c) || isPunctuation(c))) {
    return {
      kanjis: [orthography],
      furiganas: [pronunciation],
      okuriganas: [],
      startsWKana: false,
    };
  }

  const space = new RegExp(/\s/g);
  const hasWhiteSpace = space.test(pronunciation) || space.test(orthography);

  const startsWKana =
    !isKanji(orthography.charAt(0)) && !isFullWNumber(orthography.charAt(0));

  let start = 0;
  let furiganas: string[] = [];
  let kanjis: string[] = [];
  let okuriganas: string[] = [];
  let fword = "";
  let kword = "";
  let oword = "";
  let prevWasKanji = false;

  let i = 0;
  for (let thisChar of orthography.split("")) {
    if (
      !isKanji(thisChar) &&
      !isNumericCounter(i, pronunciation, orthography)
    ) {
      //kana
      if (prevWasKanji) {
        while (pronunciation.charAt(start) !== thisChar) {
          if (pronunciation.charAt(start) !== " ") {
            fword += pronunciation.charAt(start);
          }
          start++;

          if (start > pronunciation.length) {
            const eMsg =
              "The two phrases do not match" +
              (hasWhiteSpace ? " (contains white space)" : "");

            const e = new Error(eMsg, {
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
            return e;
          }
        }
        furiganas.push(fword);
        fword = "";
      }
      if (thisChar !== " ") {
        oword += thisChar;
      }

      if (kword !== "") {
        kanjis.push(kword);
        kword = "";
      }

      start++;
      prevWasKanji = false;
    } else {
      // kanji
      if (pronunciation.charAt(start) !== " ") {
        fword += pronunciation.charAt(start);
      }
      if (thisChar !== " ") {
        kword += thisChar;
      }
      prevWasKanji = true;
      start++;
      if (oword !== "") {
        okuriganas.push(oword);
        oword = "";
      }

      if (orthography.length - i === 1) {
        // (this) last character is a kanji
        if (pronunciation.slice(start) !== " ") {
          fword += pronunciation.slice(start);
        }
        furiganas.push(fword);
        kanjis.push(kword);
      }
    }
    i++;
  }

  if (oword !== "") {
    okuriganas.push(oword);
  }

  const [pronunciationOutput, orthographyOutput] = validateParseFurigana(
    kanjis,
    furiganas,
    okuriganas,
    startsWKana
  );

  // remove spaces which are used as a workaround for parsing failure due to repeated chars
  const pronunciationNoSpace = pronunciation.replaceAll(" ", "");
  const ortographyNoSpace = orthography.replaceAll(" ", "");

  if (
    pronunciationOutput !== pronunciationNoSpace ||
    orthographyOutput !== ortographyNoSpace
  ) {
    const eMsg =
      "Failed to parse text to build furigana" +
      (hasWhiteSpace ? " (contains white space)" : "");

    const e = new Error(eMsg, {
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

    return e;
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
    const isAllKana = vocabulary.pronounce
      .split("")
      .every((c) => isHiragana(c) || isKatakana(c));

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
    q = spelling.replaceAll(" ", "");
  }
  return q;
}
