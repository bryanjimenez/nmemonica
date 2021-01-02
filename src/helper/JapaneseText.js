import React from "react";
import { isHiragana } from "./hiraganaHelper";

export class JapaneseText {
  constructor(furigana, kanji) {
    this._furigana = furigana;
    this._kanji = kanji;
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

  getObject() {
    return { furigana: this._furigana, kanji: this._kanji };
  }

  static parse(text) {
    let obj;
    if (text.indexOf("\n") > -1) {
      const [furigana, kanji] = text.split("\n");
      obj = new JapaneseText(furigana, kanji);
    } else {
      obj = new JapaneseText(text);
    }
    return obj;
  }

  debug() {
    return JSON.stringify(this);
  }

  toString() {
    return this._furigana + (this._kanji ? "\n" + this._kanji : "");
  }

  toHTML() {
    let htmlElement;
    if (!this.hasFurigana()) {
      htmlElement = <div>{this._furigana}</div>;
    } else {
      try {
        const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
          this._furigana,
          this._kanji
        );
        htmlElement = buildHTMLElement(
          kanjis,
          furiganas,
          nonKanjis,
          startsWHiragana
        );
      } catch (e) {
        console.error(e);
        htmlElement = (
          <div style={{ color: "red" }}>
            <div>{this._furigana}</div>
            <div>{this._kanji}</div>
          </div>
        );
      }
    }

    return htmlElement;
  }
}

/**
 * @returns  { kanjis, furiganas, nonKanjis, startsWHiragana } object containing parse info
 * @throws if the two phrases do not match.
 * @param {String} pronunciation (hiragana)
 * @param {String} orthography (kanji)
 */
export function furiganaParse(pronunciation, orthography) {
  const startsWHiragana = isHiragana(orthography.charAt(0));

  let start = 0;
  let furiganas = [];
  let kanjis = [];
  let nonKanjis = [];
  let fword = "";
  let kword = "";
  let nword = "";
  let prevWasKanji = false;

  orthography.split("").forEach((thisChar, i) => {
    if (isHiragana(thisChar)) {
      //hiragana
      if (prevWasKanji) {
        while (pronunciation.charAt(start) != thisChar) {
          fword += pronunciation.charAt(start);
          start++;

          if (start > pronunciation.length) {
            throw new Error("The two phrases do not match");
          }
        }
        furiganas.push(fword);
        fword = "";
        nword += thisChar;
      } else {
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
      fword += pronunciation.charAt(start);
      kword += thisChar;
      prevWasKanji = true;
      start++;
      if (nword !== "") {
        nonKanjis.push(nword);
        nword = "";
      }

      if (orthography.length - i === 1) {
        // (this) last character is a kanji
        fword += pronunciation.substr(start);
        furiganas.push(fword);
        kanjis.push(kword);
      }
    }
  });
  if (nword !== "") {
    nonKanjis.push(nword);
  }

  return { kanjis, furiganas, nonKanjis, startsWHiragana };
}

/**
 * @returns {*} HTML element
 * @param {String[]} kanjis
 * @param {String[]} furiganas
 * @param {String[]} nonKanjis
 * @param {boolean} startsWHiragana
 */
export function buildHTMLElement(
  kanjis,
  furiganas,
  nonKanjis,
  startsWHiragana
) {
  let sentence = [];
  const kanjiWFurigana = kanjis.map((kanji, i) => (
    <ruby>
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
    if (startsWHiragana) {
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

  return <div>{sentence}</div>;
}
