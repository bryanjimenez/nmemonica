import classNames from "classnames";
import React from "react";
import {
  isHiragana,
  isKanji,
  isKatakana,
  isPunctuation,
  toEnglishNumber,
} from "./kanaHelper";

export class JapaneseText {
  constructor(furigana, kanji) {
    this._furigana = furigana;
    this._kanji = kanji;
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

  hasFurigana() {
    return this._kanji ? true : false;
  }

  /**
   * @returns {String} spelling may contain kanji
   */
  getSpelling() {
    if (this.hasFurigana()) {
      return this._kanji;
    } else {
      return this._furigana;
    }
  }

  /**
   * @returns {String} pronunciation only in hiragana
   */
  getPronunciation() {
    return this._furigana;
  }

  getObject() {
    return { furigana: this._furigana, kanji: this._kanji };
  }

  static parse = japaneseTextParse;

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

  toString() {
    return this._furigana + (this._kanji ? "\n" + this._kanji : "");
  }

  toHTML(options) {
    let htmlElement;

    let furiganaShown;
    let furiganaToggle;
    if (options && options.furigana) {
      furiganaShown = options.furigana.show;
      if (typeof options.furigana.toggle === "function") {
        furiganaToggle = options.furigana.toggle;
      }
    }

    if (!this.hasFurigana()) {
      htmlElement = <span>{this.getSpelling()}</span>;
    } else if (furiganaShown === false) {
      htmlElement = (
        <span
          className={classNames({ clickable: furiganaToggle })}
          onClick={furiganaToggle}
        >
          {this.getSpelling()}
        </span>
      );
    } else {
      try {
        const { kanjis, furiganas, okuriganas, startsWKana } =
          furiganaParseRetry(this.getPronunciation(), this.getSpelling());
        htmlElement = buildHTMLElement(
          kanjis,
          furiganas,
          okuriganas,
          startsWKana,
          furiganaToggle
        );
      } catch (e) {
        console.error(e);

        const eClass = classNames({
          "fs-large": true,
          "incorrect-color": true,
          "d-block": true,
        });

        htmlElement = (
          <span>
            <span className={eClass}>{this.getPronunciation()}</span>
            <span>{this.getSpelling()}</span>
          </span>
        );
      }
    }

    return htmlElement;
  }
}

/**
 * @returns {JapaneseText}
 * @param {*} rawObj
 */
function japaneseTextParse(rawObj, childType) {
  let constructorParams;
  if (rawObj.japanese) {
    // [furigana, kanji]
    constructorParams = rawObj.japanese.split("\n");
  } else {
    constructorParams = rawObj.split("\n");
  }

  let jText;
  if (typeof childType === "function") {
    jText = childType(...constructorParams);
  } else {
    jText = new JapaneseText(...constructorParams);
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
 * @returns  {{ kanjis:String[], furiganas:String[], okuriganas:String[], startsWKana:boolean }} object containing parse info
 * @throws if the two phrases do not match or if the parsed output is invalid.
 * @param {String} pronunciation (hiragana)
 * @param {String} orthography (kanji)
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
    if (e.name === "ParseError") {
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
 * A number that has furigana
 * @param {*} pos the characters position in ortography
 * @param {*} pronunciation
 * @param {*} orthography
 * @returns
 */
export function numericCounter(pos, pronunciation, orthography) {
  const char = orthography.charAt(pos);

  return (
    Number.isInteger(toEnglishNumber(char)) || // is Japanese arabic number char
    (Number.isInteger(Number.parseInt(char)) && // is a number
      pronunciation.indexOf(char) < 0 && // the number has furigana
      !isKanji(char) &&
      !isHiragana(char) &&
      !isKatakana(char) &&
      pos < orthography.length - 1) // cannot be the last character
  );
}
/**
 * @returns  {{ kanjis:String[], furiganas:String[], okuriganas:String[], startsWKana:boolean }} object containing parse info
 * @throws if the two phrases do not match or if the parsed output is invalid.
 * @param {String} pronunciation (hiragana)
 * @param {String} orthography (kanji)
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

  const startsWKana = !isKanji(orthography.charAt(0));

  let start = 0;
  let furiganas = [];
  let kanjis = [];
  let okuriganas = [];
  let fword = "";
  let kword = "";
  let oword = "";
  let prevWasKanji = false;

  orthography.split("").forEach((thisChar, i) => {
    if (!isKanji(thisChar) && !numericCounter(i, pronunciation, orthography)) {
      //kana
      if (prevWasKanji) {
        while (pronunciation.charAt(start) != thisChar) {
          if (pronunciation.charAt(start) !== " ") {
            fword += pronunciation.charAt(start);
          }
          start++;

          if (start > pronunciation.length) {
            const e = new Error("The two phrases do not match");
            e.name = "InputError";
            e.data = {
              input: { pronunciation, orthography },
              kanjis,
              furiganas,
              okuriganas,
            };
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
  const pronunciationNoSpace = pronunciation.replaceAll(" ","");
  const ortographyNoSpace = orthography.replaceAll(" ","");

  if (
    pronunciationOutput !== pronunciationNoSpace ||
    orthographyOutput !== ortographyNoSpace
  ) {
    const err = new Error("Failed to parse text to build furigana");
    err.name = "ParseError";
    err.data = {
      input: { pronunciation, orthography },
      output: {
        pronunciation: pronunciationOutput,
        orthography: orthographyOutput,
      },
    };
    throw err;
  }

  return { kanjis, furiganas, okuriganas, startsWKana };
}

/**
 * @returns {[String,String]} pronunciation, orthography
 * @param {String[]} kanjis
 * @param {String[]} furiganas
 * @param {String[]} okuriganas
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
 * @returns {*} HTML element
 * @param {String[]} kanjis
 * @param {String[]} furiganas
 * @param {String[]} okuriganas
 * @param {boolean} startsWKana
 */
export function buildHTMLElement(
  kanjis,
  furiganas,
  okuriganas,
  startsWKana,
  furiganaToggle
) {
  let sentence = [];
  const kanjiWFurigana = kanjis.map((kanji, i) => (
    <ruby key={i}>
      {kanji}
      <rt>{furiganas[i]}</rt>
    </ruby>
  ));

  let i = 0;
  let items =
    okuriganas.length > kanjiWFurigana.length
      ? okuriganas.length
      : kanjiWFurigana.length;

  while (i < items) {
    if (startsWKana) {
      //starts with hiragana
      sentence.push(
        <span key={i}>
          {okuriganas[i]}
          {kanjiWFurigana[i]}
        </span>
      );
    } else {
      //starts with kanji
      sentence.push(
        <span key={i}>
          {kanjiWFurigana[i]}
          {okuriganas[i]}
        </span>
      );
    }
    i++;
  }

  return (
    <span
      className={classNames({ clickable: furiganaToggle })}
      onClick={furiganaToggle}
    >
      {sentence}
    </span>
  );
}

/**
 * when the japaneseText is less than minChars undefined is returned
 * otherwise the first kanji with furigana or first hiragan/katakana is returned
 * @returns {HTML|undefined}
 * @param {String} japaneseText
 */
export function htmlElementHint(japaneseText) {
  const minChars = 3;
  let pronunciation, orthography, hint;

  if (japaneseText.indexOf("\n") > -1) {
    [pronunciation, orthography] = japaneseText.split("\n");

    if (pronunciation.length < minChars) {
      hint = undefined;
    } else {
      try {
        const { kanjis, furiganas, okuriganas, startsWKana } =
          furiganaParseRetry(pronunciation, orthography);

        const firstKanji = kanjis[0][0];
        const firstFurigana = furiganas[0][0];
        const firstOkurigana =
          okuriganas.length > 0 ? okuriganas[0][0] : undefined;

        if (startsWKana) {
          //starts with hiragana
          hint = <span>{firstOkurigana}</span>;
        } else {
          //starts with kanji
          const kanjiWFurigana = (
            <ruby>
              {firstKanji}
              <rt>{firstFurigana}</rt>
            </ruby>
          );
          hint = <span>{kanjiWFurigana}</span>;
        }
      } catch (e) {
        hint = undefined;
      }
    }
  } else {
    // no kanji
    if (japaneseText.length < minChars) {
      hint = undefined;
    } else {
      hint = <span>{japaneseText[0]}</span>;
    }
  }

  return hint;
}

/**
 * when word has override pronounce attr it is used otherwise the spelling is used
 * @returns {String} hiragana pronunciation
 * @param {{japanese: String, pronounce: String|undefined}} vocabulary data object
 */
export function audioPronunciation(vocabulary) {
  let q;
  if (vocabulary.pronounce) {
    const isHiraganaWord = !vocabulary.pronounce
      .split("")
      .some((c) => !isHiragana(c));

    const isKatakanaWord = !vocabulary.pronounce
      .split("")
      .some((c) => !isKatakana(c));

    if (isHiraganaWord || isKatakanaWord) {
      q = vocabulary.pronounce;
    } else {
      console.warn("pronunciation is not hiragana or katakana");
    }
  } else {
    const w = JapaneseText.parse(vocabulary.japanese);
    const spelling = w.getSpelling();
    // remove workaround-spaces
    q = spelling.replaceAll(" ","");
  }
  return q;
}
