import React from "react";

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
 * @returns html element to display a japanese phrase that can include furigana
 * @throws if the two phrases do not match.
 * @param {*} phrases Two phrases separated by \n. First phrase is in hiragana the second is the equivalent with kanji.
 */
export function furiganaParse(phrases) {
  let sentence;

  const [pronunciation, orthography] = phrases.split("\n");
  const startsWHiragana = isHiragana(orthography.charAt(0));

  let start = 0;
  let furiganas = [];
  let kanjis = [];
  let nonKanjis = [];
  let fword = "";
  let kword = "";
  let nword = "";
  let prevWasKanji = false;

  orthography.split("").map((thisChar) => {
    if (isHiragana(thisChar)) {
      //hiragana
      if (prevWasKanji) {
        while (pronunciation.charAt(start) != thisChar) {
          fword += pronunciation.charAt(start);
          start++;

          if (start > pronunciation.length) {
            throw "The two phrases do not match";
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
    }
  });
  nonKanjis.push(nword);

  // console.log(furiganas);
  // console.log(kanjis);
  // console.log(non);
  return { kanjis, furiganas, nonKanjis, startsWHiragana };
}

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
