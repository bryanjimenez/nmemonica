import { expect } from "chai";
import { daysSince, squashSeqMsgs } from "../../../src/helper/consoleHelper";

describe("consoleHelper", function () {
  describe("squashSeqMsgs", function () {
    describe("can't squash", function () {
      it("just one", function () {
        const msgs = [{ msg: "one", lvl: 1 }];
        const actual = squashSeqMsgs(msgs);
        expect(actual).to.deep.eq([{ msg: "one", lvl: 1 }]);
      });

      it("different", function () {
        const msgs = [
          { msg: "one", lvl: 1 },
          { msg: "two 2 +", lvl: 1 },
        ];
        const actual = squashSeqMsgs(msgs);
        expect(actual).to.deep.eq([
          { msg: "one", lvl: 1 },
          { msg: "two 2 +", lvl: 1 },
        ]);
      });
    });

    describe("can squash", function () {
      it("same", function () {
        const msgs = [
          { msg: "two 2 +", lvl: 1 },
          { msg: "two", lvl: 1 },
        ];
        const actual = squashSeqMsgs(msgs);
        expect(actual).to.deep.eq([{ msg: "two 3 +", lvl: 1 }]);
      });
    });
  });

  describe("daysSince", function () {
    it("0 days", function () {
      const today = new Date().toJSON();
      const actual = daysSince(today);
      expect(actual).to.equal(0);
    });

    it("1 day", function () {
      const today = new Date();
      const yesterday = new Date(today.setDate(today.getDate() - 1)).toJSON();
      // const yesterday = new Date((today - (1000 * 60 * 60 * 24))).toJSON();

      const actual = daysSince(yesterday);
      expect(actual).to.equal(1);
    });
  });
});
