import data from "../../data/kana.json";
import { getConsonantVowel } from "./hiraganaHelper";
import { JapaneseText } from "./JapaneseText";

export class JapaneseVerb extends JapaneseText {
  constructor(furigana, kanji) {
    super(furigana, kanji);
  }

  static parse(text) {
    let obj;
    if (text.indexOf("\n") > -1) {
      const [furigana, kanji] = text.split("\n");
      obj = new JapaneseVerb(furigana, kanji);
    } else {
      obj = new JapaneseVerb(text);
    }
    return obj;
  }

  /**
   * @returns the class of verb 1,2,3 (godan,ichidan,irregular)
   */
  getVerbClass() {
    const pronunciation = this.furigana;

    // verb class 1 exceptions
    const spelling = this.getSpelling();
    if (
      spelling === "走る" ||
      spelling === "切る" ||
      spelling === "要る" ||
      spelling === "入る" ||
      spelling === "帰る" ||
      spelling === "減る"
    ) {
      return 1;
    }

    const verbArr = pronunciation.split("");
    const lastChar = verbArr.pop();
    const beforeLastChar = verbArr.pop();

    const iSound = 1;
    const eSound = 3;

    const { /*iConsonant,*/ iVowel: beforeLastVowel } = getConsonantVowel(
      beforeLastChar
    );

    if (
      spelling.split("").slice(-2).join("") === "する" ||
      pronunciation === "くる" ||
      pronunciation === "だ" ||
      pronunciation === "ある"
    ) {
      return 3;
    } else if (
      (beforeLastVowel === iSound && lastChar === "る") ||
      (beforeLastVowel === eSound && lastChar === "る")
    ) {
      return 2; //ichidan
    } else {
      return 1; //godan
    }
  }

  /**
   * takes a dictionary form verb and returns the stem
   * @returns {String[]} stem [hiragana] or [furigana,kanji]
   */
  getStem() {
    let stem;

    const hiragana = data.hiragana;

    let pronunciation = this.furigana;
    const kanji = this.hasFurigana();

    let orthography, orVerbArr, orLastChar, ortoStem;

    if (kanji) {
      orthography = this.kanji;
      orVerbArr = orthography.split("");
      orLastChar = orVerbArr.pop();
      ortoStem = orVerbArr.join("");
    }

    const verbArr = pronunciation.split("");
    const lastChar = verbArr.pop();
    const furiganaStem = verbArr.join("");

    // u-verbs
    if (this.getVerbClass() === 1 || lastChar !== "る") {
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
   * @returns {JapaneseText} the masu form of the verb
   */
  masuForm() {
    const ending = "ます";
    // irregulars
    let masu;
    switch (this.toString()) {
      case "くる\n来る":
        masu = new JapaneseText("きます", "来ます");
        break;
      case "ある":
        masu = new JapaneseText("あります");
        break;
      case "だ":
        masu = new JapaneseText("です");
        break;
    }

    if ("する" === this.getSpelling().split("").slice(-2).join("")) {
      const ending = "します";
      const fstem = this.getPronunciation().split("").slice(0, -2).join("");
      const kstem = this.getSpelling().split("").slice(0, -2).join("");

      if (this.hasFurigana()) {
        masu = new JapaneseText(fstem + ending, kstem + ending);
      } else {
        masu = new JapaneseText(fstem + ending);
      }
    }

    if (!masu) {
      // not irregular
      const [furiganaStem, kanjiStem] = this.getStem();
      if (kanjiStem) {
        masu = new JapaneseText(furiganaStem + ending, kanjiStem + ending);
      } else {
        masu = new JapaneseText(furiganaStem + ending);
      }
    }

    return masu;
  }

  /**
   * @returns {JapaneseText} the mashou form of a verb
   * https://kawakawalearningstudio.com/all/make-use-japanese-volitional-form/
   */
  mashouForm() {
    const ending = "ましょう";
    // irregulars
    let mashou;
    switch (this.toString()) {
      case "くる\n来る":
        mashou = new JapaneseText("きましょう", "来ましょう");
        break;
      case "ある":
        mashou = new JapaneseText("ありましょう");
        break;
      case "だ":
        mashou = new JapaneseText("でしょう");
        break;
    }

    if ("する" === this.getSpelling().split("").slice(-2).join("")) {
      const ending = "しましょう";
      const fstem = this.getPronunciation().split("").slice(0, -2).join("");
      const kstem = this.getSpelling().split("").slice(0, -2).join("");

      if (this.hasFurigana()) {
        mashou = new JapaneseText(fstem + ending, kstem + ending);
      } else {
        mashou = new JapaneseText(fstem + ending);
      }
    }

    if (!mashou) {
      // not irregular
      const [furiganaStem, kanjiStem] = this.getStem();
      if (kanjiStem) {
        mashou = new JapaneseText(furiganaStem + ending, kanjiStem + ending);
      } else {
        mashou = new JapaneseText(furiganaStem + ending);
      }
    }

    return mashou;
  }

  /**
   * @returns {JapaneseText} the ta form of a verb
   */
  taForm() {
    return this.t_Form(taRule);
  }
  /**
   * @returns {JapaneseText} the te form of a verb
   */
  teForm() {
    return this.t_Form(teRule);
  }

  /**
   * @returns {JapaneseText} the t- form of a verb
   * @param {*} rule rule to use
   */
  t_Form(rule) {
    const type = this.getVerbClass();
    let t_Con;
    let verb = this.furigana;
    let hiragana;
    let furigana = this.hasFurigana();
    let ending;

    if (furigana) {
      // has kanji
      hiragana = this.furigana;
      verb = this.kanji;
    }

    const lastCharacter = verb[verb.length - 1];

    if (type === 1) {
      if (verb === "行く" || verb === "いく") {
        t_Con = JapaneseText.parse(rule.g1.iku);
      } else {
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
          t_Con = new JapaneseText(
            hiragana.substr(0, hiragana.length - 1) + ending,
            verb.substr(0, verb.length - 1) + ending
          );
        } else {
          t_Con = new JapaneseText(verb.substr(0, verb.length - 1) + ending);
        }
      }
    } else if (type === 2) {
      ending = rule.g2.ru;
      if (furigana) {
        t_Con = new JapaneseText(
          hiragana.substr(0, hiragana.length - 1) + ending,
          verb.substr(0, verb.length - 1) + ending
        );
      } else {
        t_Con = new JapaneseText(verb.substr(0, verb.length - 1) + ending);
      }
    } else if (type === 3) {
      if (verb === "来る" || verb === "くる") {
        t_Con = JapaneseText.parse(rule.g3.kuru);
      } else if (verb === "する") {
        t_Con = JapaneseText.parse(rule.g3.suru);
      } else if (verb === "だ") {
        t_Con = JapaneseText.parse(rule.g3.da);
      } else if (verb === "ある") {
        t_Con = JapaneseText.parse(rule.g3.aru);
      }

      if ("する" === verb.split("").slice(-2).join("")) {
        const ending = rule.g3.suru;
        const kstem = verb.split("").slice(0, -2).join("");

        if (furigana) {
          const fstem = hiragana.split("").slice(0, -2).join("");
          t_Con = new JapaneseText(fstem + ending, kstem + ending);
        } else {
          t_Con = new JapaneseText(kstem + ending);
        }
      }
    }

    return t_Con;
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
  g3: {
    suru: "した",
    kuru: "きた\n来た",
    da: "だった",
    aru: "あった",
    iru: "いた",
  },
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
  g3: {
    suru: "して",
    kuru: "きて\n来て",
    da: "で",
    aru: "あって",
    iru: "いて",
  },
};
