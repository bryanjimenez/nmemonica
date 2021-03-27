import { expect } from "chai";
import { JapaneseVerb } from "../../../src/helper/JapaneseVerb";

const verbs = {

  irr: [
    { dic:'だ',class:3, masu:'です', mashou:'でしょう', te:'で', ta:'だった' },
    { dic: "する", class: 3, masu: "します", mashou: "しましょう", te: "して", ta: "した" },
    { dic: "くる\n来る", class: 3, masu: "きます\n来ます", mashou: "きましょう\n来ましょう", te: "きて\n来て", ta: "きた\n来た" },
    { dic: "あいする\n愛する", class: 3, masu: "あいします\n愛します", mashou: "あいしましょう\n愛しましょう", te: "あいして\n愛して", ta: "あいした\n愛した" },

    { dic: "ある", class: 3, masu: "あります", mashou: "ありましょう", te: "あって", ta: "あった" },
  ],

  ru: [
    { dic: "くれる\n呉れる", class: 2, masu: "くれます\n呉れます", mashou: "くれましょう\n呉れましょう", te: "くれて\n呉れて", ta: "くれた\n呉れた" },
    { dic: "みる\n見る", class: 2, masu: "みます\n見ます", mashou: "みましょう\n見ましょう", te: "みて\n見て", ta: "みた\n見た" },
    { dic: "わすれる\n忘れる", class: 2, masu: "わすれます\n忘れます", mashou: "わすれましょう\n忘れましょう", te: "わすれて\n忘れて", ta: "わすれた\n忘れた" },
    // { dic: "あきる\n飽きる", class: 2, masu: "あきます\n飽きます", mashou: "あきましょう\nあきましょう", te: "あきて\nあきて", ta: "あきた\nあきた" },
    { dic: "あきる", class: 2, masu: "あきます", mashou: "あきましょう", te: "あきて", ta: "あきた" },

    { dic: "いる", class: 2, masu: "います", mashou: "いましょう", te: "いて", ta: "いた" },
  ],

  u: [
    { dic: "いく\n行く", class: 1, masu: "いきます\n行きます", mashou: "いきましょう\n行きましょう", te: "いって\n行って", ta: "いった\n行った" },
    { dic: "つくる\n作る", class: 1, masu: "つくります\n作ります", mashou: "つくりましょう\n作りましょう", te: "つくって\n作って", ta: "つくった\n作った" },
    { dic: "読む", class: 1, masu: "読みます", mashou: "読みましょう", te: "読んで", ta: "読んだ" },
    { dic: "きく\n聞く", class: 1, masu: "ききます\n聞きます", mashou: "ききましょう\n聞きましょう", te: "きいて\n聞いて", ta: "きいた\n聞いた" },
    { dic: "遊ぶ", class: 1, masu: "遊びます", mashou: "遊びましょう", te: "遊んで", ta: "遊んだ" },
    { dic: "いそぐ\n急ぐ", class: 1, masu: "いそぎます\n急ぎます", mashou: "いそぎましょう\n急ぎましょう", te: "いそいで\n急いで", ta: "いそいだ\n急いだ" },
    { dic: "しめす\n示す", class: 1, masu: "しめします\n示します", mashou: "しめしましょう\n示しましょう", te: "しめして\n示して", ta: "しめした\n示した" },
    { dic: "よろこぶ\n喜ぶ", class: 1, masu: "よろこびます\n喜びます", mashou: "よろこびましょう\n喜びましょう", te: "よろこんで\n喜んで", ta: "よろこんだ\n喜んだ" },
    { dic: "もらう\n貰う", class: 1, masu: "もらいます\n貰います", mashou: "もらいましょう\n貰いましょう", te: "もらって\n貰って", ta: "もらった\n貰った" },
  ],
};

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
    it("irr", function () {
      verbs.irr.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).masuForm();
        expect(actual.toString(), v.dic).to.eq(v.masu);
      });
    });

    it("ru-verb", function () {
      verbs.ru.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).masuForm();
        expect(actual.toString(), v.dic).to.eq(v.masu);
      });
    });

    it("u-verb", function () {
      verbs.u.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).masuForm();
        expect(actual.toString(), v.dic).to.eq(v.masu);
      });
    });
  });

  describe("mashouForm", function () {
    it("irr", function () {
      verbs.irr.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).mashouForm();
        expect(actual.toString(), v.dic).to.eq(v.mashou);
      });
    });

    it("ru-verb", function () {
      verbs.ru.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).mashouForm();
        expect(actual.toString(), v.dic).to.eq(v.mashou);
      });
    });

    it("u-verb", function () {
      verbs.u.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).mashouForm();
        expect(actual.toString(), v.dic).to.eq(v.mashou);
      });
    });
  });

  describe("teForm", function () {
    it("irr", function () {
      verbs.irr.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).teForm();
        expect(actual.toString(), v.dic).to.eq(v.te);
      });
    });

    it("ichidan", function () {
      verbs.ru.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).teForm();
        expect(actual.toString(), v.dic).to.eq(v.te);
      });
    });

    it("godan", function () {
      verbs.u.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).teForm();
        expect(actual.toString(), v.dic).to.eq(v.te);
      });
    });
  });
  describe("taForm", function () {
    it("irr", function () {
      verbs.irr.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).taForm();
        expect(actual.toString(), v.dic).to.eq(v.ta);
      });
    });

    it("ichidan", function () {
      verbs.ru.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).taForm();
        expect(actual.toString(), v.dic).to.eq(v.ta);
      });
    });

    it("godan", function () {
      verbs.u.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).taForm();
        expect(actual.toString(), v.dic).to.eq(v.ta);
      });
    });
  });
});
