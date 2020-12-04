import { expect } from "chai";
import {
  masuForm,
  dictionaryVerbClass,
  teForm,
} from "../../src/helper/verbForms";

describe("verbForms", function () {
  describe("masuForm", function () {
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
        const actual = masuForm(v);
        expect(actual).to.eq(expected[i]);
      });
    });
    it("u-verb", function () {
      const verb = ["読む", "いく\n行く", "きく\n聞く"];
      const expected = ["読みます", "いきます\n行きます", "ききます\n聞きます"];

      verb.forEach((v, i) => {
        const actual = masuForm(v);
        expect(actual).to.eq(expected[i]);
      });
    });

    it("irregular", function () {
      const verb = ["する", "くる\n来る"];
      const expected = ["します", "きます\n来ます"];

      verb.forEach((v, i) => {
        const actual = masuForm(v);
        expect(actual).to.eq(expected[i]);
      });
    });
  });

  describe("dictionaryVerbClass", function () {
    it("irregular", function () {
      const verb = ["する", "くる\n来る"];

      verb.forEach((v, i) => {
        const actual = dictionaryVerbClass(v);
        expect(actual).to.eq(3);
      });
    });
    it("godan", function () {
      // non eru/iru verbs
      const verb = ["つくる\n作る", "いく\n行く"];

      verb.forEach((v, i) => {
        const actual = dictionaryVerbClass(v);
        expect(actual).to.eq(1);
      });
    });
    it("ichidan", function () {
      // eru/iru verbs
      const verb = ["くれる\n呉れる", "みる\n見る", "わすれる\n忘れる"];

      verb.forEach((v, i) => {
        const actual = dictionaryVerbClass(v);
        expect(actual, v).to.eq(2);
      });
    });
  });
  describe("teForm", function () {
    it("da desu", function () {
      const verbs = ["だ"];
      const expected = ["で"];

      verbs.forEach((inp, i) => {
        expect(teForm(inp)).to.eq(expected[i]);
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
      //会う　→　会って
      //立つ　→　立って
      //変わる　→　変わって
      //書く　→　書いて
      //泳ぐ　→　泳いで
      //死ぬ　→　死んで
      //遊ぶ　→　遊んで
      //休む　→　休んで
      verbs.forEach((inp, i) => {
        expect(teForm(inp)).to.eq(expected[i]);
      });
    });
    it("godan", function () {
      const input = [
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
      //会う　→　会って
      //立つ　→　立って
      //変わる　→　変わって
      //書く　→　書いて
      //泳ぐ　→　泳いで
      //死ぬ　→　死んで
      //遊ぶ　→　遊んで
      //休む　→　休んで
      input.forEach((inp, i) => {
        expect(teForm(inp, "godan")).to.eq(expected[i]);
      });
    });

    it("ichidan", function () {
      const input = ["食べる", "起きる", "閉じる"];
      const expected = ["食べて", "起きて", "閉じて"];
      // 食べる　→　食べて
      // 起きる　→　起きて
      // 閉じる　→　閉じて
      input.forEach((inp, i) => {
        expect(teForm(inp, "ichidan")).to.eq(expected[i]);
      });
    });
  });
});
