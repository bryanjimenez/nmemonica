import React from "react";

/**
 * @returns html element to display a japanese phrase that can include furigana
 * @throws if the two phrases do not match.
 * @param {*} phrases Two phrases separated by \n. First phrase is in hiragana the second is the equivalent with kanji.
 */
export function furiganaParse(phrases) {
  let sentence;
  if (phrases.indexOf("\n") === -1) {
    sentence = phrases;
  } else {
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
      ゃ: true,
      ゆ: true,
      ゅ: true,
      よ: true,
      ょ: true,
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
    };

    const [pronunciation, kanji] = phrases.split("\n");

    let start = 0;
    let furiganas = [];
    let kanjis = [];
    let non = [];
    let fword = "";
    let kword = "";
    let nword = "";
    let prevWasKanji = false;

    kanji.split("").map((thisChar) => {
      if (hiragana[thisChar] || false) {
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
          non.push(nword);
          nword = "";
        }
      }
    });
    non.push(nword);

    const kanjiWFurigana = kanjis.map((kanji, i) => (
      <ruby>
        {kanji}
        <rt>{furiganas[i]}</rt>
      </ruby>
    ));

    if (hiragana[kanji.charAt(0)] || false) {
      //starts with hiragana
      sentence = non.map((n, i) => {
        if (i <= kanjiWFurigana.length) {
          return (
            <span>
              {n}
              {kanjiWFurigana[i]}
            </span>
          );
        }
      });
    } else {
      //starts with kanji
      sentence = non.map((n, i) => {
        if (i <= kanjiWFurigana.length) {
          return (
            <span>
              {kanjiWFurigana[i]}
              {n}
            </span>
          );
        }
      });
    }

    // console.log(furiganas);
    // console.log(kanjis);
    // console.log(non);
  }

  return sentence;
}
