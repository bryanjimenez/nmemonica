/** ASCII Printable Characters */
export const printables = "\u0020-\u007E";
/** English phonetic long vowels */

// vowel accents and variations
export const vowelA = "\u00C0-\u00C6\u00E0-\u00E6\u0100-\u0105";
export const vowelE = "\u00C8-\u00CB\u00E8-\u00EB\u0112-\u011B\u018E\u018F";
export const vowelI = "\u00CC-\u00CF\u00EC-\u00EF\u0128-\u012F";
export const vowelO = "\u00D2-\u00D6\u00D8\u00F2-\u00F6\u00F8\u014C-\u0153";
export const vowelU = "\u00D9-\u00DC\u00F9-\u00FC\u0168-\u0173";

export const vowelPhonetics = vowelA + vowelE + vowelI + vowelO + vowelU;

export const unusualApostrophe = "’";

export const newLine = "\n";
export const carRet = "\r";

/** Common Kanji */
export const kanji = "\u4E00-\u9FAF";
/** Rare Kanji */
export const kanjirare = "\u3400-\u4DBF";

export const hiragana = "\u3041-\u309F";
export const katakana = "\u30A0-\u30FF";
export const yoon = "ゃャゅュょョ";

/** English Symbols (as Japanese wide Characters) */
export const eSymbol = "\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF5E";
/** English Letters (as Japanese wide Characters) */
export const eLetter = "\uFF21-\uFF3A\uFF41-\uFF5A";
/** English Numbers (as Japanese wide Characters) */
export const eNumber = "\uFF10-\uFF19";

/** Japanese Punctuations (wide) */
export const jFP = "\u3000-\u3004\u3006-\u303F";
/** Noma Repeater Symbol (wide)*/
export const noma = "\u3005";

/** Japanese Punctuations (half width) */
export const jHP = "\uFF61-\uFF65"; // half width
