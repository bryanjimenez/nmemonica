import { expect } from "chai";
import {
  SR_CORRECT_TRESHHOLD,
  SR_REVIEW_DUE_PERCENT,
  SR_REVIEW_OVERDUE_PERCENT,
  getPercentOverdue,
  calculateDaysBetweenReviews,
  spaceRepetitionOrder,
} from "../../../src/helper/recallHelper";

function xAgoDate(days) {
  const t = new Date();
  const xAgoDate = new Date(t.setDate(t.getDate() - days)).toJSON();
  return xAgoDate;
}

describe("recallHelper", function () {
  describe("previously ungraded, then", function () {
    describe("correct", function () {
      it("getPercentOverdue == 1", function () {
        const accuracy = SR_CORRECT_TRESHHOLD;

        const calcPercentOverdue = getPercentOverdue({
          accuracy,
          daysSinceReview: undefined,
          daysBetweenReviews: undefined,
        });

        expect(calcPercentOverdue).to.equal(SR_REVIEW_DUE_PERCENT);
      });
    });
    describe("incorrect", function () {
      const difficulty = 0.7;
      const accuracy = SR_CORRECT_TRESHHOLD - 0.1;

      const calcPercentOverdue = getPercentOverdue({
        accuracy,
        daysSinceReview: undefined,
        daysBetweenReviews: undefined,
      });
      const calcDaysBetweenReviews = calculateDaysBetweenReviews({
        difficulty,
        accuracy,
        daysSinceReview: undefined,
        daysBetweenReviews: undefined,
      });

      it("getPercentOverdue == 1", function () {
        expect(calcPercentOverdue).to.equal(SR_REVIEW_DUE_PERCENT);
      });
      it("daysBetweenReviews <= 1", function () {
        expect(calcDaysBetweenReviews).to.be.lessThanOrEqual(1);
      });
    });
  });
  describe("previously graded, then", function () {
    describe("correct", function () {
      const xDaysAgo = 2;

      const difficulty = 0.7;
      const accuracy = SR_CORRECT_TRESHHOLD;
      const daysSinceReview = xDaysAgo;
      const daysBetweenReviews = 2;

      let actuals = [
        {
          days: daysSinceReview,
          betweenRev: daysBetweenReviews,
          overduePerC: NaN,
        },
      ];

      for (let i = 1; i < 5; ++i) {
        const overduePerC = getPercentOverdue({
          accuracy,
          daysSinceReview: actuals[i - 1].days,
          daysBetweenReviews: actuals[i - 1].betweenRev,
        });
        const betweenRev = calculateDaysBetweenReviews({
          difficulty,
          accuracy,
          daysSinceReview: actuals[i - 1].days,
          daysBetweenReviews: actuals[i - 1].betweenRev,
        });

        const nextRev = actuals[i - 1].days + Math.trunc(betweenRev);

        actuals = [
          ...actuals,
          {
            days: nextRev,
            betweenRev,
            overduePerC,
          },
        ];
      }

      // console.table(actuals);

      it("overduePercent starts with NaN", function () {
        expect(actuals[0].overduePerC).is.NaN; // seed value
      });
      it("overduePercent reaches due value", function () {
        expect(actuals[1].overduePerC).to.equal(SR_REVIEW_DUE_PERCENT);
      });
      it("overduePercent ends with overdue overdue", function () {
        expect(actuals[4].overduePerC).to.equal(SR_REVIEW_OVERDUE_PERCENT);
      });
    });
    describe("incorrect", function () {
      const xDaysAgo = 4;

      const difficulty = 0.7;
      const accuracy = SR_CORRECT_TRESHHOLD - 0.1;
      const daysSinceReview = xDaysAgo;
      const daysBetweenReviews = 4;

      const calcPercentOverdue = getPercentOverdue({
        accuracy,
        daysSinceReview,
        daysBetweenReviews,
      });

      const calcDaysBetweenReviews = calculateDaysBetweenReviews({
        difficulty,
        accuracy,
        daysSinceReview,
        daysBetweenReviews,
      });

      it("getPercentOverdue == 1", function () {
        expect(calcPercentOverdue).to.equal(SR_REVIEW_DUE_PERCENT);
      });
      it("daysBetweenReviews <= 1", function () {
        expect(calcDaysBetweenReviews).to.be.lessThanOrEqual(1);
      });
    });
  });

  describe("previously incorrect, then", function () {
    describe("correct", function () {
      /**
       *  When previously incorrect then correct
       *  daysBetween should not be below 1
       *  to avoid a no increment scenario
       */
      const xDaysAgo = 4;

      const difficulty = 0.7;
      const accuracy = SR_CORRECT_TRESHHOLD;
      const daysSinceReview = xDaysAgo;
      const daysBetweenReviews = 0.5; // previously wrong

      const calcDaysBetweenReviews = calculateDaysBetweenReviews({
        difficulty,
        accuracy,
        daysSinceReview,
        daysBetweenReviews,
      });

      it("daysBetweenReview >= 1", function () {
        expect(calcDaysBetweenReviews).to.be.greaterThanOrEqual(1);
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
      [terms[0].uid]: { vC: 1, lastView: today },
      [terms[1].uid]: { vC: 1, lastView: today },
      // pending review
      [terms[2].uid]: {
        vC: 2,
        lastView: today,
        lastReview: xAgoDated,
        difficulty: 90,
        accuracy: 67,
        daysBetweenReviews: 1,
        consecutiveRight: 1,
      },
      [terms[3].uid]: {
        vC: 2,
        lastView: xAgoDated,
        lastReview: xAgoDated,
        difficulty: 90,
        accuracy: 71,
        daysBetweenReviews: 1,
        consecutiveRight: 1,
      },
      [terms[4].uid]: {
        vC: 2,
        lastView: xAgoDated,
        lastReview: xAgoDated,
        difficulty: 20,
        accuracy: 31,
        daysBetweenReviews: 0.39691804809712816,
        consecutiveRight: 0,
      },
      [terms[5].uid]: {
        vC: 2,
        lastView: yesterday,
        lastReview: xAgoDated,
        difficulty: 30,
        accuracy: 23,
        daysBetweenReviews: 0.3393890996206828,
        consecutiveRight: 0,
      },
      [terms[6].uid]: {
        vC: 2,
        lastView: yesterday,
        lastReview: xAgoDated,
        difficulty: 90,
        accuracy: 73,
        daysBetweenReviews: 1,
        consecutiveRight: 1,
      },
      [terms[7].uid]: {
        vC: 2,
        lastView: xAgoDated,
        lastReview: xAgoDated,
        difficulty: 90,
        accuracy: 75,
        daysBetweenReviews: 0.25,
        consecutiveRight: 0,
      },
      // previously incorrect
      [terms[8].uid]: {
        vC: 2,
        lastView: xAgoDated,
        lastReview: xAgoDated,
        difficulty: 90,
        accuracy: 17,
        daysBetweenReviews: 0.25,
        consecutiveRight: 0,
      },
      [terms[9].uid]: {
        vC: 2,
        lastView: xAgoDated,
        lastReview: xAgoDated,
        difficulty: 90,
        accuracy: 19,
        daysBetweenReviews: 1,
        consecutiveRight: 1,
      },
    };

    const maxReviews = 20;
    describe("return params", function(){
      it("incorrect", function () {
        const expected = [4, 5, 8, 9];
  
        const { failed } = spaceRepetitionOrder(terms, metaRecord, maxReviews);
        expect(failed)
          .to.have.length(expected.length)
          .and.to.contain.members(expected);
      });
      it("pending", function () {
        const expected = [3, 7, 6];
        const {
          failed,
          overdue: pending,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, maxReviews);
  
        expect(pending, "Categorized as overdue")
          .to.have.length(expected.length)
          .and.to.contain.members(expected);
        expect(pending, "Descending percentage overdue order").to.deep.equal(
          expected
        );
        // pending, but not played because date = today
        expect(notPlayed).to.contain.members([2]);
      });
      it("not played", function () {
        const {
          failed,
          overdue: pending,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, maxReviews);
  
        // pending, but not played because date = today
        expect(notPlayed).to.contain.members([2]);
        // no lastReview value
        expect(notPlayed).to.contain.members([0, 1]);
      });
      it("max limit", function () {
        const maxReviews = 2;
  
        const {
          failed,
          overdue: pending,
          overLimit,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, maxReviews);
  
        expect([...failed, ...pending], "limited")
          .to.have.length(maxReviews)
          .and.be.an("Array");
        expect([...overLimit, ...notPlayed, ...todayDone], "remainder")
          .to.have.length(terms.length - maxReviews)
          .and.be.an("Array");
      });  
    })
    describe("date view exclusion", function () {
      // metadata.lastView: last viewed
      // metadata.lastReview: last reviewed

      const terms = [{ uid: "0023e81f458ea75aaa9a89031105bf63" }];

      it("exclude viewed today", function () {
        const today = new Date().toJSON();
        const yesterday = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();

        const metaRecord = {
          // pending review
          [terms[0].uid]: {
            vC: 2,
            lastView: today,
            lastReview: xAgoDate,
            difficulty: 90,
            accuracy: 67,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
        };

        const {
          failed,
          overdue: pending,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, maxReviews);

        // pending, but not played because date = today
        expect([...failed, ...pending]).to.not.contain.members([0]);
        expect(notPlayed).to.contain.members([0]);
      });
      it("include viewed yesterday", function () {
        const today = new Date().toJSON();
        const yesterday = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();

        const metaRecord = {
          // pending review
          [terms[0].uid]: {
            vC: 2,
            lastView: xAgoDate,
            lastReview: xAgoDate,
            difficulty: 90,
            accuracy: 67,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
        };

        const {
          failed,
          overdue: pending,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, 10);

        expect(notPlayed).to.not.contain.members([0]);
      });
    });
    describe("date review inclusion", function () {
      it("include reviewed today", function () {
        const today = new Date().toJSON();
        const yesterday = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();

        const metaRecord = {
          // lastReview today
          [terms[0].uid]: {
            vC: 2,
            lastView: today,
            lastReview: today,
            difficulty: 90,
            accuracy: 67,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
        };

        const {
          failed,
          overdue: pending,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, maxReviews);

        // pending, but not played because date = today
        expect([...failed, ...pending]).to.not.contain.members([0]);
        expect(notPlayed).to.not.contain.members([0]);
        expect(todayDone).to.contain.members([0]);
      });
    });
    describe("overdue sorted by lastView", function () {
      const metaRecord = {
        // not yet played
        [terms[0].uid]: { vC: 1, lastView: today },
        [terms[1].uid]: { vC: 1, lastView: today },
        // overdue
        [terms[2].uid]: {
          vC: 2,
          lastView: xAgoDate(100),
          lastReview: xAgoDate(2),
          difficulty: 90,
          accuracy: 100,
          daysBetweenReviews: 1,
          consecutiveRight: 1,
        },
        [terms[3].uid]: {
          vC: 2,
          lastView: xAgoDate(5),
          lastReview: xAgoDate(3),
          difficulty: 90,
          accuracy: 71,
          daysBetweenReviews: 1,
          consecutiveRight: 1,
        },
        [terms[4].uid]: {
          vC: 2,
          lastView: xAgoDate(4),
          lastReview: xAgoDate(4),
          difficulty: 20,
          accuracy: 100,
          daysBetweenReviews: 0.39691804809712816,
          consecutiveRight: 0,
        },
        [terms[5].uid]: {
          vC: 2,
          lastView: xAgoDate(3),
          lastReview: xAgoDate(5),
          difficulty: 30,
          accuracy: 100,
          daysBetweenReviews: 0.3393890996206828,
          consecutiveRight: 0,
        },
        [terms[6].uid]: {
          vC: 2,
          lastView: xAgoDate(2),
          lastReview: xAgoDate(100),
          difficulty: 90,
          accuracy: 100,
          daysBetweenReviews: 1,
          consecutiveRight: 1,
        },
        // previously incorrect
        [terms[7].uid]: {
          vC: 2,
          lastView: xAgoDated,
          lastReview: xAgoDated,
          difficulty: 90,
          accuracy: 13,
          daysBetweenReviews: 0.25,
          consecutiveRight: 0,
        },
        [terms[8].uid]: {
          vC: 2,
          lastView: xAgoDated,
          lastReview: xAgoDated,
          difficulty: 90,
          accuracy: 17,
          daysBetweenReviews: 0.25,
          consecutiveRight: 0,
        },
        [terms[9].uid]: {
          vC: 2,
          lastView: xAgoDated,
          lastReview: xAgoDated,
          difficulty: 90,
          accuracy: 57,
          daysBetweenReviews: 1,
          consecutiveRight: 1,
        },
      };
      it("oldest first", function () {
        const expected = [2, 3, 4, 5, 6];
        const {
          failed,
          overdue: pending,
          notPlayed,
          todayDone,
        } = spaceRepetitionOrder(terms, metaRecord, maxReviews);

        expect(pending, "lastView oldest first").to.deep.equal(expected);
      });
    });
  });
});
