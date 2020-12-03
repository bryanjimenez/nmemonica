import { expect } from "chai";
import { configure, shallow, render } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import {
  furiganaParse,
  buildHTMLElement,
  isHiragana,
} from "../../src/helper/parser";

configure({ adapter: new Adapter() });

describe("Helper tests", function () {
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
    it.skip("non matching input should throw", function () {});
    it.skip("starting kanji ending hiragana", function () {});
    it.skip("starting hiragana ending kanji", function () {});
    it.skip("starting and ending with kanji", function () {});
    it("starting and ending with hiragana", function () {
      const expectedKanjis = ["会計", "願"];
      const expectedFuriganas = ["かいけい", "ねが"];
      const expectedNonKanjis = ["お", "をお", "いします。"];
      const expectedStartsWHiragana = true;

      const phrase =
        "おかいけいをおねがいします。" + "\n" + "お会計をお願いします。";
      const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
        phrase
      );

      expect(kanjis).to.deep.eq(expectedKanjis);
      expect(furiganas).to.deep.eq(expectedFuriganas);
      expect(nonKanjis).to.deep.eq(expectedNonKanjis);
      expect(startsWHiragana).to.deep.eq(expectedStartsWHiragana);
    });
  });

  describe("isHiragana", function () {
    it("a Hiragana character", function () {
      const actual = isHiragana("っ");
      expect(actual).to.be.true;
    });
    it("a Kanji character", function () {
      const actual = isHiragana("雨");
      expect(actual).to.be.false;
    });
  });
});
