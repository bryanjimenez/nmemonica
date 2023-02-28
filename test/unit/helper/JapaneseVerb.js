import { expect } from "chai";
import { GET_VOCABULARY } from "../../../src/actions/vocabularyAct";
import { JapaneseVerb } from "../../../src/helper/JapaneseVerb";
import vocabularyReducer from "../../../src/reducers/vocabularyRed";
/* global describe it */

const verbs = {

  irr: [
    { dic: { japanese: 'だ' }, class: 3, masu: 'です', mashou: 'でしょう', te: 'で', ta: 'だった', chatta: null },
    { dic: { japanese: 'する' }, class: 3, masu: 'します', mashou: 'しましょう', te: 'して', ta: 'した', saseru: 'させる', reru: "できる" },
    { dic: { japanese: 'くる\n来る' }, class: 3, masu: 'きます\n来ます', mashou: 'きましょう\n来ましょう', te: 'きて\n来て', ta: 'きた\n来た', saseru: 'こさせる\n来させる', reru: "こられる\n来られる" },
    { dic: { japanese: 'あいする\n愛する' }, class: 3, masu: 'あいします\n愛します', mashou: 'あいしましょう\n愛しましょう', te: 'あいして\n愛して', ta: 'あいした\n愛した' },
    { dic: { japanese: 'ある' }, class: 3, masu: 'あります', mashou: 'ありましょう', te: 'あって', ta: 'あった' }
  ],

  ru: [
    { dic: { japanese: 'たべる\n食べる'}, class:2,  reru: 'たべられる\n食べられる'},
    { dic: { japanese: 'くれる\n呉れる' }, class: 2, masu: 'くれます\n呉れます', mashou: 'くれましょう\n呉れましょう', te: 'くれて\n呉れて', ta: 'くれた\n呉れた' },
    { dic: { japanese: 'みる\n見る' }, class: 2, masu: 'みます\n見ます', mashou: 'みましょう\n見ましょう', te: 'みて\n見て', ta: 'みた\n見た', chatta:"みちゃった\n見ちゃった", saseru: 'みさせる\n見させる' },
    { dic: { japanese: 'わすれる\n忘れる' }, class: 2, masu: 'わすれます\n忘れます', mashou: 'わすれましょう\n忘れましょう', te: 'わすれて\n忘れて', ta: 'わすれた\n忘れた' },
    // { dic: { japanese: 'あきる\n飽きる' }, class: 2, masu: 'あきます\n飽きます', mashou: 'あきましょう\nあきましょう', te: 'あきて\nあきて', ta: 'あきた\nあきた' },
    { dic: { japanese: 'あきる' }, class: 2, masu: 'あきます', mashou: 'あきましょう', te: 'あきて', ta: 'あきた' },
    { dic: { japanese: 'いる' }, class: 2, masu: 'います', mashou: 'いましょう', te: 'いて', ta: 'いた' }
  ],

  u: [
    { dic: { japanese: 'いく\n行く', exv: 1 }, class: 1, masu: 'いきます\n行きます', mashou: 'いきましょう\n行きましょう', te: 'いって\n行って', ta: 'いった\n行った', chatta:"いっちゃった\n行っちゃった", saseru: 'いかせる\n行かせる' },
    { dic: { japanese: 'つくる\n作る' }, class: 1, masu: 'つくります\n作ります', mashou: 'つくりましょう\n作りましょう', te: 'つくって\n作って', ta: 'つくった\n作った', saseru: 'つくらせる\n作らせる' },
    { dic: { japanese: '読む' }, class: 1, masu: '読みます', mashou: '読みましょう', te: '読んで', ta: '読んだ' },
    { dic: { japanese: 'きく\n聞く' }, class: 1, masu: 'ききます\n聞きます', mashou: 'ききましょう\n聞きましょう', te: 'きいて\n聞いて', ta: 'きいた\n聞いた' },
    { dic: { japanese: '遊ぶ' }, class: 1, masu: '遊びます', mashou: '遊びましょう', te: '遊んで', ta: '遊んだ' },
    { dic: { japanese: 'いそぐ\n急ぐ' }, class: 1, masu: 'いそぎます\n急ぎます', mashou: 'いそぎましょう\n急ぎましょう', te: 'いそいで\n急いで', ta: 'いそいだ\n急いだ',chatta:"いそいじゃった\n急いじゃった" },
    { dic: { japanese: 'しめす\n示す' }, class: 1, masu: 'しめします\n示します', mashou: 'しめしましょう\n示しましょう', te: 'しめして\n示して', ta: 'しめした\n示した' },
    { dic: { japanese: 'よろこぶ\n喜ぶ' }, class: 1, masu: 'よろこびます\n喜びます', mashou: 'よろこびましょう\n喜びましょう', te: 'よろこんで\n喜んで', ta: 'よろこんだ\n喜んだ' },
    { dic: { japanese: 'もらう\n貰う' }, class: 1, masu: 'もらいます\n貰います', mashou: 'もらいましょう\n貰いましょう', te: 'もらって\n貰って', ta: 'もらった\n貰った' },
    { dic: { japanese: 'はしる\n走る', exv: 1 }, class: 1, masu: 'はしります\n走ります', mashou: 'はしりましょう\n走りましょう', te: 'はしって\n走って', ta: 'はしった\n走った' },
    { dic: { japanese: 'きる\n切る', exv: 1 }, class: 1, masu: 'きります\n切ります', mashou: 'きりましょう\n切りましょう', te: 'きって\n切って', ta: 'きった\n切った' },
    { dic: { japanese: 'いる\n要る', exv: 1 }, class: 1, masu: 'いります\n要ります', mashou: 'いりましょう\n要りましょう', te: 'いって\n要って', ta: 'いった\n要った' },
    { dic: { japanese: 'はいる\n入る', exv: 1 }, class: 1, masu: 'はいります\n入ります', mashou: 'はいりましょう\n入りましょう', te: 'はいって\n入って', ta: 'はいった\n入った' },
    { dic: { japanese: 'かえる\n帰る', exv: 1 }, class: 1, masu: 'かえります\n帰ります', mashou: 'かえりましょう\n帰りましょう', te: 'かえって\n帰って', ta: 'かえった\n帰った' },
    { dic: { japanese: 'へる\n減る', exv: 1 }, class: 1, masu: 'へります\n減ります', mashou: 'へりましょう\n減りましょう', te: 'へって\n減って', ta: 'へった\n減った' },
    { dic: { japanese: 'すべる\n滑る', exv: 1 }, class: 1, masu: 'すべります\n滑ります', mashou: 'すべりましょう\n滑りましょう', te: 'すべって\n滑って', ta: 'すべった\n滑った'},
    { dic: { japanese: 'いじる\n弄る', exv: 1 }, class: 1, masu: 'いじります\n弄ります', mashou: 'いじりましょう\n弄りましょう', te: 'いじって\n弄って', ta: 'いじった\n弄った'},
    { dic: { japanese: 'たつ\n立つ'}, class: 1, reru: 'たてる\n立てる'},
  ]
};

const rawVocabularyObj = {
  "976ce81d844617d03eea831337a0ca07": {
    english: "to connect (ability, possibility)",
    grp: "Verb",
    japanese: "つなげる\n繋げる",
    romaji: "tsunageru",
    subGrp: "attachment",
    tag: ["attachment"],
  },
  fc5b75bb8f15bc9db8be7bc7afb9ee0a: {
    english: "to link, connect with, join",
    grp: "Verb",
    japanese: "つながる\n繋がる",
    romaji: "tsunagaru",
    subGrp: "attachment",
    tag: ["attachment"],
    trans: "976ce81d844617d03eea831337a0ca07",
  },
  "4f3b0dffa85324487e7130022fa2a87c": {
    english: "to be woken",
    grp: "Verb",
    japanese: "おきる\n起きる",
    romaji: "okiru",
    trans: "f7503726a6887a94a61f0797bfc8c1c2",
  },
  f7503726a6887a94a61f0797bfc8c1c2: {
    english: "to wake",
    grp: "Verb",
    japanese: "おこす\n起こす",
    romaji: "okosu",
  },
  "529c3a3d259401bf3369f77dc66def53": {
    english: "to understand",
    grp: "Verb",
    intr: true,
    japanese: "わかる\n分かる",
    romaji: "wakaru",
    subGrp: "Memory",
  },
  "07a2a0e1eafc403c7cb4d45e4f787ed0": {
    english: "to cut, shut off (power)",
    exv: 1,
    grp: "Verb",
    japanese: "きる\n切る",
    romaji: "kiru",
    subGrp: "Activities",
    tag: ["auxiliar"],
  },
};

const DEFAULT_STATE = { value: [] };
const action = { type: GET_VOCABULARY, value: rawVocabularyObj };
const vocabulary = vocabularyReducer(DEFAULT_STATE, action);

describe("JapaneseVerb", function () {
  describe("getVerbClass", function () {
    it("irr", function () {
      verbs.irr.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).getVerbClass();
        expect(actual, v.dic).to.eq(v.class);
      });
    });

    it("ichidan", function () {
      // eru/iru verbs
      verbs.ru.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).getVerbClass();
        expect(actual, v.dic).to.eq(v.class);
      });
    });

    it("godan", function () {
      // non eru/iru verbs
      verbs.u.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).getVerbClass();
        expect(actual, v.dic).to.eq(v.class);
      });
    });
  });
  describe("masuForm", function () {

    const testMasuForm = (skip, verbClass) => {
      if(verbClass.some((el)=>el.masu)){
        verbClass.forEach((v) => {
          if (v.masu) {
            const actual = JapaneseVerb.parse(v.dic).masuForm();
            expect(actual, actual.toString()).to.be.a("JapaneseText");
            expect(actual.toString(), v.dic).to.eq(v.masu);
          }
        });
      } else {
        skip();
      }
    }

    it("irr", function () {
      testMasuForm(()=>{this.skip()},verbs.irr);
    });

    it("ru-verb", function () {
      testMasuForm(()=>{this.skip()},verbs.ru);
    });

    it("u-verb", function () {
      testMasuForm(()=>{this.skip()},verbs.u);
    });
  });

  describe("mashouForm", function () {

    const testMashouForm = (skip, verbClass) => {
      if(verbClass.some((el)=>el.mashou)){
        verbClass.forEach((v) => {
          if (v.mashou) {
            const actual = JapaneseVerb.parse(v.dic).mashouForm();
            expect(actual, actual.toString()).to.be.a("JapaneseText");
            expect(actual.toString(), v.dic).to.eq(v.mashou);
          }
        });
      } else {
        skip();
      }
    }

    it("irr", function () {
      testMashouForm(()=>{this.skip()},verbs.irr);
    });

    it("ru-verb", function () {
      testMashouForm(()=>{this.skip()},verbs.ru);
    });

    it("u-verb", function () {
      testMashouForm(()=>{this.skip()},verbs.u);
    });
  });

  describe("teForm", function () {

    const testTeForm = (skip, verbClass) => {
      if(verbClass.some((el)=>el.te)){
        verbClass.forEach((v) => {
          if (v.te) {
            const actual = JapaneseVerb.parse(v.dic).teForm();
            expect(actual, actual.toString()).to.be.a("JapaneseText");
            expect(actual.toString(), v.dic).to.eq(v.te);
          }
        });
      } else {
        skip();
      }
    }

    it("irr", function () {
      testTeForm(()=>{this.skip()},verbs.irr);
    });

    it("ichidan", function () {
      testTeForm(()=>{this.skip()},verbs.ru);
    });

    it("godan", function () {
      testTeForm(()=>{this.skip()},verbs.u);
    });
  });

  describe("taForm", function () {

    const testTaForm = (skip, verbClass) => {
      if(verbClass.some((el)=>el.ta)){
        verbClass.forEach((v) => {
          if (v.ta) {
            const actual = JapaneseVerb.parse(v.dic).taForm();
            expect(actual, actual.toString()).to.be.a("JapaneseText");
            expect(actual.toString(), v.dic).to.eq(v.ta);
          }
        });
      } else {
        skip();
      }
    }

    it("irr", function () {
      testTaForm(()=>{this.skip()},verbs.irr);
    });

    it("ichidan", function () {
      testTaForm(()=>{this.skip()},verbs.ru);
    });

    it("godan", function () {
      testTaForm(()=>{this.skip()},verbs.u);
    });
  });

  describe("chattaForm", function () {
    const chattaAble = (v)=>{
      const actual = JapaneseVerb.parse(v.dic).chattaForm();
      expect(actual, actual.toString()).to.be.a("JapaneseText");
      expect(actual.toString(), v.dic).to.eq(v.chatta);
    }

    const chattaNotAble = (v)=>{
      const actual = JapaneseVerb.parse(v.dic).chattaForm();
      expect(actual, JSON.stringify(actual)).to.be.null;
    }

    it("irr", function () {
      verbs.irr.forEach((v) => {
        if (v.chatta !== undefined && v.chatta !== null) {
          chattaAble(v)
        } else if (v.chatta === null){
          chattaNotAble(v)
        }
      });
    });

    it("ichidan", function () {
      verbs.ru.forEach((v) => {
        if (v.chatta !== undefined && v.chatta !== null) {
          chattaAble(v)
        } else if (v.chatta === null){
          chattaNotAble(v)
        }
      });
    });

    it("godan", function () {
      verbs.u.forEach((v) => {
        if (v.chatta !== undefined && v.chatta !== null) {
          chattaAble(v)
        } else if (v.chatta === null){
          chattaNotAble(v)
        }
      });
    });
  });

  describe("saseruForm", function () {

    const testSaseruForm = (skip, verbClass) => {
      if(verbClass.some((el)=>el.saseru)){
        verbClass.forEach((v) => {
          if (v.saseru) {
            const actual = JapaneseVerb.parse(v.dic).saseruForm();
            expect(actual, actual.toString()).to.be.a("JapaneseText");
            expect(actual.toString(), v.dic).to.eq(v.saseru);
          }
        });
      } else {
        skip();
      }
    }

    it("irr", function () {
      testSaseruForm(()=>{this.skip()},verbs.irr);
    });

    it("ichidan", function () {
      testSaseruForm(()=>{this.skip()},verbs.ru);
    });

    it("godan", function () {
      testSaseruForm(()=>{this.skip()},verbs.u);
    });
  });

  describe("reruForm", function () {

    const testReruForm = (skip, verbClass) => {
      if(verbClass.some((el)=>el.reru)){
        verbClass.forEach((v) => {
          if (v.reru) {
            const actual = JapaneseVerb.parse(v.dic).reruForm();
            expect(actual, actual.toString()).to.be.a("JapaneseText");
            expect(actual.toString(), v.dic).to.eq(v.reru);
          }
        });
      } else {
        skip();
      }
    }

    it("irr", function () {
      testReruForm(()=>{this.skip()}, verbs.irr);
    });

    it("ichidan", function () {
      testReruForm(()=>{this.skip()}, verbs.ru);
    });

    it("godan", function () {
      testReruForm(()=>{this.skip()}, verbs.u);
    });
    it("intransitive return null")
    it("throw on exception verbs")
  });

  describe("isExceptionVerb", function () {
    it("exception verb", function () {
      const excVer = vocabulary.value.find(
        (v) => v.uid === "07a2a0e1eafc403c7cb4d45e4f787ed0"
      );
      const actual = JapaneseVerb.parse(excVer);

      expect(actual, actual.toString()).to.be.a("JapaneseVerb");
      expect(actual.isIntransitive()).to.be.false;
      expect(actual.getTransitivePair()).to.be.undefined;
      expect(actual.getIntransitivePair()).to.be.undefined;
      expect(actual.isExceptionVerb()).to.be.true;
    });
    it("regular verb", function () {
      const regVerbs = vocabulary.value.filter(
        (v) => v.uid !== "07a2a0e1eafc403c7cb4d45e4f787ed0"
      );

      for (const regular of regVerbs) {
        const actual = JapaneseVerb.parse(regular);
        expect(actual, actual.toString()).to.be.a("JapaneseVerb");
        expect(actual.isExceptionVerb()).to.be.false;
      }
    });
  });

  describe("isIntransitive", function () {
    it("intransitive no pair", function () {
      const intrVer = vocabulary.value.find(
        (v) => v.uid === "529c3a3d259401bf3369f77dc66def53"
      );
      const actual = JapaneseVerb.parse(intrVer);

      expect(actual, actual.toString()).to.be.a("JapaneseVerb");
      expect(actual.isIntransitive()).to.be.true;
      expect(actual.getTransitivePair()).to.be.undefined;
      expect(actual.getIntransitivePair()).to.be.undefined;
      expect(actual.isExceptionVerb()).to.be.false;
    });
    it("intransitive by pair", function () {
      const intrVer = vocabulary.value.find(
        (v) => v.uid === "4f3b0dffa85324487e7130022fa2a87c"
      );
      const actual = JapaneseVerb.parse(intrVer);

      expect(actual, actual.toString()).to.be.a("JapaneseVerb");
      expect(actual.isIntransitive()).to.be.true;
      expect(actual.getTransitivePair()).to.eq(
        "f7503726a6887a94a61f0797bfc8c1c2"
      );
      expect(actual.getIntransitivePair()).to.be.undefined;
      expect(actual.isExceptionVerb()).to.be.false;
    });
  });

  describe("getTransitivePair", function () {
    it("intransitive", function () {
      const intrVer = vocabulary.value.find(
        (v) => v.uid === "4f3b0dffa85324487e7130022fa2a87c"
      );
      const actual = JapaneseVerb.parse(intrVer);

      expect(actual, actual.toString()).to.be.a("JapaneseVerb");
      expect(actual.isIntransitive()).to.be.true;
      expect(actual.getTransitivePair()).to.eq(
        "f7503726a6887a94a61f0797bfc8c1c2"
      );
      expect(actual.getIntransitivePair()).to.be.undefined;
      expect(actual.isExceptionVerb()).to.be.false;
    });
  });
  
  describe("getIntransitivePair", function () {
    it("transitive", function () {
      const transVerb = vocabulary.value.find(
        (v) => v.uid === "f7503726a6887a94a61f0797bfc8c1c2"
      );
      const actual = JapaneseVerb.parse(transVerb);

      expect(actual, actual.toString()).to.be.a("JapaneseVerb");
      expect(actual.isIntransitive()).to.be.false;
      expect(actual.getTransitivePair()).to.be.undefined;
      expect(actual.getIntransitivePair()).to.eq(
        "4f3b0dffa85324487e7130022fa2a87c"
      );
      expect(actual.isExceptionVerb()).to.be.false;
    });
  });
});
