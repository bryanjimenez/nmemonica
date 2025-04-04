import { expect } from "chai";
import {
  getConsonantVowel,
  isHiragana,
  isKanji,
  isKatakana,
  isPunctuation,
  swapKana,
  toEnglishNumber,
} from "../../../src/helper/kanaHelper";

/* global describe it */

describe("kanaHelper", function () {
  describe("isHiragana", function () {
    const hiragana = [
      "あ",
      "い",
      "う",
      "え",
      "お",
      "か",
      "き",
      "く",
      "け",
      "こ",
      "が",
      "ぎ",
      "ぐ",
      "げ",
      "ご",
      "さ",
      "し",
      "す",
      "せ",
      "そ",
      "ざ",
      "じ",
      "ず",
      "ぜ",
      "ぞ",
      "た",
      "ち",
      "つ",
      "て",
      "と",
      "だ",
      "ぢ",
      "づ",
      "で",
      "ど",
      "な",
      "に",
      "ぬ",
      "ね",
      "の",
      "は",
      "ひ",
      "ふ",
      "へ",
      "ほ",
      "ば",
      "び",
      "ぶ",
      "べ",
      "ぼ",
      "ぱ",
      "ぴ",
      "ぷ",
      "ぺ",
      "ぽ",
      "ま",
      "み",
      "む",
      "め",
      "も",
      "や",
      "ゆ",
      "よ",
      "ら",
      "り",
      "る",
      "れ",
      "ろ",
      "わ",
      "ゐ",
      "ゑ",
      "を",
      "ん",
      "ゃ",
      "ゅ",
      "ょ",
      "っ",
      "ゝ",
      "ゞ",
    ];

    it("hiragana", function () {
      const expected = hiragana.map(() => true);

      const actual = hiragana.map((char) => isHiragana(char));

      expect(actual).to.deep.equal(expected);
    });
  });

  describe("isKatakana", function () {
    const katakana = [
      "ア",
      "イ",
      "ウ",
      "エ",
      "オ",
      "カ",
      "キ",
      "ク",
      "ケ",
      "コ",
      "ガ",
      "ギ",
      "グ",
      "ゲ",
      "ゴ",
      "サ",
      "シ",
      "ス",
      "セ",
      "ソ",
      "ザ",
      "ジ",
      "ズ",
      "ゼ",
      "ゾ",
      "タ",
      "チ",
      "ツ",
      "テ",
      "ト",
      "ダ",
      "ヂ",
      "ヅ",
      "デ",
      "ド",
      "ナ",
      "ニ",
      "ヌ",
      "ネ",
      "ノ",
      "ハ",
      "ヒ",
      "フ",
      "ヘ",
      "ホ",
      "バ",
      "ビ",
      "ブ",
      "ベ",
      "ボ",
      "パ",
      "ピ",
      "プ",
      "ペ",
      "ポ",
      "マ",
      "ミ",
      "ム",
      "メ",
      "モ",
      "ヤ",
      "ユ",
      "ヨ",
      "ラ",
      "リ",
      "ル",
      "レ",
      "ロ",
      "ワ",
      "ヰ",
      "ヱ",
      "ヲ",
      "ン",
      "ー",

      "ャ",
      "ュ",
      "ョ",
      "ッ",

      "ァ",
      "ィ",
      "ゥ",
      "ェ",
      "ォ",

      "ヽ",
      "ヾ",
    ];

    it("katakana", function () {
      const expected = katakana.map(() => true);
      const actual = katakana.map((char) => isKatakana(char));
      expect(actual).to.deep.equal(expected);
    });
  });

  describe("isPunctuation", function () {
    const punctuation = ["。", "、", "？", "！", "「", "」"];
    const noma = ["々"];
    it("punctuation", function () {
      const expected = punctuation.map(() => true);
      const actual = punctuation.map((p) => isPunctuation(p));
      expect(actual).to.deep.equal(expected);
    });
    it("noma is excluded", function () {
      const expected = noma.map(() => false);
      const actual = noma.map((p) => isPunctuation(p));
      expect(actual).to.deep.equal(expected);
    });
  });

  describe("isKanji", function () {
    const kanji = ["々"];
    it("noma exception", function () {
      const expected = kanji.map(() => true);
      const actual = kanji.map((k) => isKanji(k));
      expect(actual).to.deep.equal(expected);
    });
  });

  describe("swapKana", function () {
    const kanas = [
      ["ア", "あ"],
      ["イ", "い"],
      ["ウ", "う"],
      ["エ", "え"],
      ["オ", "お"],
      ["カ", "か"],
      ["キ", "き"],
      ["ク", "く"],
      ["ケ", "け"],
      ["コ", "こ"],
      ["ガ", "が"],
      ["ギ", "ぎ"],
      ["グ", "ぐ"],
      ["ゲ", "げ"],
      ["ゴ", "ご"],
      ["サ", "さ"],
      ["シ", "し"],
      ["ス", "す"],
      ["セ", "せ"],
      ["ソ", "そ"],
      ["ザ", "ざ"],
      ["ジ", "じ"],
      ["ズ", "ず"],
      ["ゼ", "ぜ"],
      ["ゾ", "ぞ"],
      ["タ", "た"],
      ["チ", "ち"],
      ["ツ", "つ"],
      ["テ", "て"],
      ["ト", "と"],
      ["ダ", "だ"],
      ["ヂ", "ぢ"],
      ["ヅ", "づ"],
      ["デ", "で"],
      ["ド", "ど"],
      ["ナ", "な"],
      ["ニ", "に"],
      ["ヌ", "ぬ"],
      ["ネ", "ね"],
      ["ノ", "の"],
      ["ハ", "は"],
      ["ヒ", "ひ"],
      ["フ", "ふ"],
      ["ヘ", "へ"],
      ["ホ", "ほ"],
      ["バ", "ば"],
      ["ビ", "び"],
      ["ブ", "ぶ"],
      ["ベ", "べ"],
      ["ボ", "ぼ"],
      ["パ", "ぱ"],
      ["ピ", "ぴ"],
      ["プ", "ぷ"],
      ["ペ", "ぺ"],
      ["ポ", "ぽ"],
      ["マ", "ま"],
      ["ミ", "み"],
      ["ム", "む"],
      ["メ", "め"],
      ["モ", "も"],
      ["ヤ", "や"],
      ["ユ", "ゆ"],
      ["ヨ", "よ"],
      ["ラ", "ら"],
      ["リ", "り"],
      ["ル", "る"],
      ["レ", "れ"],
      ["ロ", "ろ"],
      ["ワ", "わ"],
      ["ヰ", "ゐ"],
      ["ヱ", "ゑ"],
      ["ヲ", "を"],
      ["ン", "ん"],
      ["ャ", "ゃ"],
      ["ュ", "ゅ"],
      ["ョ", "ょ"],
      ["ッ", "っ"],
      ["ヽ", "ゝ"],
      ["ヾ", "ゞ"],
    ];
    it("swapKana", function () {
      const expected = kanas.map(() => true);
      const actual = kanas.map(
        ([k, h]) => h === swapKana(k) && k === swapKana(h)
      );

      expect(actual).to.deep.equal(expected);
    });
  });

  describe("getConsonantVowel", function () {
    it("getConsonantVowel", function () {
      const { iConsonant, iVowel } = getConsonantVowel("や");
      expect(iConsonant).to.equal(12);
      expect(iVowel).to.equal(0);
    });
    it("getConsonantVowel no vowel", function () {
      const { iConsonant, iVowel } = getConsonantVowel("ん");
      expect(iConsonant).to.equal(15);
      expect(iVowel).to.equal(-1);
    });
    it("getConsonantVowel bad input", function () {
      const { iConsonant, iVowel } = getConsonantVowel(" ");
      expect(iConsonant).to.equal(-1);
      expect(iVowel).to.equal(-1);
    });
  });
  describe("toEnglishNumber", function () {
    it("is a digit", function () {
      //０１２３４５６７８９

      const zero = toEnglishNumber("０");
      expect(zero).to.eq(0);

      const one = toEnglishNumber("１");
      expect(one).to.eq(1);

      const two = toEnglishNumber("２");
      expect(two).to.eq(2);
    });
  });
});
