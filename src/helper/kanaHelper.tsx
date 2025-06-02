import data from "../../res/json/kana.json";

/**
 * @param char the character to check against the Kanji table
 */
export function isKanji(char: string) {
  const common = "\u4E00-\u9FAF";
  const rare = "\u3400-\u4DBF";
  const exception = "\u3005"; // noma repeater from isPunctuation
  return new RegExp("[" + common + rare + exception + "]").test(char);
}

/**
 * @param char the character to check against the Hiragana table
 */
export function isHiragana(char: string) {
  return new RegExp("[\u3041-\u309F]").test(char);
}

/**
 * @param char the character to check against the Katakana table
 */
export function isKatakana(char: string) {
  const fullWidth = "\u30A0-\u30FF";
  return new RegExp("[" + fullWidth + "]").test(char);
}

/**
 * @param char character to check if is little
 */
export function isYoon(char: string) {
  return new RegExp("^[ゃャゅュょョ]$").test(char);
}

/**
 * @param char the character to check against the punctuation table
 */
export function isFullWNumber(char: string) {
  // English
  const eNumber = "\uFF10-\uFF19";

  return new RegExp("[" + eNumber + "]").test(char);
}

/**
 * @param char the character to check against the punctuation table
 */
export function isPunctuation(char: string) {
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
 * @param char
 */
export function swapKana(char: string) {
  let swap = char;
  if (isHiragana(char)) {
    const cpv = char.codePointAt(0);
    if (typeof cpv === "number") {
      const katakana = cpv + 96;
      swap = String.fromCharCode(katakana);
    }
  } else if (isKatakana(char)) {
    const cpv = char.codePointAt(0);
    if (typeof cpv === "number") {
      const hiragana = cpv - 96;
      swap = String.fromCharCode(hiragana);
    }
  }

  return swap;
}

/**
 * @param particle
 */
export function romajiParticle(particle: string) {
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
 * @param kana
 */
export function swapToRomaji(kana: string) {
  let swap = kana;
  if (isHiragana(kana)) {
    const { iConsonant, iVowel } = getConsonantVowel(kana);
    swap = data.consonants[iConsonant] + data.vowels[iVowel];
  } else if (isKatakana(kana)) {
    const cpv = kana.codePointAt(0);
    if (typeof cpv === "number") {
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
 * @param char
 */
export function toEnglishNumber(char: string) {
  let swap = Number.NaN;
  if (isFullWNumber(char)) {
    const cpv = char.codePointAt(0);
    if (typeof cpv === "number") {
      const katakana = cpv - 65248;
      swap = Number.parseInt(String.fromCharCode(katakana));
    }
  }

  return swap;
}

/**
 * gets the indexes of the character in the hiragana chart
 * @param character
 */
export function getConsonantVowel(character: string) {
  const hiraganaTable = data.hiragana;

  let iConsonant = -1;
  let iVowel = -1;

  if (character === " " || character === "") {
    return { iConsonant, iVowel };
  } else if (character === "ん") {
    return { iConsonant: 15, iVowel };
  }

  hiraganaTable.some((consonants, yConsonant) => {
    return consonants.some((tableChar, xVowel) => {
      if (tableChar === character) {
        iConsonant = yConsonant;
        iVowel = xVowel;
      }

      return tableChar === character;
    });
  });

  return { iConsonant, iVowel };
}

export function kanaHintBuilder(
  css: { hidden: string; shown: string },
  kana: string,
  hintMora: number
) {
  return (
    <span className="hint">
      <span className={css.shown}>{kana.slice(0, hintMora)}</span>
      <span className={css.hidden}>{kana.slice(hintMora)}</span>
    </span>
  );
}
