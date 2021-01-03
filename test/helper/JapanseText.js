import { expect } from "chai";
import { configure, shallow } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { JapaneseText } from "../../src/helper/JapaneseText";
import { buildHTMLElement, furiganaParse } from "../../src/helper/JapaneseText";

configure({ adapter: new Adapter() });

describe("JapanseText", function () {
  describe("toString", function () {
    it("hiragana", function () {
      const hiragana = "する";

      const text = new JapaneseText(hiragana);

      expect("" + text).to.equal(hiragana);
    });

    it("hiragana and kanji", function () {
      const phrase = "きたない\n汚い";

      const text = new JapaneseText("きたない", "汚い");

      expect("" + text).to.equal(phrase);
    });
  });

  describe("buildHTMLElement", function () {
    it("starting and ending with hiragana", function () {
      const kanjis = ["会計", "願"];
      const furiganas = ["かいけい", "ねが"];
      const nonKanjis = ["お", "をお", "いします"];
      const startsWHiragana = true;

      const expected = "お会計かいけいをお願ねがいします";

      const actual = buildHTMLElement(
        kanjis,
        furiganas,
        nonKanjis,
        startsWHiragana
      );
      const wrapper = shallow(actual);

      expect(wrapper.text()).to.equal(expected);
    });
  });

  describe("furiganaParse", function () {
    it("non matching input should throw", function () {
      // TODO: do more edge case testing
      const furigana = "きたな"; //い
      const kanji = "汚い";

      const actual = () => furiganaParse(furigana, kanji);

      expect(actual).to.throw(Error, "The two phrases do not match");
    });
    it("starting kanji ending hiragana", function () {
      const expectedKanjis = ["汚"];
      const expectedFuriganas = ["きたな"];
      const expectedNonKanjis = ["い"];
      const expectedStartsWHiragana = false;

      const furigana = "きたない";
      const kanji = "汚い";
      const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWHiragana, "startsWHiragana").to.deep.eq(
        expectedStartsWHiragana
      );
    });
    it.skip("starting hiragana ending kanji", function () {});

    it("starts and ends in kanji", function () {
      const expectedKanjis = ["早起", "三文", "得"];
      const expectedFuriganas = ["はやお", "さんもん", "とく"];
      const expectedNonKanjis = ["きは", "の"];
      const expectedStartsWHiragana = false;

      const furigana = "はやおきはさんもんのとく";
      const kanji = "早起きは三文の得";
      const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWHiragana, "startsWHiragana").to.deep.eq(
        expectedStartsWHiragana
      );
    });

    it("only kanjis", function () {
      const expectedKanjis = ["上記"];
      const expectedFuriganas = ["ほおき"];
      const expectedNonKanjis = [];
      const expectedStartsWHiragana = false;

      const furigana = "ほおき";
      const kanji = "上記";
      const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWHiragana, "startsWHiragana").to.deep.eq(
        expectedStartsWHiragana
      );
    });

    it("one kanji", function () {
      const expectedKanjis = ["氷"];
      const expectedFuriganas = ["こおり"];
      const expectedNonKanjis = [];
      const expectedStartsWHiragana = false;

      const furigana = "こおり";
      const kanji = "氷";
      const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWHiragana, "startsWHiragana").to.deep.eq(
        expectedStartsWHiragana
      );
    });
    it("starting and ending with hiragana", function () {
      const expectedKanjis = ["会計", "願"];
      const expectedFuriganas = ["かいけい", "ねが"];
      const expectedNonKanjis = ["お", "をお", "いします。"];
      const expectedStartsWHiragana = true;

      const furigana = "おかいけいをおねがいします。";
      const kanji = "お会計をお願いします。";
      const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(nonKanjis).to.deep.eq(expectedNonKanjis);
      expect(startsWHiragana).to.deep.eq(expectedStartsWHiragana);
    });
  });
});