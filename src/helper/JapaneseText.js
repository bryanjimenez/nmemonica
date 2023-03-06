import classNames from "classnames";
import React from "react";
import {
  isHiragana,
  isKanji,
  isFullWNumber,
  isKatakana,
  isPunctuation,
  toEnglishNumber,
} from "./kanaHelper";
import { buildRubyElement, getParseObjectMask, wrap } from "./kanjiHelper";

/**
 * @typedef {import("../typings/raw").RawJapanese} RawJapanese
 * @typedef {import("../typings/raw").FuriganaParseObject} FuriganaParseObject
 */

export class JapaneseText {
  /**
   * @param {string} furigana
   * @param {string} [kanji]
   */
  constructor(furigana, kanji) {
    this._furigana = furigana;
    this._kanji = kanji;

    /** @type {FuriganaParseObject} */
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
      this._parseObj.startsWKana === false
    ) {
      if (this.hasFurigana()) {
        this._parseObj = furiganaParseRetry(
          this.getPronunciation(),
          this.getSpelling()
        );
      } else {
        this._parseObj = {
          okuriganas: [this.getSpelling()],
          startsWKana: true,
          kanjis: [],
          furiganas: [],
        };
      }
    }

    return this._parseObj;
  }

  hasFurigana() {
    return this._kanji ? true : false;
  }

  /**
   * @returns {string} spelling may contain kanji
   */
  getSpelling() {
    if (this._kanji) {
      return this._kanji;
    } else {
      return this._furigana;
    }
  }

  /**
   * @returns {string} pronunciation only in hiragana
   */
  getPronunciation() {
    return this._furigana;
  }

  getObject() {
    return { furigana: this._furigana, kanji: this._kanji };
  }

  /**
   * @param {RawJapanese} rawObj
   */
  static parse = (rawObj) => japaneseTextParse(rawObj);
  static parser = japaneseTextParse;

  isSlang() {
    return this.slang === true;
  }

  isKeigo() {
    return this.keigo === true;
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

  toString() {
    return this._furigana + (this._kanji ? "\n" + this._kanji : "");
  }

  /**
   * @param {number} minimumMora
   * @returns {boolean} meets minimumMora criteria and is parsable
   */
  isHintable(minimumMora = 3) {
    let hint = true;
    const text = this;

    if (text.hasFurigana()) {
      const pronunciation = text.getPronunciation();
      const orthography = text.getSpelling();

      if (pronunciation.length < minimumMora) {
        hint = false;
      } else {
        try {
          furiganaParseRetry(pronunciation, orthography);
        } catch (e) {
          console.log(e);
          // logger...
          hint = false;
        }
      }
    } else {
      // no kanji
      const kana = text.getSpelling();
      if (kana.length < minimumMora) {
        hint = false;
      }
    }

    return hint;
  }

  /**
   * @returns {JSX.Element|undefined}
   * @param {function} kanaHintBuilder
   * @param {function} furiganaHintBuilder
   * @param {number} [minMora] minimum mora japaneseText must have for hint
   * @param {number} [hintMora] number of mora to hint
   */
  getHint(kanaHintBuilder, furiganaHintBuilder, minMora = 3, hintMora = 1) {
    const hiddenElCSS = "transparent-color";
    const shownElCSS = "hint-mora";

    const hintCSS = { shown: shownElCSS, hidden: hiddenElCSS };

    let hint;

    if (!this.isHintable(minMora)) {
      hint = undefined;
    } else {
      if (this.hasFurigana()) {
        const pronunciation = this.getPronunciation();
        const orthography = this.getSpelling();

        const { kanjis, furiganas, okuriganas, startsWKana } =
          furiganaParseRetry(pronunciation, orthography);
        hint = furiganaHintBuilder(
          hintCSS,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana,
          hintMora
        );
      } else {
        // no kanji
        const kana = this.getSpelling();
        hint = kanaHintBuilder(hintCSS, kana, hintMora);
      }
    }

    return hint;
  }

  /**
   *
   * @param {{furigana:{show?:boolean, toggle?:function}}} [options]
   * @returns {JSX.Element}
   */
  toHTML(options) {
    let htmlElement;

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
          classNames({ clickable: !!furiganaToggle }) || undefined;
        const toggleHandler = furiganaToggle
          ? /** @type {React.MouseEventHandler } */ (furiganaToggle)
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
        console.error(e);
        htmlElement = fallBackHtml;
      }
    }

    return htmlElement;
  }
}

/**
 * Static parsing fn for JapaneseText and sub types
 * @param {RawJapanese} rawObj
 * @param {(constructorParams:RawJapanese)=>JapaneseText} [constructorFn]
 * @returns {JapaneseText}
 */
function japaneseTextParse(rawObj, constructorFn) {
  const constructorParams = rawObj.japanese.split("\n");

  let jText;
  if (typeof constructorFn === "function") {
    jText = constructorFn(rawObj);
  } else {
    const [furigana, kanji] = constructorParams;
    jText = new JapaneseText(furigana, kanji);
  }

  if (rawObj.slang && rawObj.slang === true) {
    jText.slang = true;
  }
  if (rawObj.keigo && rawObj.keigo === true) {
    jText.keigo = true;
  }
  if (rawObj.adj && (rawObj.adj === "na" || rawObj.adj === "i")) {
    jText.adj = rawObj.adj;
  }

  return jText;
}

/**
 * @returns  {{ kanjis:string[], furiganas:string[], okuriganas:string[], startsWKana:boolean }} object containing parse info
 * @throws {Error} if the two phrases do not match or if the parsed output is invalid.
 * @param {string} pronunciation (hiragana)
 * @param {string} ortography (kanji)
 */
export function furiganaParseRetry(pronunciation, ortography) {
  let kanjis, furiganas, okuriganas, startsWKana;
  try {
    ({ kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
      pronunciation,
      ortography
    ));
  } catch (e) {
    // don't retry unless parse error
    // @ts-expect-error Error.cause
    if (e instanceof Error && e.cause?.code === "ParseError") {
      // reverse try
      try {
        const rP = pronunciation.split("").reverse().join("");
        const rW = ortography.split("").reverse().join("");

        const {
          kanjis: rk,
          furiganas: rf,
          okuriganas: ro,
        } = furiganaParse(rP, rW);

        kanjis = rk.map((v) => v.split("").reverse().join("")).reverse();
        furiganas = rf.map((v) => v.split("").reverse().join("")).reverse();
        okuriganas = ro.map((v) => v.split("").reverse().join("")).reverse();
        startsWKana = !isKanji(ortography.charAt(0));

        return { kanjis, furiganas, okuriganas, startsWKana };
      } catch {
        // throw in outer try
      }
    }
    throw e;
  }

  return { kanjis, furiganas, okuriganas, startsWKana };
}

/**
 * is orthography[pos] a number that has furigana
 * @param {number} pos the characters position in ortography
 * @param {string} pronunciation
 * @param {string} orthography
 * @returns {boolean} whether is numeric with furigana
 */
export function isNumericCounter(pos, pronunciation, orthography) {
  const char = orthography.charAt(pos);

  return (
    Number.isInteger(toEnglishNumber(char)) || // is Japanese arabic number char
    (Number.isInteger(Number.parseInt(char)) && // is a number
      !pronunciation.includes(char) && // the number has furigana
      !isKanji(char) &&
      !isHiragana(char) &&
      !isKatakana(char) &&
      pos < orthography.length - 1) // cannot be the last character
  );
}
/**
 * @returns  {{ kanjis:string[], furiganas:string[], okuriganas:string[], startsWKana:boolean }} object containing parse info
 * @throws {Error} if the two phrases do not match or if the parsed output is invalid.
 * @param {string} pronunciation (furigana)
 * @param {string} orthography (kanji)
 */
export function furiganaParse(pronunciation, orthography) {
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
  /**
   * @type {string[]}
   */
  let furiganas = [];
  /**
   * @type {string[]}
   */
  let kanjis = [];
  /**
   * @type {string[]}
   */
  let okuriganas = [];
  let fword = "";
  let kword = "";
  let oword = "";
  let prevWasKanji = false;

  orthography.split("").forEach((thisChar, i) => {
    if (
      !isKanji(thisChar) &&
      !isNumericCounter(i, pronunciation, orthography)
    ) {
      //kana
      if (prevWasKanji) {
        while (pronunciation.charAt(start) != thisChar) {
          if (pronunciation.charAt(start) !== " ") {
            fword += pronunciation.charAt(start);
          }
          start++;

          if (start > pronunciation.length) {
            const eMsg =
              "The two phrases do not match" +
              (hasWhiteSpace ? " (contains white space)" : "");

            // @ts-expect-error Error.cause
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

            throw e;
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
  });
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
    // @ts-expect-error Error.cause
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

    throw e;
  }

  return { kanjis, furiganas, okuriganas, startsWKana };
}

/**
 * @returns {[string,string]} pronunciation, orthography
 * @param {string[]} kanjis
 * @param {string[]} furiganas
 * @param {string[]} okuriganas
 * @param {boolean} startsWKana
 */
export function validateParseFurigana(
  kanjis,
  furiganas,
  okuriganas,
  startsWKana
) {
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
 * @returns {string} kana pronunciation or it's spelling
 * @param {RawJapanese} vocabulary data object
 */
export function audioPronunciation(vocabulary) {
  let q;
  if (vocabulary.pronounce) {
    const isAllKana = vocabulary.pronounce
      .split("")
      .every((c) => isHiragana(c) || isKatakana(c));

    if (isAllKana) {
      q = vocabulary.pronounce;
    } else {
      // @ts-expect-error Error.cause
      const error = new Error("No valid pronunciation", {
        cause: { code: "InvalidPronunciation", value: vocabulary },
      });

      throw error;
    }
  } else {
    const w = JapaneseText.parse(vocabulary);
    const spelling = w.getSpelling();
    // remove workaround-spaces
    q = spelling.replaceAll(" ", "");
  }
  return q;
}
