import data from "../../data/kana.json";
import { getConsonantVowel } from "./kanaHelper";
import { JapaneseText } from "./JapaneseText";

export class JapaneseVerb extends JapaneseText {
  /**
   * @param {string} furigana
   * @param {string} [kanji]
   */
  constructor(furigana, kanji) {
    super(furigana, kanji);
    /**
     * @type {string|undefined}
     */
    this.trans = undefined;
    /**
     * @type {true|string|undefined}
     */
    this.intr = undefined;

    /**
     * @type {1|2|3| undefined}
     */
    this.exv = undefined;
  }

  get [Symbol.toStringTag]() {
    return "JapaneseVerb";
  }

  /**
   * @param {RawVocabulary} dataObj
   * @returns {JapaneseVerb}
   */
  static parse = (dataObj) => {
    /**
     * @type {JapaneseVerb}
     */
    const jVerb = JapaneseText.parse(dataObj, (...o) => new JapaneseVerb(...o));

    if (dataObj.intr) {
      jVerb.intr = dataObj.intr;
    }

    if (dataObj.trans) {
      jVerb.trans = dataObj.trans;
    }

    if (dataObj.exv && dataObj.exv > 0 && dataObj.exv < 4) {
      jVerb.exv = dataObj.exv;
    }

    return jVerb;
  };

  isExceptionVerb() {
    return this.exv !== undefined ? true : false;
  }

  isIntransitive() {
    return this.trans !== undefined || this.intr === true;
  }

  getTransitivePair() {
    return this.isIntransitive() && this.trans ? this.trans : undefined;
  }

  getIntransitivePair() {
    return !this.isIntransitive() && typeof this.intr === "string" ? this.intr : undefined;
  }

  /**
   * @returns {1|2|3} the class of verb 1,2,3 (godan,ichidan,irregular)
   */
  getVerbClass() {
    const pronunciation = super.getPronunciation();

    // verb class 1 exceptions
    const spelling = super.getSpelling();
    if (this.exv && this.isExceptionVerb()) {
      return this.exv;
    }

    const lastChar = pronunciation.slice(-1);
    const beforeLastChar = pronunciation.slice(-2, -1);

    const iSound = 1;
    const eSound = 3;

    const { /*iConsonant,*/ iVowel: beforeLastVowel } =
      getConsonantVowel(beforeLastChar);

    if (
      spelling.slice(-2) === "する" ||
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
   * @returns {string[]} stem [hiragana] or [furigana,kanji]
   */
  getStem() {
    let stem;

    const hiragana = data.hiragana;

    let kStem;
    if (super.hasFurigana()) {
      kStem = super.getSpelling().slice(0, -1);
    }

    const lastChar = super.getPronunciation().slice(-1);
    const fStem = super.getPronunciation().slice(0, -1);

    // u-verbs
    if (this.getVerbClass() === 1 || lastChar !== "る") {
      const iVowel = 1; // i
      const { iConsonant } = getConsonantVowel(lastChar);

      if (kStem) {
        stem = [
          fStem + hiragana[iConsonant][iVowel],
          kStem + hiragana[iConsonant][iVowel],
        ];
      } else {
        stem = [fStem + hiragana[iConsonant][iVowel]];
      }
    } else if (lastChar === "る") {
      // ru-verbs

      // つくる\n作る
      if (kStem) {
        stem = [fStem, kStem];
      } else {
        stem = [fStem];
      }
    } else {
      throw new Error("Unknown verb type");
    }

    return stem;
  }

  /**
   * @returns {JapaneseText} the nai form of the verb
   */
  naiForm() {
    let nai;
    let ending = "ない";
    const type = this.getVerbClass();
    let verb = super.getSpelling();
    let hasKanji = super.hasFurigana();

    if (type === 1) {
      // u
      const lastChar = verb[verb.length - 1];

      const hiragana = data.hiragana;
      const aVowel = 0; // a
      const { iConsonant } = getConsonantVowel(lastChar);

      // u -> wa
      const consonant = iConsonant === 0 ? 14 : iConsonant;

      const consonantEnding = hiragana[consonant][aVowel] + ending;

      const kStem = super.getSpelling().slice(0, -1);
      if (hasKanji) {
        const fStem = super.getPronunciation().slice(0, -1);

        nai = new JapaneseText(
          fStem + consonantEnding,
          kStem + consonantEnding
        );
      } else {
        nai = new JapaneseText(kStem + consonantEnding);
      }
    } else if (type === 2) {
      // ru
      const [fStem, kStem] = this.getStem();

      if (kStem) {
        nai = new JapaneseText(fStem + ending, kStem + ending);
      } else {
        nai = new JapaneseText(fStem + ending);
      }
    } /*if (type === 3)*/ else {
      if (verb === "来る" || verb === "くる") {
        nai = new JapaneseText("こない", "来ない");
      } else if (verb === "する") {
        nai = new JapaneseText("しない");
      // } else if (verb === "だ") {
      //   nai = "de wa arimasen"; // FIXME: complete
      } else if (verb === "ある") {
        nai = new JapaneseText("ない");
      }
      // type 2
      //  else if (verb === "居る" || verb === "いる") {
      //   nai = "いない\n居ない";
      // }
      else if ("する" === verb.slice(-2)) {
        const kStem = super.getSpelling().slice(0, -2);

        if (hasKanji) {
          const fStem = super.getPronunciation().slice(0, -2);
          nai = new JapaneseText(fStem + "しない", kStem + "しない");
        } else {
          nai = new JapaneseText(kStem + "しない");
        }
      } else {
        throw new Error("Unknown exception verb type");
      }
    }

    return nai;
  }

  /**
   * @returns {JapaneseText} the saseru form of the verb
   */
  saseruForm() {
    let saseru;
    let ending = /*さ*/ "せる";
    const type = this.getVerbClass();
    let verb = super.getSpelling();
    let hasKanji = super.hasFurigana();

    if (type === 1) {
      // u
      const lastChar = verb[verb.length - 1];

      const hiragana = data.hiragana;
      const aVowel = 0; // a
      const { iConsonant } = getConsonantVowel(lastChar);

      // u -> wa
      const consonant = iConsonant === 0 ? 14 : iConsonant;

      const consonantEnding = hiragana[consonant][aVowel] + ending;

      const kStem = super.getSpelling().slice(0, -1);
      if (hasKanji) {
        const fStem = super.getPronunciation().slice(0, -1);

        saseru = new JapaneseText(
          fStem + consonantEnding,
          kStem + consonantEnding
        );
      } else {
        saseru = new JapaneseText(kStem + consonantEnding);
      }
    } else if (type === 2) {
      // ru
      // type 2
      if (verb === "居る" || verb === "いる") {
        saseru = new JapaneseText("いる", "居る");
      }

      const [fStem, kStem] = this.getStem();

      if (hasKanji) {
        saseru = new JapaneseText(fStem + "さ" + ending, kStem + "さ" + ending);
      } else {
        saseru = new JapaneseText(fStem + "さ" + ending);
      }
    } /*if (type === 3)*/ else {
      if (verb === "来る" || verb === "くる") {
        saseru = new JapaneseText("こさせる", "来させる");
      } else if (verb === "する") {
        saseru = new JapaneseText("させる");
      } else if (verb === "ある") {
        saseru = new JapaneseText("ある");
      } else if ("する" === verb.slice(-2)) {
        const kStem = super.getSpelling().slice(0, -2);

        if (hasKanji) {
          const fStem = super.getPronunciation().slice(0, -2);
          saseru = new JapaneseText(fStem + "させる", kStem + "させる");
        } else {
          saseru = new JapaneseText(kStem + "させる");
        }
      } else {
        throw new Error("Unknown exception verb type");
      }
    }

    return saseru;
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

    if ("する" === super.getSpelling().slice(-2)) {
      const ending = "します";
      const fstem = super.getPronunciation().slice(0, -2);
      const kstem = super.getSpelling().slice(0, -2);

      if (super.hasFurigana()) {
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

    if ("する" === super.getSpelling().slice(-2)) {
      const ending = "しましょう";
      const fstem = super.getPronunciation().slice(0, -2);
      const kstem = super.getSpelling().slice(0, -2);

      if (super.hasFurigana()) {
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
    let verb = super.furigana;
    let hiragana;
    let ending;

    if (super.hasFurigana()) {
      // has kanji
      hiragana = super.furigana;
      verb = super.kanji;
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

        if (hiragana) {
          t_Con = new JapaneseText(
            hiragana.slice(0, -1) + ending,
            verb.slice(0, -1) + ending
          );
        } else {
          t_Con = new JapaneseText(verb.slice(0, -1) + ending);
        }
      }
    } else if (type === 2) {
      ending = rule.g2.ru;
      if (hiragana) {
        t_Con = new JapaneseText(
          hiragana.slice(0, -1) + ending,
          verb.slice(0, -1) + ending
        );
      } else {
        t_Con = new JapaneseText(verb.slice(0, -1) + ending);
      }
    } /*if (type === 3)*/ else {
      if (verb === "来る" || verb === "くる") {
        t_Con = JapaneseText.parse(rule.g3.kuru);
      } else if (verb === "する") {
        t_Con = JapaneseText.parse(rule.g3.suru);
      } else if (verb === "だ") {
        t_Con = JapaneseText.parse(rule.g3.da);
      } else if (verb === "ある") {
        t_Con = JapaneseText.parse(rule.g3.aru);
      } else if ("する" === verb.slice(-2)) {
        const ending = rule.g3.suru;
        const kstem = verb.slice(0, -2);

        if (hiragana) {
          const fstem = hiragana.slice(0, -2);
          t_Con = new JapaneseText(fstem + ending, kstem + ending);
        } else {
          t_Con = new JapaneseText(kstem + ending);
        }
      } else {
        throw new Error("Unknown exception verb type");
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
