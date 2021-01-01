import data from "../../data/hiragana.json";
import { getConsonantVowel } from "./parser";

/**
 * @returns the masu form of a verb
 * @param {*} dictionaryForm verb in dictionary form
 */
export function masuForm(dictionaryForm) {
  const ending = "ます";
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
    const [furiganaStem, kanjiStem] = getStem(dictionaryForm);
    masu = furiganaStem + ending + (kanjiStem ? "\n" + kanjiStem + ending : "");
  }

  return masu;
}

/**
 * takes a dictionary form verb and returns the stem
 * @param {String} dictionaryForm
 * @returns {String[]} stem [hiragana] or [furigana,kanji]
 */
function getStem(dictionaryForm) {
  let stem;

  const hiragana = data.hiragana;

  let pronunciation = dictionaryForm;
  const kanji = dictionaryForm.indexOf("\n") > -1 ? true : false;

  let orthography, orVerbArr, orLastChar, ortoStem;

  if (kanji) {
    [pronunciation, orthography] = dictionaryForm.split("\n");
    orVerbArr = orthography.split("");
    orLastChar = orVerbArr.pop();
    ortoStem = orVerbArr.join("");
  }

  const verbArr = pronunciation.split("");
  const lastChar = verbArr.pop();
  const furiganaStem = verbArr.join("");

  // u-verbs
  if (dictionaryVerbClass(dictionaryForm) === 1 || lastChar !== "る") {
    const iVowel = 1;
    const { iConsonant } = getConsonantVowel(lastChar);

    if (kanji) {
      stem = [
        furiganaStem + hiragana[iConsonant][iVowel],
        ortoStem + hiragana[iConsonant][iVowel],
      ];
    } else {
      stem = [furiganaStem + hiragana[iConsonant][iVowel]];
    }
  } else if (lastChar === "る") {
    // ru-verbs

    // つくる\n作る
    if (kanji) {
      stem = [furiganaStem, ortoStem];
    } else {
      stem = [furiganaStem];
    }
  }

  return stem;
}

/**
 * @returns {String} the mashou form of a verb
 * @param {String} dictionaryForm verb in dictionary form
 */
export function mashouForm(dictionaryForm) {
  const ending = "ましょう";
  // irregulars
  let mashou;
  switch (dictionaryForm) {
    case "する":
      mashou = "しよう";
      break;
    case "くる\n来る":
      mashou = "こよう\n来よう";
      break;
    case "ある":
      mashou = "あいましょう";
      break;
    // FIXME: desu/da -mashou?
    case "だ":
      mashou = "?";
      break;
  }

  if (!mashou) {
    // not irregular
    const [furiganaStem, kanjiStem] = getStem(dictionaryForm);
    mashou =
      furiganaStem + ending + (kanjiStem ? "\n" + kanjiStem + ending : "");
  }

  return mashou;
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

const taRule = {
  g1: {
    u_tsu_ru: "った",
    mu_nu_bu: "んだ",
    ku: "いた",
    gu: "いだ",
    su: "した",
    iku: "いった\n行った",
  },
  g2: { ru: "た" },
  g3: { suru: "した", kuru: "きた\n来た" },
};
const teRule = {
  g1: {
    u_tsu_ru: "って",
    mu_nu_bu: "んで",
    ku: "いて",
    gu: "いで",
    su: "して",
    iku: "いって\n行って",
  },
  g2: { ru: "て" },
  g3: { suru: "して", kuru: "きて\n来て" },
};

/**
 * @returns the ta form of a verb
 * @param {*} dictionaryForm verb in dictionary form
 */
export function taForm(dictionaryForm) {
  return t_Form(dictionaryForm, taRule);
}
/**
 * @returns the te form of a verb
 * @param {*} dictionaryForm verb in dictionary form
 */
export function teForm(dictionaryForm) {
  return t_Form(dictionaryForm, teRule);
}

// TODO: da/desu
function t_Form(dictionaryForm, rule) {
  const type = dictionaryVerbClass(dictionaryForm);
  let t_Con;
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
      return rule.g1.iku;
    }

    switch (lastCharacter) {
      case "う":
      case "つ":
      case "る":
        ending = rule.g1.u_tsu_ru;
        break;
      case "く":
        ending = rule.g1.ku;
        break;
      case "ぐ":
        ending = rule.g1.gu;
        break;
      case "ぬ":
      case "ぶ":
      case "む":
        ending = rule.g1.mu_nu_bu;
        break;
      case "す":
        ending = rule.g1.su;
        break;
    }

    if (furigana) {
      t_Con =
        hiragana.substr(0, hiragana.length - 1) +
        ending +
        "\n" +
        verb.substr(0, verb.length - 1) +
        ending;
    } else {
      t_Con = verb.substr(0, verb.length - 1) + ending;
    }
  } else if (type === 2) {
    ending = rule.g2.ru;
    if (furigana) {
      t_Con =
        hiragana.substr(0, hiragana.length - 1) +
        ending +
        "\n" +
        verb.substr(0, verb.length - 1) +
        ending;
    } else {
      t_Con = verb.substr(0, verb.length - 1) + ending;
    }
  } else if (type === 3) {
    if (verb === "来る" || verb === "くる") {
      t_Con = rule.g3.kuru;
    } else if (verb === "する") {
      t_Con = rule.g3.suru;
    }
    return t_Con;
  } else {
    throw "missing class/type";
  }

  return t_Con;
}
