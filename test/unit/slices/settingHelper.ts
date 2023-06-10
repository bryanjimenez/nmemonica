import { expect } from "chai";
import {
  DebugLevel,
  grpParse,
  toggleAFilter,
} from "../../../src/slices/settingHelper";

describe("settingHelper", function () {
  describe("toggleAFilter", function () {
    it("override", function () {
      Object.values(DebugLevel);
      const start = DebugLevel.OFF;
      const actual = toggleAFilter(
        start + 1,
        Object.values(DebugLevel),
        DebugLevel.DEBUG
      );
      expect(actual).to.eq(DebugLevel.DEBUG);
    });

    it("increment", function () {
      Object.values(DebugLevel);
      const start = DebugLevel.OFF;
      const actual = toggleAFilter(start + 1, Object.values(DebugLevel));
      expect(actual).to.eq(DebugLevel.ERROR);
    });

    it("skips", function () {
      const start = DebugLevel.OFF;
      const actual = toggleAFilter(
        start + 1,
        Object.values(DebugLevel).filter((d) => DebugLevel.ERROR !== d)
      );
      expect(actual).to.eq(DebugLevel.WARN);
    });

    it("restarts", function () {
      const start = DebugLevel.DEBUG;
      const actual = toggleAFilter(start + 1, Object.values(DebugLevel));
      expect(actual).to.eq(DebugLevel.OFF);
    });
  }); // toggleAFilter
  describe("grpParse", function () {
    it("adds a group", function () {
      const actual = grpParse(["groupC"], ["groupA", "groupB"]);
      expect(actual).to.deep.eq(["groupA", "groupB", "groupC"]);
    });
    it("adds multiple groups", function () {
      const actual = grpParse(["groupC", "groupD"], ["groupA", "groupB"]);
      expect(actual).to.deep.eq(["groupA", "groupB", "groupC", "groupD"]);
    });
    it("removes a group", function () {
      const actual = grpParse(["groupB"], ["groupA", "groupB"]);
      expect(actual).to.deep.eq(["groupA"]);
    });
    it("removes multiple groups", function () {
      const actual = grpParse(["groupA", "groupB"], ["groupA", "groupB"]);
      expect(actual).to.deep.eq([]);
    });

    it("adds and removes multiple groups", function () {
      const actual = grpParse(
        ["groupB", "groupD", "groupE", "groupF"],
        ["groupF", "groupA", "groupB"]
      );
      expect(actual).to.deep.eq(["groupA", "groupD", "groupE"]);
    });

    it("add subgroup", function () {
      const actual = grpParse(["groupB.sub"], ["groupF", "groupA"]);
      expect(actual).to.deep.eq(["groupF", "groupA", "groupB.sub"]);
    });

    it("add sibling subgroup", function () {
      const actual = grpParse(
        ["groupB.sub2"],
        ["groupF", "groupA", "groupB.sub"]
      );
      expect(actual).to.deep.eq([
        "groupF",
        "groupA",
        "groupB.sub",
        "groupB.sub2",
      ]);
    });

    it("remove subgroup", function () {
      const actual = grpParse(
        ["groupB.sub"],
        ["groupF", "groupA", "groupB.sub"]
      );
      expect(actual).to.deep.eq(["groupF", "groupA"]);
    });

    it("add parent group remove subgroup", function () {
      const actual = grpParse(["groupB"], ["groupF", "groupA", "groupB.sub"]);
      expect(actual).to.deep.eq(["groupF", "groupA", "groupB"]);
    });

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
        const grpName = ["Greetings", "Greetings"];
        const activeGroup = ["Restaurant", "Questions.What", "Questions.Who"];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain(grpName[0]);
      });
      it("remove once", function () {
        const grpName = ["Greetings", "Greetings"];
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
        const activeGroup = [
          "Restaurant",
          "Questions.What",
          "Questions.What",
          "Questions.Who",
          "Questions.Who",
        ];
        const expectedActiveGroup = [
          "Greetings",
          "Restaurant",
          "Questions.What",
          "Questions.What",
          "Questions.Who",
        ];

        const actual = grpParse(grpName, activeGroup);

        expect(actual).to.contain.members(expectedActiveGroup);
      });
    });
  });
});
