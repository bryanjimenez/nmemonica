import data from "../../data/hiragana.json";

/**
 * @returns a boolean
 * @param {*} char the character to check against the Hiragana alphabet
 */
export function isHiragana(char) {
  const hiragana = {
    あ: true,
    い: true,
    う: true,
    え: true,
    お: true,
    か: true,
    き: true,
    く: true,
    け: true,
    こ: true,
    が: true,
    ぎ: true,
    ぐ: true,
    げ: true,
    ご: true,
    さ: true,
    し: true,
    す: true,
    せ: true,
    そ: true,
    ざ: true,
    じ: true,
    ず: true,
    ぜ: true,
    ぞ: true,
    た: true,
    ち: true,
    つ: true,
    て: true,
    と: true,
    だ: true,
    ぢ: true,
    づ: true,
    で: true,
    ど: true,
    な: true,
    に: true,
    ぬ: true,
    ね: true,
    の: true,
    は: true,
    ひ: true,
    ふ: true,
    へ: true,
    ほ: true,
    ば: true,
    び: true,
    ぶ: true,
    べ: true,
    ぼ: true,
    ぱ: true,
    ぴ: true,
    ぷ: true,
    ぺ: true,
    ぽ: true,
    ま: true,
    み: true,
    む: true,
    め: true,
    も: true,
    や: true,
    ゆ: true,
    よ: true,
    ら: true,
    り: true,
    る: true,
    れ: true,
    ろ: true,
    わ: true,
    ゐ: true,
    ゑ: true,
    を: true,
    ん: true,
    "。": true,
    ゃ: true,
    ゅ: true,
    ょ: true,
    っ: true,
    ゝ: true,
    ゞ: true,
  };

  return hiragana[char] ? true : false;
}

/**
 * gets the indexes of the character in the hiragana chart
 * @param {*} character
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
