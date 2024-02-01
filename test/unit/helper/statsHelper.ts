import { expect } from "chai";
import { MetaDataObj } from "../../../src/typings/raw";
import { xAgoDate } from "./recallHelper.data";
import {
  getDifficultyCounts,
  getRecallCounts,
  getStalenessCounts,
  getStats,
} from "../.././../src/helper/statsHelper";
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
  describe("getStalenessCounts", function () {
    /* eslint-disable */
        const metadata:Record<string, MetaDataObj | undefined> = {
          'uid0': {lastView: xAgoDate(3), vC:1},
      
          'uid1': {lastView: xAgoDate(6), vC:1},
          'uid2': {lastView: xAgoDate(7), vC:1},
      
          'uid3': {lastView: xAgoDate(8), vC:1},
      
          'uid4': {lastView: xAgoDate(8), vC:1},
      
          'uid_unPlayed0': undefined,
          'uid_unPlayed1': {vC:1},

          'uid5': {lastView: xAgoDate(10), vC:1},
          'uid6': {lastView: xAgoDate(13), vC:1},
          'uid7': {lastView: xAgoDate(15), vC:1},
          'uid8': {lastView: xAgoDate(16), vC:1},
          'uid9': {lastView: xAgoDate(20), vC:1},
      
      
        }
        /* eslint-enable */

    it("unPlayed", function () {
      const { unPlayed, min, max, mean, q1, q3 } = getStalenessCounts(metadata);
      expect(unPlayed).to.equal(2);
    });
    it("min", function () {
      const { unPlayed, min, max, mean, q1, q3 } = getStalenessCounts(metadata);
      expect(min).to.equal(3);
    });
    it("q1", function () {
      const { unPlayed, min, max, mean, q1, q3 } = getStalenessCounts(metadata);
      expect(q1).to.equal(7);
    });
    it("q2", function () {
      const { unPlayed, min, max, mean, q1, q2, q3 } =
        getStalenessCounts(metadata);
      expect(q2).to.equal(9);
    });
    it("mean", function () {
      const { unPlayed, min, max, mean, q1, q3 } = getStalenessCounts(metadata);
      expect(mean).to.equal(10.6);
    });
    it("q3", function () {
      const { unPlayed, min, max, mean, q1, q3 } = getStalenessCounts(metadata);
      expect(q3).to.equal(15);
    });
    it("max", function () {
      const { unPlayed, min, max, mean, q1, q3 } = getStalenessCounts(metadata);
      expect(max).to.equal(20);
    });
  }); //getStalenessCounts
  describe("getStats", function () {
    const numbers = [3, 6, 7, 8, 8, 10, 13, 15, 16, 20];
    it("sorted", function () {
      const { min, max, mean, q1, q2, q3 } = getStats(numbers);

      expect(min, "Min").to.equal(3);
      expect(max, "Max").to.equal(20);
      expect(q1, "q1").to.equal(7);
      expect(q2, "q2").to.equal(9);
      expect(q3, "q3").to.equal(15);
      expect(mean, "Mean").to.equal(10.6);
    });

    it("unsorted", function () {
      const unsorted = [20, 8, 3, 6, 7, 8, 10, 13, 15, 16];

      const { min, max, mean, q1, q2, q3 } = getStats(unsorted);

      expect(min, "Min").to.equal(3);
      expect(max, "Max").to.equal(20);
      expect(q1, "q1").to.equal(7);
      expect(q2, "q2").to.equal(9);
      expect(q3, "q3").to.equal(15);
      expect(mean, "Mean").to.equal(10.6);
    });
  });
  describe("getDifficultyCounts", function () {
    /* eslint-disable */
    const metadata:Record<string, MetaDataObj | undefined> = {
      'uid0': {difficultyP: 100, lastView: xAgoDate(1), vC:1},
      'uid1': {difficultyP: 100, lastView: xAgoDate(1), vC:1},
      'uid2': {difficultyP: 100, lastView: xAgoDate(1), vC:1},
      'uid3': {difficultyP: 50, lastView: xAgoDate(1), vC:1},
      'uid4': {difficultyP: 50, lastView: xAgoDate(1), vC:1},
      'uid_unPlayed0': undefined,
      'uid_unPlayed1': {vC:1},
      'uid5': {difficultyP: 20, lastView: xAgoDate(1), vC:1},
      'uid6': {difficultyP: 20, lastView: xAgoDate(1), vC:1},
      'uid7': {difficultyP: 20, lastView: xAgoDate(1), vC:1},
    }
    /* eslint-enable */

    it("ranges", function () {
      const difficulty = getDifficultyCounts(metadata);

      expect(difficulty).to.be.an("Array").and.have.lengthOf(10);
      expect(difficulty[0], "0-10").to.equal(0);
      expect(difficulty[1], "11-20").to.equal(3);
      expect(difficulty[2], "21-30").to.equal(0);
      expect(difficulty[3], "31-40").to.equal(0);
      expect(difficulty[4], "41-50").to.equal(2);
      expect(difficulty[5], "51-60").to.equal(0);
      expect(difficulty[6], "61-70").to.equal(0);
      expect(difficulty[7], "71-80").to.equal(0);
      expect(difficulty[8], "81-90").to.equal(0);
      expect(difficulty[9], "91-100").to.equal(3);
    });
  });
});
