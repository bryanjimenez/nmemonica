import data from "../../data/kana.json";

/**
 * @returns {Boolean}
 * @param {String} char the character to check against the Kanji table
 */
export function isKanji(char) {
  const common = "\u4E00-\u9FAF";
  const rare = "\u3400-\u4DBF";
  const exception = "\u3005";   // noma repeater from isPunctuation
  return new RegExp("[" + common + rare + exception + "]").test(char);
}

/**
 * @returns {Boolean}
 * @param {String} char the character to check against the Hiragana table
 */
export function isHiragana(char) {
  return new RegExp("[\u3041-\u309F]").test(char);
}

/**
 * @returns {Boolean}
 * @param {String} char the character to check against the Katakana table
 */
export function isKatakana(char) {
  const fullWidth = "\u30A0-\u30FF";
  const halfWidth = "\uFF66-\uFF9F"; // FIXME: is this needed?
  return new RegExp("[" + fullWidth + "]").test(char);
}

/**
 * @returns {Boolean}
 * @param {String} char the character to check against the punctuation table
 */
export function isPunctuation(char) {
  // English
  const eSymbol = "\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF5E";
  const eLetter = "\uFF21-\uFF3A\uFF41-\uFF5A";
  const eNumber = "\uFF10-\uFF19";

  // Japanese
  const jFP = "\u3000-\u3004\u3006-\u303F"; // full width punctuation
  const jHP = "\uFF61-\uFF65"; // half width
  return new RegExp("[" + jFP + jHP + eSymbol + "]").test(char);
}

/**
 * swaps hiragana for katakana and vicecersa
 * @returns {String}
 * @param {String} char
 */
export function swapKana(char) {
  let swap;
  if (isHiragana(char)) {
    const katakana = char.codePointAt(0) + 96;
    swap = String.fromCharCode(katakana);
  } else if (isKatakana(char)) {
    const hiragana = char.codePointAt(0) - 96;
    swap = String.fromCharCode(hiragana);
  } else {
    swap = char;
  }

  return swap;
}

/**
 * gets the indexes of the character in the hiragana chart
 * @param {String} character
 * @returns {{iConsonant:Number, iVowel:Number}}
 */
export function getConsonantVowel(character) {
  const hiragana = data.hiragana;
  const xMax = Math.floor(hiragana[0].length);
  const yMax = Math.floor(hiragana.length);
  let iConsonant;
  let iVowel;

  for (let vowel = 0; vowel < xMax; vowel++) {
    if (!iConsonant) {
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
