import React from "react";
import { expect } from "chai";
import { configure, shallow } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { htmlElementHint, JapaneseText } from "../../../src/helper/JapaneseText";
import { buildHTMLElement, furiganaParse } from "../../../src/helper/JapaneseText";

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

  describe("toHTML", function () {
    it("no furigana", function () {
      const hiragana = "する";

      const expected = hiragana;

      const text = new JapaneseText(hiragana);
      const wrapper = shallow(text.toHTML());

      expect(wrapper.text()).to.equal(expected);
    })

    it("furigana", function () {
      const furigana = "きたない"
      const kanji = "汚い";

      const expected = "汚" + "きたな" + "い";

      const text = new JapaneseText(furigana, kanji);
      const wrapper = shallow(text.toHTML());

      expect(wrapper.text()).to.equal(expected);
    })

    it("failed parse word", function () {
      const furigana = "いつつ"
      const kanji = "五つ";

      const expected = furigana+kanji;

      const text = new JapaneseText(furigana, kanji);
      const wrapper = shallow(text.toHTML());

      expect(wrapper.text()).to.equal(expected);
    })
  })

  describe("buildHTMLElement", function () {
    it("starting and ending with hiragana", function () {
      const kanjis = ["会計", "願"];
      const furiganas = ["かいけい", "ねが"];
      const nonKanjis = ["お", "をお", "いします"];
      const startsWKana = true;

      const expected = "お会計かいけいをお願ねがいします";

      const actual = buildHTMLElement(
        kanjis,
        furiganas,
        nonKanjis,
        startsWKana
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
    it("failed parse validation should throw", function () {
      const furigana = "いつつ"
      const kanji = "五つ";

      const actual = () => furiganaParse(furigana, kanji);

      expect(actual).to.throw(Error, "Failed to parse text to build furigana");
    });

    it("failed parse validation w/ space workaround should not throw", function () {
      const expectedKanjis = ["五"];
      const expectedFuriganas = ["いつ"];
      const expectedNonKanjis = ["つ"];
      const expectedStartsWHiragana = false;

      const furigana = "いつ つ"
      const kanji = "五 つ";

      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWKana, "startsWKana").to.deep.eq(
        expectedStartsWHiragana
      );
    });

    it("starting kanji ending hiragana", function () {
      const expectedKanjis = ["汚"];
      const expectedFuriganas = ["きたな"];
      const expectedNonKanjis = ["い"];
      const expectedStartsWHiragana = false;

      const furigana = "きたない";
      const kanji = "汚い";
      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWKana, "startsWKana").to.deep.eq(
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
      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWKana, "startsWKana").to.deep.eq(
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
      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWKana, "startsWKana").to.deep.eq(
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
      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(nonKanjis, "nonkanjis").to.deep.eq(expectedNonKanjis);
      expect(startsWKana, "startsWKana").to.deep.eq(
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
      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(nonKanjis).to.deep.eq(expectedNonKanjis);
      expect(startsWKana).to.deep.eq(expectedStartsWHiragana);
    });
    it("starting with kanji contains hiragana and katakana", function () {
      const expectedKanjis = ["消"];
      const expectedFuriganas = ["け"];
      const expectedNonKanjis = ["しゴム"];
      const expectedStartsWHiragana = false;

      const furigana = "けしゴム";
      const kanji = "消しゴム";
      const { kanjis, furiganas, nonKanjis, startsWKana } = furiganaParse(
        furigana,
        kanji
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(nonKanjis).to.deep.eq(expectedNonKanjis);
      expect(startsWKana).to.deep.eq(expectedStartsWHiragana);
    });

  });
});

describe("htmlElementHint", function () {
  it("under minChars kanji", function () {
    const actual = htmlElementHint("なつ\n夏");
    expect(actual).to.be.undefined;
  });
  it("under minChars hiragana", function () {
    const actual = htmlElementHint("これ");
    expect(actual).to.be.undefined;
  });
  it("hiragana only", function () {
    const input = "かかる";
    const expected = "か";
    const actual = htmlElementHint(input);
    const wrapper = shallow(actual);
    expect(wrapper.text()).to.equal(expected);
  });
  it("katakana only", function () {
    const input = "アパート";
    const expected = "ア";
    const actual = htmlElementHint(input);
    const wrapper = shallow(actual);
    expect(wrapper.text()).to.equal(expected);
  });
  it("starting kanji with furigana", function () {
    const input = "あさごはん\n朝ご飯";
    const firstKanji = "朝";
    const firstFurigana = "あ";
    const actual = htmlElementHint(input);
    const wrapper = shallow(actual);
    expect(
      wrapper.contains(
        <ruby>
          {firstKanji}
          <rt>{firstFurigana}</rt>
        </ruby>
      )
    ).to.be.true;
  });
});
