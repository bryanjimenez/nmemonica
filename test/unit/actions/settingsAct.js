import { expect } from "chai";
import { grpParse } from "../../../src/actions/settingsAct";

describe("settingsAct", function () {
  describe("grpParse", function () {
    describe("group", function () {
      it("add", function () {
        const grpName = ["Greetings"];
        const activeGroup = ["Restaurant", "Questions.What", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain.members(grpName);
      });
      it("remove", function () {
        const grpName = ["Greetings"];
        const activeGroup = [
          "Restaurant",
          "Greetings",
          "Questions.What",
          "Questions.Who",
        ];
        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.not.contain(grpName);
      });
    });
    describe("sub group", function () {
      it("add parent", function () {
        const grpName = ["Questions"];
        const activeGroup = [
          "Restaurant",
          "Greetings",
          "Questions.What",
          "Questions.Who",
        ];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain.members(grpName);
        expect(actual).to.not.contain.oneOf([
          "Questions.What",
          "Questions.Who",
        ]);
      });

      it("remove child", function () {
        const grpName = ["Questions.Who"];
        const activeGroup = [
          "Restaurant",
          "Greetings",
          "Questions.What",
          "Questions.Who",
        ];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.not.contain(grpName);
      });

      it("remove last child", function () {
        const grpName = ["Questions.Who"];
        const activeGroup = ["Restaurant", "Greetings", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.not.contain(grpName);
        expect(actual).to.not.contain("Questions");
      });
    });
    describe("duplicates", function () {
      it("add once", function () {
        const grpName = ["Greetings","Greetings"];
        const activeGroup = ["Restaurant", "Questions.What", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain(grpName[0]);
      });
      it("remove once", function () {
        const grpName = ["Greetings","Greetings"];
        const activeGroup = [
          "Restaurant",
          "Greetings",
          "Questions.What",
          "Questions.Who",
        ];
        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.not.contain(grpName);
      });
      it("active group duplicate removal", function () {
        const grpName = ["Greetings"];
        const activeGroup = ["Restaurant", "Questions.What", "Questions.What", "Questions.Who", "Questions.Who"];
        const expectedActiveGroup = ["Greetings", "Restaurant", "Questions.What", "Questions.What", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain.members(expectedActiveGroup);
      });
    });
  });
});
