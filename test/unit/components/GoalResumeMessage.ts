import "jsdom-global/register";
import { expect } from "chai";
import {
  partialGoal,
  partialProgress,
} from "../../../src/components/Form/GoalResumeMessage";

describe("GoalResumeMessage", function () {
  describe("partialGoal", function () {
    it("no goal", function () {
      const actual = partialGoal(0, undefined, 4);
      expect(actual).to.equal(1);
    });
  });
  describe("partialProgress", function () {
    it("no goal", function () {
      const actual = partialProgress(undefined, 4);
      expect(actual).to.equal(0);
    });
    it("goal", function () {
      const actual = partialProgress(10, 1);
      expect(actual).to.equal(9);
    });
    it("goal met", function () {
      const actual = partialProgress(10, 0);
      expect(actual).to.equal(10);
    });
    it("goal exceeded", function () {
      const actual = partialProgress(10, -4);
      expect(actual).to.equal(10);
    });
    it("goal exceeded", function () {
      const actual = partialProgress(10, undefined);
      expect(actual).to.equal(10);
    });
  });
});
