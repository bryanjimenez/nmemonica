import { expect } from "chai";
import { JapaneseText } from "../../src/helper/JapaneseText";

describe("JapanseText", function () {
  describe("toString", function () {
    it("hiragana", function () {
      const hiragana = "する";
      const phrase = "きたない\n汚い";

      const text = new JapaneseText(hiragana);

      expect("" + text).to.equal(hiragana);
    });

    it("hiragana and kanji", function () {
      const phrase = "きたない\n汚い";

      const text = new JapaneseText("きたない", "汚い");

      expect("" + text).to.equal(phrase);
    });
  });
});
