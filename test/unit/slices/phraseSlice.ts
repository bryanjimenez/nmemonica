import { expect } from "chai";
import { isPolitePhrase } from "../../../src/slices/phraseSlice";

describe("phraseSlice", function () {
  describe("isPolitePhrase", function () {
    describe("edited (removed)", function () {
      it("one period", function () {
        const expected =
          "いってあげることがどうやってほしいですか。\n言ってあげることがどうやって欲しいですか。";
        const p = {
          english: "How do you want me to say it?",
          japanese: expected,
          romaji: "itte ageru koto ga dō yatte hoshīdesu ka",
          tag: "give/get",
        };
        const actual = isPolitePhrase(p);

        expect(actual.polite).to.be.true;
        expect(actual.japanese).to.not.contain("。");
      });
    });
    describe("unedited (ignored)", function () {
      it("multiple periods", function () {
        const expected =
          "ゲームをしてまけた。あとともだちがなぐさめてくれた。\nゲームをして負けた。あと友達が慰めてくれた。";
        const p = {
          english:
            "I played a game and lost. And (after) a friend comforted me.",
          japanese: expected,
          grp: "Listing",
          lesson: "Emphasis on forgeting/remembering\nSentence. あと sentence.",
          romaji: "Gēmu o shite maketa. Ato tomodachi ga nagusamete kureta.",
          subGrp: "Hesitant and",
          tag: "give-get",
        };
        const actual = isPolitePhrase(p);

        expect(actual.polite).to.be.true;
        // this is not enough
        expect(actual.japanese).to.be.undefined;
        // this is
        expect(actual.hasOwnProperty('japanese')).to.be.false;
      });
      it("period and comma", function () {
        const expected =
          "しんじがたいことだけど、ほんとうです。\n信じ難いことだけど、本当です。";
        const p = {
          english: "It's unbelivable, but true.",
          japanese: expected,
          romaji: "shinji gatai koto da kedo, hontō desu",
        };
        const actual = isPolitePhrase(p);

        expect(actual.polite).to.be.true;
        // this is not enough
        expect(actual.japanese).to.be.undefined;
        // this is
        expect(actual.hasOwnProperty('japanese')).to.be.false;
      });
    });
  });
});
