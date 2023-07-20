import { expect } from "chai";
import {
  SR_CORRECT_TRESHHOLD,
  gradeSpaceRepetition,
  spaceRepetitionOrder,
} from "../../../src/helper/recallHelper";

function xAgoDate(days){
  const t = new Date();
  const xAgoDate = new Date(t.setDate(t.getDate() - days)).toJSON();
  return xAgoDate;
}

describe("recallHelper", function () {
  describe("gradeSpaceRepetition", function () {
    describe("previously ungraded", function () {
      it("correct", function () {
        const difficulty = 0.7;
        const accuracy = SR_CORRECT_TRESHHOLD;

        const { calcDaysBetweenReviews, calcPercentOverdue } = gradeSpaceRepetition({
          difficulty,
          accuracy,
          daysSinceReview: undefined,
          daysBetweenReviews: undefined,
        });

        expect(calcPercentOverdue).to.equal(2);
      });
      it("incorrect", function () {
        const difficulty = 0.7;
        const accuracy = SR_CORRECT_TRESHHOLD - 0.1;

        const { calcDaysBetweenReviews, calcPercentOverdue } = gradeSpaceRepetition({
          difficulty,
          accuracy,
          daysSinceReview: undefined,
          daysBetweenReviews: undefined,
        });

        expect(calcPercentOverdue).to.equal(1);
      });
    });
    describe("previously graded", function () {
      it("correct", function () {
        const xDaysAgo = 2;

        const difficulty = 0.7;
        const accuracy = SR_CORRECT_TRESHHOLD;
        const daysSinceReview = xDaysAgo;
        const daysBetweenReviews = 2;

        const { calcDaysBetweenReviews, calcPercentOverdue } = gradeSpaceRepetition({
          difficulty,
          accuracy,
          daysSinceReview,
          daysBetweenReviews,
        });

        expect(calcPercentOverdue).to.equal(1);
      });

      it("incorrect", function () {
        const xDaysAgo = 3;

        const difficulty = 0.7;
        const accuracy = SR_CORRECT_TRESHHOLD - 0.1;
        const daysSinceReview = xDaysAgo;
        const daysBetweenReviews = 2;

        const { calcDaysBetweenReviews, calcPercentOverdue } = gradeSpaceRepetition({
          difficulty,
          accuracy,
          daysSinceReview,
          daysBetweenReviews,
        });

        expect(calcPercentOverdue).to.equal(1);
      });
    });
  });

  describe("spaceRepetitionOrder", function () {
    const today = xAgoDate(0);
    const yesterday = xAgoDate(1);
    const xAgoDated = xAgoDate(2);

    const terms = [
      { uid: "0012bc7dc3968737a80c83248f63d3b1" },
      { uid: "00e6781c76052848bdaa6b1b0496ff8e" },
      { uid: "0023e81f458ea75aaa9a89031105bf63" },
      { uid: "003e992bdd7aae7c15c646a444fae08d" },
      { uid: "00b29c945e41cc7e9284873f94e3a14d" },
      { uid: "00b32d657e191efb3866ebf080dc3c2a" },
      { uid: "00c102a7e10b45b19afbab71c030bf63" },
      { uid: "02fd75474e4cc84574b1ad8b3211edbb" },
      { uid: "0332d7f79143b03a4b9497100beafb92" },
      { uid: "036265f163ca6f25f5a611a33ac3d98f" },
    ];

    const metaRecord = {
      // not yet played
      [terms[0].uid]: { vC: 1, d: today },
      [terms[1].uid]: { vC: 1, d: today },
      // pending review
      [terms[2].uid]: { percentOverdue: 2, vC: 2, d: today, lastReview: xAgoDated, difficulty: 90, accuracy: 67, daysBetweenReviews: 1, consecutiveRight: 1,},
      [terms[3].uid]: { percentOverdue: 1.4, vC: 2, d: xAgoDated, lastReview: xAgoDated, difficulty: 90, accuracy: 71, daysBetweenReviews: 1, consecutiveRight: 1,},
      [terms[4].uid]: { percentOverdue: 1.3, vC: 2, d: xAgoDated, lastReview: xAgoDated, difficulty: 20, accuracy: 31, daysBetweenReviews: 0.39691804809712816, consecutiveRight: 0,},
      [terms[5].uid]: { percentOverdue: 1.2, vC: 2, d: yesterday, lastReview: xAgoDated, difficulty: 30, accuracy: 23, daysBetweenReviews: 0.3393890996206828, consecutiveRight: 0,},
      [terms[6].uid]: { percentOverdue: 1.1, vC: 2, d: yesterday, lastReview: xAgoDated, difficulty: 90, accuracy: 73, daysBetweenReviews: 1, consecutiveRight: 1,},
      // previously incorrect
      [terms[7].uid]: { percentOverdue: 1, vC: 2, d: xAgoDated, lastReview: xAgoDated, difficulty: 90, accuracy: 13, daysBetweenReviews: 0.25, consecutiveRight: 0,},
      [terms[8].uid]: { percentOverdue: 1, vC: 2, d: xAgoDated, lastReview: xAgoDated, difficulty: 90, accuracy: 17, daysBetweenReviews: 0.25, consecutiveRight: 0,},
      [terms[9].uid]: { percentOverdue: 1, vC: 2, d: xAgoDated, lastReview: xAgoDated, difficulty: 90, accuracy: 75, daysBetweenReviews: 1, consecutiveRight: 1,},
    };

    const spaRepMaxReviewItem = 20;

    it("incorrect", function () {
      const {failed} = spaceRepetitionOrder(
        terms,
        metaRecord,
        spaRepMaxReviewItem
      );

      expect(failed).to.contain.members([7, 8, 9]);
    });
    it("pending", function () {
      const {failed, overdue: pending, notPlayed, todayDone} = spaceRepetitionOrder(
        terms,
        metaRecord,
        spaRepMaxReviewItem
      );

      expect(pending).to.contain.members([3, 4, 5, 6]);
      // pending, but not played because date = today
      expect(notPlayed).to.contain.members([2]);
    });
    it("not played", function () {
      const {failed, overdue: pending, notPlayed, todayDone} = spaceRepetitionOrder(
        terms,
        metaRecord,
        spaRepMaxReviewItem
      );

      // pending, but not played because date = today
      expect(notPlayed).to.contain.members([2]);
      // no percentOverdue value
      expect(notPlayed).to.contain.members([0, 1]);
    });
    it("max", function () {
      const spaRepMaxReviewItem = 2;

      const {failed, overdue: pending, notPlayed, todayDone} = spaceRepetitionOrder(
        terms,
        metaRecord,
        spaRepMaxReviewItem
      );

      expect([...failed, ...pending]).to.have.length(spaRepMaxReviewItem).and.be.an("Array");
      expect(notPlayed)
        .to.have.length(terms.length - spaRepMaxReviewItem)
        .and.be.an("Array");
    });

    describe("date view exclusion", function(){
      // metadata.d: last viewed
      // metadata.lastReview: last reviewed

      const terms = [
        { uid: "0023e81f458ea75aaa9a89031105bf63" },
      ];

      it("yesterday included", function () {
        const today = new Date().toJSON();
        const yesterday = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();
        
        const metaRecord = {
          // pending review
          [terms[0].uid]: { percentOverdue: 2, vC: 2, d: xAgoDate, lastReview: xAgoDate, difficulty: 90, accuracy: 67, daysBetweenReviews: 1, consecutiveRight: 1,},
        }

        const {failed, overdue: pending, notPlayed, todayDone} = spaceRepetitionOrder(
          terms,
          metaRecord,
          10
        );
  
        expect(notPlayed).to.not.contain.members([0]);
      });
      it("today excluded", function () {
        const today = new Date().toJSON();
        const yesterday = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();
        
        const metaRecord = {
          // pending review
          [terms[0].uid]: { percentOverdue: 2, vC: 2, d: today, lastReview: xAgoDate, difficulty: 90, accuracy: 67, daysBetweenReviews: 1, consecutiveRight: 1,},
        }

        const {failed, overdue: pending, notPlayed, todayDone} = spaceRepetitionOrder(
          terms,
          metaRecord,
          spaRepMaxReviewItem
        );

        // pending, but not played because date = today
        expect([...failed, ...pending]).to.not.contain.members([0]);
        expect(notPlayed).to.contain.members([0]);
      });
    })
    describe("today review",function(){
      it("inclusion",function(){
        const today = new Date().toJSON();
        const yesterday = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();
        
        const metaRecord = {
          // lastReview today
          [terms[0].uid]: { percentOverdue: 2, vC: 2, d: today, lastReview: today, difficulty: 90, accuracy: 67, daysBetweenReviews: 1, consecutiveRight: 1,},
        }

        const {failed, overdue: pending, notPlayed, todayDone} = spaceRepetitionOrder(
          terms,
          metaRecord,
          spaRepMaxReviewItem
        );

        // pending, but not played because date = today
        expect([...failed, ...pending]).to.not.contain.members([0]);
        expect(notPlayed).to.not.contain.members([0]);
        expect(todayDone).to.contain.members([0]);
      })
    })
  });
});
