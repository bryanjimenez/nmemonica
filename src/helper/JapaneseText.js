import classNames from "classnames";
import React from "react";
import { isHiragana, isKanji, isKatakana, isPunctuation } from "./kanaHelper";

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
        const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParseRetry(
          this._furigana,
          this._kanji
        );
        htmlElement = buildHTMLElement(
          kanjis,
          furiganas,
          nonKanjis,
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
 * @returns  {{ kanjis:String[], furiganas:String[], nonKanjis:String[], startsWKana:boolean }} object containing parse info
 * @throws if the two phrases do not match or if the parsed output is invalid.
 * @param {String} pronunciation (hiragana)
 * @param {String} orthography (kanji)
 */
export function furiganaParseRetry(pronunciation, ortography) {
  let kanjis, furiganas, nonKanjis, startsWKana;
  try {
    ({ kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
      pronunciation,
      ortography
    ));
  } catch (e) {
    // don't retry unless parse error
    if (e.name === "ParseError") {
      // reverse try
      try {
        const rp = pronunciation.split("").reverse().join("");
        const ro = ortography.split("").reverse().join("");

        const {
          kanjis: rk,
          furiganas: rf,
          nonKanjis: rnk,
        } = furiganaParse(rp, ro);

        kanjis = rk.map((v) => v.split("").reverse().join("")).reverse();
        furiganas = rf.map((v) => v.split("").reverse().join("")).reverse();
        nonKanjis = rnk.map((v) => v.split("").reverse().join("")).reverse();
        startsWKana = !isKanji(ortography.charAt(0));

        return { kanjis, furiganas, nonKanjis, startsWKana };
      } catch {}
    }
    throw e;
  }

  return { kanjis, furiganas, nonKanjis, startsWKana };
}

/**
 * @returns  {{ kanjis:String[], furiganas:String[], nonKanjis:String[], startsWKana:boolean }} object containing parse info
 * @throws if the two phrases do not match or if the parsed output is invalid.
 * @param {String} pronunciation (hiragana)
 * @param {String} orthography (kanji)
 */
export function furiganaParse(pronunciation, orthography) {
  if (orthography.split("").every((c) => isKanji(c) || isPunctuation(c))) {
    return {
      kanjis: [orthography],
      furiganas: [pronunciation],
      nonKanjis: [],
      startsWKana: false,
    };
  }

  const startsWKana = !isKanji(orthography.charAt(0));

  let start = 0;
  let furiganas = [];
  let kanjis = [];
  let nonKanjis = [];
  let fword = "";
  let kword = "";
  let nword = "";
  let prevWasKanji = false;

  orthography.split("").forEach((thisChar, i) => {
    if (!isKanji(thisChar)) {
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
              nonKanjis,
            };
            throw e;
          }
        }
        furiganas.push(fword);
        fword = "";
      }
      if (thisChar !== " ") {
        nword += thisChar;
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
      if (nword !== "") {
        nonKanjis.push(nword);
        nword = "";
      }

      if (orthography.length - i === 1) {
        // (this) last character is a kanji
        if (pronunciation.substr(start) !== " ") {
          fword += pronunciation.substr(start);
        }
        furiganas.push(fword);
        kanjis.push(kword);
      }
    }
  });
  if (nword !== "") {
    nonKanjis.push(nword);
  }

  const [pronunciationOutput, orthographyOutput] = validateParseFurigana(
    kanjis,
    furiganas,
    nonKanjis,
    startsWKana
  );

  // remove spaces which are used as a workaround for parsing failure due to repeated chars
  const pronunciationNoSpace = pronunciation.split(" ").join("");
  const ortographyNoSpace = orthography.split(" ").join("");

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

  return { kanjis, furiganas, nonKanjis, startsWKana };
}

/**
 * @returns {[String,String]} pronunciation, orthography
 * @param {String[]} kanjis
 * @param {String[]} furiganas
 * @param {String[]} nonKanjis
 * @param {boolean} startsWKana
 */
export function validateParseFurigana(
  kanjis,
  furiganas,
  nonKanjis,
  startsWKana
) {
  let pronunciation, orthography;

  if (startsWKana) {
    orthography = nonKanjis.reduce((a, n, i) => a + n + (kanjis[i] || ""), "");
    pronunciation = nonKanjis.reduce(
      (a, n, i) => a + n + (furiganas[i] || ""),
      ""
    );
  } else {
    orthography = kanjis.reduce((a, k, i) => a + k + (nonKanjis[i] || ""), "");
    pronunciation = furiganas.reduce(
      (a, f, i) => a + f + (nonKanjis[i] || ""),
      ""
    );
  }

  return [pronunciation, orthography];
}

/**
 * @returns {*} HTML element
 * @param {String[]} kanjis
 * @param {String[]} furiganas
 * @param {String[]} nonKanjis
 * @param {boolean} startsWKana
 */
export function buildHTMLElement(
  kanjis,
  furiganas,
  nonKanjis,
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
    nonKanjis.length > kanjiWFurigana.length
      ? nonKanjis.length
      : kanjiWFurigana.length;

  while (i < items) {
    if (startsWKana) {
      //starts with hiragana
      sentence.push(
        <span key={i}>
          {nonKanjis[i]}
          {kanjiWFurigana[i]}
        </span>
      );
    } else {
      //starts with kanji
      sentence.push(
        <span key={i}>
          {kanjiWFurigana[i]}
          {nonKanjis[i]}
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
        const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParseRetry(
          pronunciation,
          orthography
        );

        const firstKanji = kanjis[0][0];
        const firstFurigana = furiganas[0][0];
        const firstnonKanji =
          nonKanjis.length > 0 ? nonKanjis[0][0] : undefined;

        if (startsWKana) {
          //starts with hiragana
          hint = <span>{firstnonKanji}</span>;
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
    q = spelling.split(" ").join("");
  }
  return q;
}
