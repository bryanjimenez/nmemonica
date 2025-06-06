import type { RawJapanese } from "nmemonica";

import { JapaneseText } from "./JapaneseText";
import { getConsonantVowel } from "./kanaHelper";
import data from "../../res/json/kana.json";

export type VerbFormArray = {
  /** Verb form (tense label) */ name: string;
  /** inflected/conjugated verb */ value: JapaneseText;
  /** Verb form description */ description: string;
}[];

/**
 * @overload Return a list of verb forms names
 * Form names only
 */
export function getVerbFormsArray(): { name: string }[];

/**
 * @overload Returns verb forms
 * Form names and values
 */
export function getVerbFormsArray(
  rawVerb: RawJapanese,
  order?: string[]
): VerbFormArray;

/**
 * Array containing the avaiable verb forms
 */
export function getVerbFormsArray(
  rawVerb?: RawJapanese,
  order?: string[]
): VerbFormArray | { name: string }[] {
  const verb = {
    dictionary: rawVerb === undefined ? undefined : JapaneseVerb.parse(rawVerb),
  };

  const allForms = [
    {
      name: "-masu",
      value: verb.dictionary?.masuForm(),
      description: "Polite Present",
    },
    {
      name: "-mashou",
      value: verb.dictionary?.mashouForm(),
      description: "Polite Volitional",
    },
    { name: "dictionary", value: verb.dictionary, description: "Dictionary" },
    {
      name: "-nai",
      value: verb.dictionary?.naiForm(),
      description: "Negative",
    },
    {
      name: "-saseru",
      value: verb.dictionary?.saseruForm(),
      description: "Causative",
    },
    { name: "-te", value: verb.dictionary?.teForm(), description: "Te form" },
    { name: "-ta", value: verb.dictionary?.taForm(), description: "Past" },
    {
      name: "-chatta",
      value: verb.dictionary?.chattaForm(),
      description: "Casual Past",
    },
    {
      name: "-reru",
      value: verb.dictionary?.reruForm(),
      description: "Potential",
    },
    {
      name: "-rareru",
      value: verb.dictionary?.rareruForm(),
      description: "Passive",
    },
  ];

  if (rawVerb === undefined) {
    const verbNamesOnly = allForms.map((form) => ({ name: form.name }));

    return verbNamesOnly;
  } else {
    // Some forms can be nulled, exclude those
    const nonNull = allForms.filter(
      (thing) => thing.value !== null
    ) as VerbFormArray;

    // Reorder and select based on order array
    let filtered: VerbFormArray = [];
    if (order && order.length > 0) {
      filtered = order.reduce<VerbFormArray>((acc, form) => {
        const f = nonNull.find((el) => el.name === form);
        if (f !== undefined) {
          acc = [...acc, f];
        }

        return acc;
      }, []);
    }

    if (filtered.length === 0) {
      filtered = nonNull;
    }

    return filtered;
  }
}

export function verbToTargetForm(
  rawVerb: RawJapanese,
  targetForm: string
): Error | JapaneseText {
  const theForm = getVerbFormsArray(rawVerb).find(
    (form) => form.name === targetForm
  );

  if (!theForm) {
    return new Error("Invalid targetForm");
  }

  return theForm.value;
}

export class JapaneseVerb extends JapaneseText {
  trans?: string;
  intr?: true | string;
  exv?: 1 | 2 | 3;

  constructor(furigana: string, kanji: string) {
    super(furigana, kanji);
    this.trans = undefined;
    this.intr = undefined;
    this.exv = undefined;
  }

  get [Symbol.toStringTag]() {
    return "JapaneseVerb";
  }

  static parse = (dataObj: RawJapanese): JapaneseVerb => {
    const constructorFn = (params: RawJapanese) => {
      const [furigana, kanji] = params.japanese.split("\n");
      return new JapaneseVerb(furigana, kanji);
    };

    const jVerb = JapaneseText.parser(dataObj, constructorFn) as JapaneseVerb;

    if (dataObj.intr !== undefined) {
      jVerb.intr = dataObj.intr;
    }

    if (dataObj.trans !== undefined && dataObj.trans.length > 0) {
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
    return this.isIntransitive() && this.trans !== undefined
      ? this.trans
      : undefined;
  }

  getIntransitivePair() {
    return !this.isIntransitive() && typeof this.intr === "string"
      ? this.intr
      : undefined;
  }

  isIrregularAru() {
    let verb = super.getSpelling();
    return verb === "ある" || verb === "有る";
  }

  isIrregularIru() {
    let verb = super.getSpelling();
    return verb === "いる" || verb === "居る";
  }

  isCopulaDa() {
    let verb = super.getSpelling();
    return verb === "だ";
  }

  isIrregularSuru() {
    let verb = super.getSpelling();
    return verb === "する";
  }

  isSuruVerb() {
    let verb = super.getSpelling();
    return verb.endsWith("する");
  }

  isIrregularKuru() {
    let verb = super.getSpelling();
    return verb === "くる\n来る" || verb === "来る" || verb === "くる";
  }

  /**
   * @returns the class of verb 1,2,3 (godan,ichidan,irregular)
   */
  getVerbClass() {
    const pronunciation = super.getPronunciation();

    // verb class 1 exceptions
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
      this.isSuruVerb() ||
      this.isIrregularKuru() ||
      this.isCopulaDa() ||
      this.isIrregularAru()
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
   * @returns stem [hiragana] or [furigana,kanji]
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

      if (kStem !== undefined) {
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
      if (kStem !== undefined) {
        stem = [fStem, kStem];
      } else {
        stem = [fStem];
      }
    } else {
      return new Error(`Unknown stem rule ${super.toString()}`);
    }

    return stem;
  }

  /**
   * @returns the nai form of the verb
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
      const aVowel = data.vowels.indexOf("a");
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
      const result = this.getStem();
      if (result instanceof Error) {
        return result;
      }
      const [fStem, kStem] = result;

      if (kStem) {
        nai = new JapaneseText(fStem + ending, kStem + ending);
      } else {
        nai = new JapaneseText(fStem + ending);
      }
    } /*if (type === 3)*/ else {
      if (this.isIrregularKuru()) {
        nai = new JapaneseText("こない", "来ない");
      } else if (this.isIrregularSuru()) {
        nai = new JapaneseText("しない");
        // } else if (verb === "だ") {
        //   nai = "de wa arimasen"; // FIXME: complete
      } else if (this.isIrregularAru()) {
        nai = new JapaneseText("ない");
      }
      // type 2
      //  else if (verb === "居る" || verb === "いる") {
      //   nai = "いない\n居ない";
      // }
      else if (this.isSuruVerb()) {
        const kStem = super.getSpelling().slice(0, -2);

        if (hasKanji) {
          const fStem = super.getPronunciation().slice(0, -2);
          nai = new JapaneseText(fStem + "しない", kStem + "しない");
        } else {
          nai = new JapaneseText(kStem + "しない");
        }
      } else {
        return new Error(`Unknown nai rule ${super.toString()}`);
      }
    }

    return nai;
  }

  /**
   * @returns the saseru form of the verb
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
      const aVowel = data.vowels.indexOf("a");

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
      if (this.isIrregularIru()) {
        saseru = new JapaneseText("いる", "居る");
      }

      const result = this.getStem();
      if (result instanceof Error) {
        return result;
      }
      const [fStem, kStem] = result;

      if (hasKanji) {
        saseru = new JapaneseText(fStem + "さ" + ending, kStem + "さ" + ending);
      } else {
        saseru = new JapaneseText(fStem + "さ" + ending);
      }
    } /*if (type === 3)*/ else {
      if (this.isIrregularKuru()) {
        saseru = new JapaneseText("こさせる", "来させる");
      } else if (this.isIrregularSuru()) {
        saseru = new JapaneseText("させる");
      } else if (this.isIrregularAru()) {
        saseru = new JapaneseText("ある");
      } else if (this.isSuruVerb()) {
        const kStem = super.getSpelling().slice(0, -2);

        if (hasKanji) {
          const fStem = super.getPronunciation().slice(0, -2);
          saseru = new JapaneseText(fStem + "させる", kStem + "させる");
        } else {
          saseru = new JapaneseText(kStem + "させる");
        }
      } else {
        return new Error(`Unknown saseru rule ${super.toString()}`);
      }
    }

    return saseru;
  }

  /**
   * Potential form (~reru)
   */
  reruForm() {
    let reru;
    const type = this.getVerbClass();
    let verb = super.getSpelling();
    let hasKanji = super.hasFurigana();

    if (this.isIntransitive() || this.getIntransitivePair() !== undefined) {
      return null;
    }

    if (type === 1) {
      // u Godan
      const lastChar = verb[verb.length - 1];

      const hiragana = data.hiragana;
      const eVowel = data.vowels.indexOf("e");
      const { iConsonant: consonant } = getConsonantVowel(lastChar);

      const consonantEnding = hiragana[consonant][eVowel] + "る";

      const kStem = super.getSpelling().slice(0, -1);
      if (hasKanji) {
        const fStem = super.getPronunciation().slice(0, -1);

        reru = new JapaneseText(
          fStem + consonantEnding,
          kStem + consonantEnding
        );
      } else {
        reru = new JapaneseText(kStem + consonantEnding);
      }
    } else if (type === 2) {
      // ru Ichidan

      const result = this.getStem();
      if (result instanceof Error) {
        return result;
      }
      const [fStem, kStem] = result;

      if (hasKanji) {
        reru = new JapaneseText(fStem + "られる", kStem + "られる");
      } else {
        reru = new JapaneseText(fStem + "られる");
      }
    } /*if (type === 3)*/ else {
      if (this.isIrregularKuru()) {
        reru = new JapaneseText("こられる", "来られる");
      } else if (this.isSuruVerb()) {
        const kStem = super.getSpelling().slice(0, -2);

        if (hasKanji) {
          const fStem = super.getPronunciation().slice(0, -2);
          reru = new JapaneseText(fStem + "できる", kStem + "できる");
        } else {
          reru = new JapaneseText(kStem + "できる");
        }
      } else if (this.isIrregularAru() || this.isIrregularIru()) {
        reru = null;
      } else {
        return new Error(`Unknown reru rule ${super.toString()}`);
      }
    }

    return reru;
  }

  /**
   * Passive form (~rareru)
   */
  rareruForm() {
    let rareru: JapaneseText | null;
    const type = this.getVerbClass();
    let verb = super.getSpelling();
    let hasKanji = super.hasFurigana();

    if (this.isIntransitive() || this.getIntransitivePair() !== undefined) {
      return null;
    }

    if (type === 1) {
      // u Godan
      const lastChar = verb[verb.length - 1];

      const hiragana = data.hiragana;
      const eVowel = data.vowels.indexOf("a");
      const { iConsonant } = getConsonantVowel(lastChar);
      // u -> wa
      const consonant = iConsonant === 0 ? 14 : iConsonant;
      const consonantEnding = hiragana[consonant][eVowel] + "れる";

      const kStem = super.getSpelling().slice(0, -1);
      if (hasKanji) {
        const fStem = super.getPronunciation().slice(0, -1);

        rareru = new JapaneseText(
          fStem + consonantEnding,
          kStem + consonantEnding
        );
      } else {
        rareru = new JapaneseText(kStem + consonantEnding);
      }
    } else if (type === 2) {
      // ru Ichidan

      const result = this.getStem();
      if (result instanceof Error) {
        return result;
      }
      const [fStem, kStem] = result;

      if (hasKanji) {
        rareru = new JapaneseText(fStem + "られる", kStem + "られる");
      } else {
        rareru = new JapaneseText(fStem + "られる");
      }
    } /*if (type === 3)*/ else {
      if (this.isIrregularKuru()) {
        rareru = new JapaneseText("こられる", "来られる");
      } else if (this.isSuruVerb()) {
        const kStem = super.getSpelling().slice(0, -2);

        if (hasKanji) {
          const fStem = super.getPronunciation().slice(0, -2);
          rareru = new JapaneseText(fStem + "される", kStem + "される");
        } else {
          rareru = new JapaneseText(kStem + "される");
        }
      } else if (this.isIrregularAru() || this.isIrregularIru()) {
        rareru = null;
      } else {
        return new Error(`Unknown rareru rule ${super.toString()}`);
      }
    }

    return rareru;
  }

  /**
   * @returns the masu form of the verb
   */
  masuForm() {
    const ending = "ます";
    // irregulars
    let masu;
    switch (true) {
      case this.isIrregularKuru():
        masu = new JapaneseText("きます", "来ます");
        break;
      case this.isIrregularAru():
        masu = new JapaneseText("あります");
        break;
      case this.isCopulaDa():
        masu = new JapaneseText("です");
        break;
    }

    if (this.isSuruVerb()) {
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
      const result = this.getStem();
      if (result instanceof Error) {
        return result;
      }
      const [furiganaStem, kanjiStem] = result;
      if (kanjiStem) {
        masu = new JapaneseText(furiganaStem + ending, kanjiStem + ending);
      } else {
        masu = new JapaneseText(furiganaStem + ending);
      }
    }

    return masu;
  }

  /**
   * @returns the mashou form of a verb
   * https://kawakawalearningstudio.com/all/make-use-japanese-volitional-form/
   */
  mashouForm() {
    const ending = "ましょう";
    // irregulars
    let mashou;
    switch (true) {
      case this.isIrregularKuru():
        mashou = new JapaneseText("きましょう", "来ましょう");
        break;
      case this.isIrregularAru():
        mashou = new JapaneseText("ありましょう");
        break;
      case this.isCopulaDa():
        mashou = new JapaneseText("でしょう");
        break;
    }

    if (this.isSuruVerb()) {
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
      const result = this.getStem();
      if (result instanceof Error) {
        return result;
      }
      const [furiganaStem, kanjiStem] = result;
      if (kanjiStem) {
        mashou = new JapaneseText(furiganaStem + ending, kanjiStem + ending);
      } else {
        mashou = new JapaneseText(furiganaStem + ending);
      }
    }

    return mashou;
  }

  /**
   * @returns the ta form of a verb
   */
  taForm() {
    return this.t_Form(taRule);
  }

  chattaForm() {
    if (this.getVerbClass() === 3) {
      return null;
    }

    const verb = super.hasFurigana()
      ? super.getSpelling()
      : super.getPronunciation();

    let ending;
    const lastCharacter = verb[verb.length - 1];
    switch (lastCharacter) {
      case "ぶ":
      case "む":
      case "ぬ":
      case "ぐ":
        ending = "じゃった";
        break;
      default:
        ending = "ちゃった";
        break;
    }

    const ta = this.t_Form(taRule);
    if (ta instanceof Error) {
      return ta;
    }
    return new JapaneseText(
      ta.getPronunciation().slice(0, -1) + ending,
      ta.getSpelling().slice(0, -1) + ending
    );
  }

  /**
   * @return the te form of a verb
   */
  teForm() {
    return this.t_Form(teRule);
  }

  /**
   * @returns the t- form of a verb
   * @param rule rule to use
   */
  t_Form<Rule extends typeof taRule>(rule: Rule) {
    const type = this.getVerbClass();
    let t_Con;
    let verb = this.furigana;
    let hiragana;
    let ending;

    if (this.hasFurigana() && this.kanji !== undefined) {
      // has kanji
      hiragana = this.furigana;
      verb = this.kanji;
    }

    const lastCharacter = verb[verb.length - 1];

    if (type === 1) {
      if (verb === "行く" || verb === "いく") {
        t_Con = JapaneseText.parse({ japanese: rule.g1.iku });
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

        if (hiragana !== undefined) {
          t_Con = new JapaneseText(
            `${hiragana.slice(0, -1)}${ending ?? ""}`,
            `${verb.slice(0, -1)}${ending ?? ""}`
          );
        } else {
          t_Con = new JapaneseText(`${verb.slice(0, -1)}${ending ?? ""}`);
        }
      }
    } else if (type === 2) {
      ending = rule.g2.ru;
      if (hiragana !== undefined) {
        t_Con = new JapaneseText(
          hiragana.slice(0, -1) + ending,
          verb.slice(0, -1) + ending
        );
      } else {
        t_Con = new JapaneseText(verb.slice(0, -1) + ending);
      }
    } /*if (type === 3)*/ else {
      if (this.isIrregularKuru()) {
        t_Con = JapaneseText.parse({ japanese: rule.g3.kuru });
      } else if (this.isIrregularSuru()) {
        t_Con = JapaneseText.parse({ japanese: rule.g3.suru });
      } else if (this.isCopulaDa()) {
        t_Con = JapaneseText.parse({ japanese: rule.g3.da });
      } else if (this.isIrregularAru()) {
        t_Con = JapaneseText.parse({ japanese: rule.g3.aru });
      } else if (this.isSuruVerb()) {
        const ending = rule.g3.suru;
        const kstem = verb.slice(0, -2);

        if (hiragana !== undefined) {
          const fstem = hiragana.slice(0, -2);
          t_Con = new JapaneseText(fstem + ending, kstem + ending);
        } else {
          t_Con = new JapaneseText(kstem + ending);
        }
      } else {
        return new Error(`Unknown t rule ${super.toString()}`);
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
