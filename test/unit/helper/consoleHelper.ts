import { expect } from "chai";
import { squashSeqMsgs } from "../../../src/helper/consoleHelper";

describe("consoleHelper", function () {
  describe("squashSeqMsgs", function () {
    describe("can't squash", function () {
      it("just one", function () {
        const msgs = [{ msg: "one" }];
        const actual = squashSeqMsgs(msgs);
        expect(actual).to.deep.eq([{ msg: "one" }]);
      });

      it("different", function () {
        const msgs = [{ msg: "one" }, { msg: "two 2 +" }];
        const actual = squashSeqMsgs(msgs);
        expect(actual).to.deep.eq([{ msg: "one" }, { msg: "two 2 +" }]);
      });
    });

    describe("can squash", function () {
      it("same", function () {
        const msgs = [{ msg: "two 2 +" }, { msg: "two" }];
        const actual = squashSeqMsgs(msgs);
        expect(actual).to.deep.eq([{ msg: "two 3 +" }]);
      });
    });
  });
});
