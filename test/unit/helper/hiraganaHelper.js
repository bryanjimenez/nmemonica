import { expect } from "chai";
import { configure, shallow } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { isHiragana } from "../../../src/helper/hiraganaHelper";

configure({ adapter: new Adapter() });

describe("hiraganaHelper", function () {
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
