import { expect } from "chai";
import { updateEditedUID } from "../../../src/helper/sheetHelper";

describe("src/helper/sheetHelper", function () {
  describe("updateEditedUID", function () {
    describe("single english match", function () {
      it("single uid change from Japanese change", function () {
        const meta = { old_uid: { lastView: "2020-01-01T01:01:01.001Z" } };
        const oldList = [
          { uid: "old_uid", japanese: "テスト0", english: "test0" },
        ];

        const newList = [
          { uid: "new_uid", japanese: "テスト1", english: "test0" },
        ];

        const { updatedMeta: actual } = updateEditedUID(meta, oldList, newList);
        expect(actual).to.deep.eq({
          new_uid: { lastView: "2020-01-01T01:01:01.001Z" },
        });
      });
    });
    describe("multiple english match", function () {
      it("single uid change from Japanese change", function () {
        const meta = {
          old_uid: { lastView: "2020-01-01T01:01:01.001Z" },
          unrelated_uid: { lastView: "2020-01-01T01:01:01.002Z" },
        };
        const oldList = [
          { uid: "unrelated_uid", japanese: "????", english: "test0" },
          { uid: "old_uid", japanese: "テスト0", english: "test0" },
        ];
        const newList = [
          { uid: "unrelated_uid", japanese: "????", english: "test0" },
          { uid: "new_uid", japanese: "テスト1", english: "test0" },
        ];
        const { updatedMeta: actual } = updateEditedUID(meta, oldList, newList);
        expect(actual).to.deep.eq({
          new_uid: { lastView: "2020-01-01T01:01:01.001Z" },
          unrelated_uid: { lastView: "2020-01-01T01:01:01.002Z" },
        });
      });
    });
  });
});
