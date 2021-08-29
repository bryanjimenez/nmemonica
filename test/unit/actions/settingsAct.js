import { expect } from "chai";
import { grpParse } from "../../../src/actions/settingsAct";

describe("settingsAct", function () {
  describe("grpParse", function () {
    describe("group", function () {
      it("add", function () {
        const grpName = "Greetings";
        const activeGroup = ["Restaurant", "Questions.What", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain(grpName);
      });
      it("remove", function () {
        const grpName = "Greetings";
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
        const grpName = "Questions";
        const activeGroup = [
          "Restaurant",
          "Greetings",
          "Questions.What",
          "Questions.Who",
        ];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain(grpName);
        expect(actual).to.not.contain.oneOf([
          "Questions.What",
          "Questions.Who",
        ]);
      });

      it("remove child", function () {
        const grpName = "Questions.Who";
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
        const grpName = "Questions.Who";
        const activeGroup = ["Restaurant", "Greetings", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.not.contain(grpName);
        expect(actual).to.not.contain("Questions");
      });
    });
  });
});
