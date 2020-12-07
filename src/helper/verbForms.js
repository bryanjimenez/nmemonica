import data from "../../data/hiragana.json";
import { getConsonantVowel } from "./parser";

/**
 * @returns the masu form of a verb
 * @param {*} dictionaryForm verb in dictionary form
 */
export function masuForm(dictionaryForm) {
  // irregulars
  let masu;
  switch (dictionaryForm) {
    case "する":
      masu = "します";
      break;
    case "くる\n来る":
      masu = "きます\n来ます";
      break;
    case "ある":
      masu = "あります";
      break;
    case "だ":
      masu = "です";
      break;
  }

  if (!masu) {
    // not irregular
    const hiragana = data.hiragana;

    let pronunciation = dictionaryForm;
    const kanji = dictionaryForm.indexOf("\n") > -1 ? true : false;

    let orthography, orVerbArr, orLastChar, orFirstPart;

    if (kanji) {
      [pronunciation, orthography] = dictionaryForm.split("\n");
      orVerbArr = orthography.split("");
      orLastChar = orVerbArr.pop();
      orFirstPart = orVerbArr.join("");
    }

    const verbArr = pronunciation.split("");
    const lastChar = verbArr.pop();
    const firstPart = verbArr.join("");

    // u-verbs
    if (dictionaryVerbClass(dictionaryForm) === 1 || lastChar !== "る") {
      const iVowel = 1;
      const { iConsonant } = getConsonantVowel(lastChar);

      if (kanji) {
        masu =
          firstPart +
          hiragana[iConsonant][iVowel] +
          "ます" +
          "\n" +
          orFirstPart +
          hiragana[iConsonant][iVowel] +
          "ます";
      } else {
        masu = firstPart + hiragana[iConsonant][iVowel] + "ます";
      }
    } else if (lastChar === "る") {
      // ru-verbs

      // つくる\n作る
      if (kanji) {
        masu = firstPart + "ます" + "\n" + orFirstPart + "ます";
      } else {
        masu = firstPart + "ます";
      }
    }
  }

  return masu;
}

/**
 * @returns the class of verb 1,2,3 (godan,ichidan,irregular)
 * @param {*} verb a dictionary form verb (must have furigana or be all hiragana)
 */
export function dictionaryVerbClass(verb) {
  const pronunciation = verb.indexOf("\n") > -1 ? verb.split("\n")[0] : verb;

  const verbArr = pronunciation.split("");
  const lastChar = verbArr.pop();
  const beforeLastChar = verbArr.pop();

  const { iConsonant, iVowel: beforeLastVowel } = getConsonantVowel(
    beforeLastChar
  );

  if (pronunciation === "する" || pronunciation === "くる") {
    return 3;
  } else if (
    (lastChar === "る" && beforeLastVowel === 1) ||
    beforeLastVowel === 3
  ) {
    return 2; //ichidan
  } else {
    return 1; //godan
  }
}

// TODO: da/desu
/**
 * @returns the te form of a verb
 * @param {*} dictionaryForm verb in dictionary form
 */
export function teForm(dictionaryForm) {
  const type = dictionaryVerbClass(dictionaryForm);
  let teCon;
  let verb = dictionaryForm;
  let hiragana;
  let furigana = dictionaryForm.indexOf("\n") > -1 ? true : false;
  let ending;

  if (furigana) {
    // has kanji
    hiragana = dictionaryForm.split("\n")[0];
    verb = dictionaryForm.split("\n")[1];
  }

  const lastCharacter = verb[verb.length - 1];

  if (type === 1) {
    if (verb === "行く" || verb === "いく") {
      return "いって" + "\n" + "行って";
    }

    switch (lastCharacter) {
      case "う":
      case "つ":
      case "る":
        ending = "って";
        break;
      case "く":
        ending = "いて";
        break;
      case "ぐ":
        ending = "いで";
        break;
      case "ぬ":
      case "ぶ":
      case "む":
        ending = "んで";
        break;
      case "す":
        ending = "して";
        break;
    }

    if (furigana) {
      teCon =
        hiragana.substr(0, hiragana.length - 1) +
        ending +
        "\n" +
        verb.substr(0, verb.length - 1) +
        ending;
    } else {
      teCon = verb.substr(0, verb.length - 1) + ending;
    }
  } else if (type === 2) {
    ending = "て";
    if (furigana) {
      teCon =
        hiragana.substr(0, hiragana.length - 1) +
        ending +
        "\n" +
        verb.substr(0, verb.length - 1) +
        ending;
    } else {
      teCon = verb.substr(0, verb.length - 1) + ending;
    }
  } else if (type === 3) {
    if (verb === "来る" || verb === "くる") {
      return "きて" + "\n" + "来て";
    } else if (verb === "する") {
      return "して";
    }

    return "irregular";
  } else {
    throw "missing class/type";
  }

  return teCon;
}
