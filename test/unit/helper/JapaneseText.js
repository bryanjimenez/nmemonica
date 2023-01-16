import 'jsdom-global/register';
import { render, screen } from '@testing-library/react';
import { expect } from "chai";
import {
  furiganaParseRetry,
  JapaneseText,
} from "../../../src/helper/JapaneseText";
import {
  furiganaParse,
} from "../../../src/helper/JapaneseText";
import { kanaHintBuilder } from "../../../src/helper/kanaHelper";
import { furiganaHintBuilder } from "../../../src/helper/kanjiHelper";

/* global describe it */

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
      render(text.toHTML());

      expect(screen.getByText(expected).tagName).to.equal('SPAN');
    });

    it("furigana", function () {
      const said = "きたない";
      const written = "汚い";

      const expected = "汚" + "きたな" + "い";

      const text = new JapaneseText(said, written);
      render(text.toHTML());

      expect(screen.getByText("汚").tagName).to.equal('SPAN');
      expect(screen.getByText("きたな").tagName).to.equal('SPAN');
      expect(screen.getByText("い").tagName).to.equal('SPAN');
    });

    it.skip("repeated hiragana (furigana-okurigana)", function () {
      const said = "いつつ";
      const written = "五つ";

      // kanji + furigana + okurigana
      const expected = "五" + "いつ" + "つ";

      const text = new JapaneseText(said, written);
      render(text.toHTML());

      expect(screen.getByText("五").tagName).to.equal('SPAN');
      expect(screen.getByText("いつ").tagName).to.equal('SPAN');
      expect(screen.getByText("つ").tagName).to.equal('SPAN');
    });
  });

  describe("furiganaParse", function () {
    it("non matching input should throw", function () {
      // TODO: do more edge case testing
      const said = "きたな"; //い
      const written = "汚い";

      const actual = () => furiganaParse(said, written);

      expect(actual).to.throw(Error, "The two phrases do not match");
    });
    it("failed parse validation should throw", function () {
      const said = "いつつ";
      const written = "五つ";

      const actual = () => furiganaParse(said, written);

      expect(actual).to.throw(Error, "Failed to parse text to build furigana");
    });
    it("failed parse validation w/ space workaround should not throw", function () {
      const said = "いつ つ";
      const written = "五 つ";

      const expected = {
        kanjis: ["五"],
        furiganas: ["いつ"],
        okuriganas: ["つ"],
        startsWKana: false,
      };

      const actual = () => furiganaParse(said, written);

      expect(actual).to.not.throw(
        Error,
        "Failed to parse text to build furigana"
      );
      expect(actual()).to.deep.equal(expected);
    });

    it("failed parse validation RETRY should not throw", function () {
      const said = "いつつ";
      const written = "五つ";

      const expected = {
        kanjis: ["五"],
        furiganas: ["いつ"],
        okuriganas: ["つ"],
        startsWKana: false,
      };

      const actual = () => furiganaParseRetry(said, written);

      expect(actual).to.not.throw(
        Error,
        "Failed to parse text to build furigana"
      );
      expect(actual()).to.deep.equal(expected);
    });

    it("starting kanji ending hiragana", function () {
      const expectedKanjis = ["汚"];
      const expectedFuriganas = ["きたな"];
      const expectedOkuriganas = ["い"];
      const expectedStartsWHiragana = false;

      const said = "きたない";
      const written = "汚い";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(okuriganas, "okuriganas").to.deep.eq(expectedOkuriganas);
      expect(startsWKana, "startsWKana").to.deep.eq(expectedStartsWHiragana);
    });
    it.skip("starting hiragana ending kanji", function () {});

    it("starts and ends in kanji", function () {
      const expectedKanjis = ["早起", "三文", "得"];
      const expectedFuriganas = ["はやお", "さんもん", "とく"];
      const expectedOkuriganas = ["きは", "の"];
      const expectedStartsWHiragana = false;

      const said = "はやおきはさんもんのとく";
      const written = "早起きは三文の得";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(okuriganas, "okuriganas").to.deep.eq(expectedOkuriganas);
      expect(startsWKana, "startsWKana").to.deep.eq(expectedStartsWHiragana);
    });

    it("only kanjis", function () {
      const expectedKanjis = ["上記"];
      const expectedFuriganas = ["ほおき"];
      const expectedOkuriganas = [];
      const expectedStartsWHiragana = false;

      const said = "ほおき";
      const written = "上記";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(okuriganas, "okuriganas").to.deep.eq(expectedOkuriganas);
      expect(startsWKana, "startsWKana").to.deep.eq(expectedStartsWHiragana);
    });

    it("one kanji", function () {
      const expectedKanjis = ["氷"];
      const expectedFuriganas = ["こおり"];
      const expectedOkuriganas = [];
      const expectedStartsWHiragana = false;

      const said = "こおり";
      const written = "氷";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis, "kanjis").to.deep.eq(expectedKanjis);
      expect(furiganas, "furiganas").to.deep.eq(expectedFuriganas);
      expect(okuriganas, "okuriganas").to.deep.eq(expectedOkuriganas);
      expect(startsWKana, "startsWKana").to.deep.eq(expectedStartsWHiragana);
    });
    it("starting and ending with hiragana", function () {
      const expectedKanjis = ["会計", "願"];
      const expectedFuriganas = ["かいけい", "ねが"];
      const expectedOkuriganas = ["お", "をお", "いします。"];
      const expectedStartsWHiragana = true;

      const said = "おかいけいをおねがいします。";
      const written = "お会計をお願いします。";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(okuriganas).to.deep.eq(expectedOkuriganas);
      expect(startsWKana).to.deep.eq(expectedStartsWHiragana);
    });
    it("starting with kanji contains hiragana and katakana", function () {
      const expectedKanjis = ["消"];
      const expectedFuriganas = ["け"];
      const expectedOkuriganas = ["しゴム"];
      const expectedStartsWHiragana = false;

      const said = "けしゴム";
      const written = "消しゴム";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(okuriganas).to.deep.eq(expectedOkuriganas);
      expect(startsWKana).to.deep.eq(expectedStartsWHiragana);
    });

    it("contains punctuation marks", function () {
      const expectedKanjis = ["罠", "気", "彼女", "高", "声", "叫"];
      const expectedFuriganas = [
        "わな",
        "き",
        "かのじょ",
        "たか",
        "こえ",
        "さけ",
      ];
      const expectedOkuriganas = [
        "に",
        "をつけてっ！と",
        "は",
        "い",
        "で",
        "んだ",
      ];
      const expectedStartsWHiragana = false;

      const said = "わなにきをつけてっ！とかのじょはたかいこえでさけんだ";
      const written = "罠に気をつけてっ！と彼女は高い声で叫んだ";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(okuriganas).to.deep.eq(expectedOkuriganas);
      expect(startsWKana).to.deep.eq(expectedStartsWHiragana);
    });

    it("more punctuation marks", function () {
      const expectedKanjis = ["一口食"];
      const expectedFuriganas = ["ひとくちた"];
      const expectedOkuriganas = ["ねえ、", "べない？"];
      const expectedStartsWHiragana = true;

      const said = "ねえ、ひとくちたべない？";
      const written = "ねえ、一口食べない？";
      const { kanjis, furiganas, okuriganas, startsWKana } = furiganaParse(
        said,
        written
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(okuriganas).to.deep.eq(expectedOkuriganas);
      expect(startsWKana).to.deep.eq(expectedStartsWHiragana);
    });

    it("arabic number with furigana", function () {
      const said = "それをいちにちでおえるのはほとんどふかのうだ";
      const written = "それを１日で終えるのはほとんど不可能だ";

      const expected = {
        kanjis: ["１日", "終", "不可能"],
        furiganas: ["いちにち", "お", "ふかのう"],
        okuriganas: ["それを", "で", "えるのはほとんど", "だ"],
        startsWKana: true,
      };

      const actual = () => furiganaParseRetry(said, written);

      expect(actual).to.not.throw(
        Error,
        "Failed to parse text to build furigana"
      );
      expect(actual()).to.deep.equal(expected);
    });
  });
});

describe("isHintable", function () {
  it("under minChars kanji", function () {
    const j = { japanese: "なつ\n夏" };
    const actual = JapaneseText.parse(j);

    expect(actual.isHintable()).to.be.false;
    expect(actual.isHintable(2)).to.be.true;
  });
  it("under minChars hiragana", function () {
    const j = { japanese: "これ" };
    const actual = JapaneseText.parse(j);

    expect(actual.isHintable()).to.be.false;
    expect(actual.isHintable(2)).to.be.true;
  });
  it("hiragana only", function () {
    const j = { japanese: "かかる" };
    const actual = JapaneseText.parse(j);

    /*const {container} =*/
    render(actual.getHint(kanaHintBuilder, undefined, 3, 1));

    expect(actual.isHintable(), "isHintable").to.be.true;
    // expect(container.querySelector('.hint').innerHTML, "getHint")
    // .to.equal('<span class="hint-mora">か</span>'+'<span class="transparent-color">かる</span>');
    expect(screen.queryByText('か').className).to.equal("hint-mora")
    expect(screen.queryByText('かる').className).to.equal("transparent-color")
  });
  it("katakana only", function () {
    const j = { japanese: "アパート" };
    const actual = JapaneseText.parse(j);

    /*const {container} =*/
    render(actual.getHint(kanaHintBuilder, undefined, 3, 1));

    expect(actual.isHintable(), "isHintable").to.be.true;
    // expect(container.querySelector('.hint').innerHTML, "getHint")
    // .to.equal('<span class="hint-mora">ア</span>'+'<span class="transparent-color">パート</span>');
    expect(screen.queryByText('ア').className).to.equal("hint-mora")
    expect(screen.queryByText('パート').className).to.equal("transparent-color")
  });
  it("starting kanji with furigana", function () {
    const j = { japanese: "あさごはん\n朝ご飯" };
    const actual = JapaneseText.parse(j);

    render(actual.getHint(undefined, furiganaHintBuilder, 3, 1));

    expect(actual.isHintable(), "isHintable").to.be.true;

    expect(screen.getByText("朝").tagName).equal("SPAN");
    expect(screen.getByText("あ").tagName).equal("SPAN");
    expect(screen.getByText("さ").className).equal("transparent-color");
    expect(screen.getByText("ご").className).equal("transparent-color");
    expect(screen.getByText("飯").className).equal("transparent-color");
    expect(screen.getByText("はん").className).equal("transparent-color");
  });
});
