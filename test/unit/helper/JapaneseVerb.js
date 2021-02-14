import { expect } from "chai";
import { JapaneseVerb } from "../../../src/helper/JapaneseVerb";

describe("JapaneseVerb", function () {
  describe("getVerbClass", function () {
    it("irregular", function () {
      const verbs = ["する", "くる\n来る"];

      verbs.forEach((v) => {
        const actual = JapaneseVerb.parse(v).getVerbClass();
        expect(actual).to.eq(3);
      });
    });

    it("ichidan", function () {
      // eru/iru verbs
      const verbs = ["くれる\n呉れる", "みる\n見る", "わすれる\n忘れる"];

      verbs.forEach((v) => {
        const actual = JapaneseVerb.parse(v).getVerbClass();
        expect(actual, v).to.eq(2);
      });
    });

    it("godan", function () {
      // non eru/iru verbs
      const verbs = ["つくる\n作る", "いく\n行く"];

      verbs.forEach((v) => {
        const actual = JapaneseVerb.parse(v).getVerbClass();
        expect(actual).to.eq(1);
      });
    });
  });
  describe("masuForm", function () {
    it("irregular", function () {
      const verb = ["する", "くる\n来る"];
      const expected = ["します", "きます\n来ます"];
      verb.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).masuForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("ru-verb", function () {
      const verb = [
        // "見る",
        "みる",
        "みる\n見る",
        "つくる\n作る",
        "わすれる\n忘れる",
      ];
      const expected = [
        // "見ます",
        "みます",
        "みます\n見ます",
        "つくります\n作ります",
        "わすれます\n忘れます",
      ];

      verb.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).masuForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("u-verb", function () {
      const verb = ["読む", "いく\n行く", "きく\n聞く"];
      const expected = ["読みます", "いきます\n行きます", "ききます\n聞きます"];

      verb.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).masuForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });
  });

  describe("mashouForm", function () {
    it("irregular", function () {
      const verb = ["する"];
      const expected = ["しましょう"];

      verb.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).mashouForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("ru-verb", function () {
      const verb = [
        // "見る",
        "みる",
        "みる\n見る",
        "つくる\n作る",
        "わすれる\n忘れる",
      ];
      const expected = [
        // "見ます",
        "みましょう",
        "みましょう\n見ましょう",
        "つくりましょう\n作りましょう",
        "わすれましょう\n忘れましょう",
      ];

      verb.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).mashouForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("u-verb", function () {
      const verb = ["読む", "いく\n行く", "きく\n聞く"];
      const expected = [
        "読みましょう",
        "いきましょう\n行きましょう",
        "ききましょう\n聞きましょう",
      ];

      verb.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).mashouForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });
  });

  describe("teForm", function () {
    it("da desu", function () {
      const verbs = ["だ"];
      const expected = ["で"];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).teForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("irregular", function () {
      const verbs = ["する", "くる\n来る"];
      const expected = ["して", "きて\n来て"];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).teForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("ichidan", function () {
      const verbs = ["食べる", "起きる", "閉じる"];
      const expected = ["食べて", "起きて", "閉じて"];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).teForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("godan", function () {
      const verbs = [
        "会う",
        "立つ",
        "変わる",
        "書く",
        "泳ぐ",
        "死ぬ",
        "遊ぶ",
        "休む",
      ];
      const expected = [
        "会って",
        "立って",
        "変わって",
        "書いて",
        "泳いで",
        "死んで",
        "遊んで",
        "休んで",
      ];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).teForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });
  });
  describe("taForm", function () {
    it("irregular", function () {
      const verbs = ["する", "くる\n来る"];
      const expected = ["した", "きた\n来た"];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).taForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("ichidan", function () {
      const verbs = ["食べる", "起きる", "閉じる"];
      const expected = ["食べた", "起きた", "閉じた"];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).taForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });

    it("godan", function () {
      const verbs = [
        "会う",
        "立つ",
        "変わる",
        "書く",
        "泳ぐ",
        "死ぬ",
        "遊ぶ",
        "休む",
      ];
      const expected = [
        "会った",
        "立った",
        "変わった",
        "書いた",
        "泳いだ",
        "死んだ",
        "遊んだ",
        "休んだ",
      ];

      verbs.forEach((v, i) => {
        const actual = JapaneseVerb.parse(v).taForm();
        expect(actual.toString()).to.eq(expected[i]);
      });
    });
  });
});
