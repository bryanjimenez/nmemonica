import { expect } from "chai";
import { MetaDataObj } from "../../../src/typings/raw";
import { xAgoDate } from "./recallHelper.data";
import { getRecallCounts } from "../.././../src/helper/statsHelper";
import { SR_CORRECT_TRESHHOLD } from "../../../src/helper/recallHelper";

describe("statsHelper", function () {
  describe("getRecallStats", function () {
    const incorrect = SR_CORRECT_TRESHHOLD * 100 - 1;
    /* eslint-disable */
    const metadata:Record<string, MetaDataObj | undefined> = {
      'wrong': {lastView: xAgoDate(1), vC:1, accuracyP:incorrect, daysBetweenReviews: 1, lastReview: xAgoDate(10)},
  
      'overdue': {lastView: xAgoDate(1), vC:1, accuracyP:100, daysBetweenReviews: 1, lastReview: xAgoDate(10)},
      'overdue2': {lastView: xAgoDate(1), vC:1, accuracyP:100, daysBetweenReviews: 1, lastReview: xAgoDate(3)},
  
      'due': {lastView: xAgoDate(1), vC:1, accuracyP:100, daysBetweenReviews: 10, lastReview: xAgoDate(11)},
  
      'pending': {lastView: xAgoDate(1), vC:1, accuracyP:100, daysBetweenReviews: 10, lastReview: xAgoDate(9)},
  
      'unPlayed': undefined,
      'unPlayed2': {lastView: xAgoDate(1), vC:1},
    }
    /* eslint-enable */

    it("wrong", function () {
      const { wrong } = getRecallCounts(metadata);
      expect(wrong).to.equal(1);
    });

    it("overdue", function () {
      const { overdue } = getRecallCounts(metadata);
      expect(overdue).to.equal(2);
    });

    it("due", function () {
      const { due } = getRecallCounts(metadata);
      expect(due).to.equal(1);
    });

    it("pending", function () {
      const { pending } = getRecallCounts(metadata);
      expect(pending).to.equal(1);
    });

    it("unPlayed", function () {
      const { unPlayed } = getRecallCounts(metadata);
      expect(unPlayed).to.equal(2);
    });
  }); // getRecallStats
});
