import React from "react";
import data from "../../data/kana.json";

/**
 * @returns {boolean}
 * @param {string} char the character to check against the Kanji table
 */
export function isKanji(char) {
  const common = "\u4E00-\u9FAF";
  const rare = "\u3400-\u4DBF";
  const exception = "\u3005"; // noma repeater from isPunctuation
  return new RegExp("[" + common + rare + exception + "]").test(char);
}

/**
 * @returns {boolean}
 * @param {string} char the character to check against the Hiragana table
 */
export function isHiragana(char) {
  return new RegExp("[\u3041-\u309F]").test(char);
}

/**
 * @returns {boolean}
 * @param {string} char the character to check against the Katakana table
 */
export function isKatakana(char) {
  const fullWidth = "\u30A0-\u30FF";
  const halfWidth = "\uFF66-\uFF9F"; /*eslint-disable-line*/ // FIXME: is this needed?
  return new RegExp("[" + fullWidth + "]").test(char);
}

/**
 * @param {string} char character to check if is little
 */
export function isYoon(char) {
  return new RegExp("^[ゃャゅュょョ]$").test(char);
}

/**
 * @returns {boolean}
 * @param {string} char the character to check against the punctuation table
 */
export function isFullWNumber(char) {
  // English
  const eNumber = "\uFF10-\uFF19";

  return new RegExp("[" + eNumber + "]").test(char);
}

/**
 * @returns {boolean}
 * @param {string} char the character to check against the punctuation table
 */
export function isPunctuation(char) {
  // English
  const eSymbol = "\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF5E";
  const eLetter = "\uFF21-\uFF3A\uFF41-\uFF5A"; /* eslint-disable-line */

  // Japanese
  const jFP = "\u3000-\u3004\u3006-\u303F"; // full width punctuation
  const jHP = "\uFF61-\uFF65"; // half width
  return new RegExp("[" + jFP + jHP + eSymbol + "]").test(char);
}

/**
 * swaps hiragana for katakana and vicecersa
 * @returns {string}
 * @param {string} char
 */
export function swapKana(char) {
  let swap = char;
  if (isHiragana(char)) {
    const cpv = char.codePointAt(0);
    if (cpv) {
      const katakana = cpv + 96;
      swap = String.fromCharCode(katakana);
    }
  } else if (isKatakana(char)) {
    const cpv = char.codePointAt(0);
    if (cpv) {
      const hiragana = cpv - 96;
      swap = String.fromCharCode(hiragana);
    }
  }

  return swap;
}

/**
 * @param {string} particle
 */
export function romajiParticle(particle) {
  let romaji;
  switch (particle) {
    case "は":
      romaji = "wa";
      break;
    case "には":
      romaji = "niwa";
      break;
    case "を":
      romaji = "o";
      break;
    case "って":
      romaji = "tte";
      break;
    default:
      romaji = particle
        .split("")
        .map((char) => swapToRomaji(char))
        .join("");
  }
  return romaji;
}

/**
 * Kana to romaji
 * @param {string} kana
 */
export function swapToRomaji(kana) {
  let swap = kana;
  if (isHiragana(kana)) {
    const { iConsonant, iVowel } = getConsonantVowel(kana);
    swap = data.consonants[iConsonant] + data.vowels[iVowel];
  } else if (isKatakana(kana)) {
    const cpv = kana.codePointAt(0);
    if (cpv) {
      const hiragana = cpv - 96;
      const h = String.fromCharCode(hiragana);
      const { iConsonant, iVowel } = getConsonantVowel(h);
      swap = data.consonants[iConsonant] + data.vowels[iVowel];
    }
  }

  return swap;
}

/**
 * swaps Full-width roman characters number to number
 * @returns {number}
 * @param {string} char
 */
export function toEnglishNumber(char) {
  let swap = Number.NaN;
  if (isFullWNumber(char)) {
    const cpv = char.codePointAt(0);
    if (cpv) {
      const katakana = cpv - 65249;
      swap = Number.parseInt(String.fromCharCode(katakana));
    }
  }

  return swap;
}

/**
 * gets the indexes of the character in the hiragana chart
 * @param {string} character
 * @returns {{iConsonant:number, iVowel:number}}
 */
export function getConsonantVowel(character) {
  const hiragana = data.hiragana;
  const xMax = Math.floor(hiragana[0].length);
  const yMax = Math.floor(hiragana.length);
  let iConsonant = -1;
  let iVowel = -1;

  if (character === " " || character === "") {
    return { iConsonant, iVowel };
  } else if (character === "ん") {
    return { iConsonant: 15, iVowel };
  }

  for (let vowel = 0; vowel < xMax; vowel++) {
    if (iConsonant < 0) {
      for (let consonant = 0; consonant < yMax; consonant++) {
        if (hiragana[consonant][vowel] === character) {
          iConsonant = consonant;
          iVowel = vowel;
          break;
        }
      }
    } else {
      break;
    }
  }

  return { iConsonant, iVowel };
}

/**
 * @param {{hidden:string, shown:string}} css
 * @param {string} kana
 * @param {number} hintMora
 */
export function kanaHintBuilder(css, kana, hintMora) {
  return (
    <span className="hint">
      <span className={css.shown}>{kana.slice(0, hintMora)}</span>
      <span className={css.hidden}>{kana.slice(hintMora)}</span>
    </span>
  );
}
