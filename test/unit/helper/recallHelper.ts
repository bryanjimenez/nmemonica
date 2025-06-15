import "jsdom-global/register";
import { expect } from "chai";
import {
  SR_CORRECT_TRESHHOLD,
  SR_REVIEW_DUE_PERCENT,
  SR_REVIEW_OVERDUE_PERCENT,
  getPercentOverdue,
  calculateDaysBetweenReviews,
  spaceRepetitionOrder,
  recallNotificationHelper,
} from "../../../src/helper/recallHelper";
import {
  xAgoDate,
  mockNotPlayed,
  mockPending,
  terms,
  mockNotPending,
} from "./recallHelper.data";

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
    const maxReviews = 20;
    describe("return params", function () {
      it("failed", function () {
        const metaRecord = {
          [terms[0].uid]: mockNotPlayed.one,
          [terms[1].uid]: mockNotPlayed.two,
          [terms[2].uid]: mockPending.pass.one,
          [terms[3].uid]: mockPending.pass.two,
          [terms[4].uid]: mockPending.fail.one,
          [terms[5].uid]: mockPending.fail.two,
          [terms[6].uid]: mockPending.pass.three,
          [terms[7].uid]: mockPending.pass.four,
          [terms[8].uid]: mockPending.fail.three,
          [terms[9].uid]: mockPending.fail.four,
        };

        const expected = [4, 5, 8, 9];

        const { failed } = spaceRepetitionOrder(terms, metaRecord, maxReviews);
        expect(failed)
          .to.have.length(expected.length)
          .and.to.contain.members(expected);
      });
      it("overDue", function () {
        const metaRecord = {
          [terms[0].uid]: mockNotPlayed.one,
          [terms[1].uid]: mockNotPlayed.two,
          [terms[2].uid]: mockPending.excluded.one,
          [terms[3].uid]: mockPending.pass.two,
          [terms[4].uid]: mockPending.fail.one,
          [terms[5].uid]: mockPending.fail.two,
          [terms[6].uid]: mockPending.pass.three,
          [terms[7].uid]: mockPending.pass.four,
          [terms[8].uid]: mockPending.fail.three,
          [terms[9].uid]: mockPending.fail.four,
        };

        const expected = [3, 7, 6];
        const { overdue, notPlayed } = spaceRepetitionOrder(
          terms,
          metaRecord,
          maxReviews
        );

        expect(overdue, "Categorized as overdue")
          .to.have.length(expected.length)
          .and.to.contain.members(expected);
        expect(overdue, "Descending percentage overdue order").to.deep.equal(
          expected
        );
        // pending, but not played because date = today
        expect(notPlayed).to.contain.members([2]);
      });
      it("notDue", function () {
        const expected = [3];

        const metaRecordEx = {
          // not yet played
          [terms[0].uid]: mockNotPlayed.one,
          [terms[1].uid]: mockNotPlayed.two,
          // pending review
          [terms[2].uid]: mockPending.pass.one,
          // not pending
          [terms[3].uid]: mockNotPending.one,
        };

        const { notDue } = spaceRepetitionOrder(
          terms,
          metaRecordEx,
          maxReviews
        );

        expect(notDue, "Categorized as notDue")
          .to.have.length(expected.length)
          .and.to.contain.members(expected);
      });
      it("notPlayed", function () {
        const metaRecord = {
          [terms[0].uid]: mockNotPlayed.one,
          [terms[1].uid]: mockNotPlayed.two,
          [terms[2].uid]: mockPending.excluded.one,
          [terms[3].uid]: mockPending.pass.two,
          [terms[4].uid]: mockPending.fail.one,
          [terms[5].uid]: mockPending.fail.two,
          [terms[6].uid]: mockPending.pass.three,
          [terms[7].uid]: mockPending.pass.four,
          [terms[8].uid]: mockPending.fail.three,
          [terms[9].uid]: mockPending.fail.four,
        };

        const { notPlayed } = spaceRepetitionOrder(
          terms,
          metaRecord,
          maxReviews
        );

        // pending, but not played because date = today
        expect(notPlayed).to.contain.members([2]);
        // no lastReview value
        expect(notPlayed).to.contain.members([0, 1]);
      });
      it("overLimit", function () {
        const maxReviews = 2;

        const metaRecord = {
          [terms[0].uid]: mockNotPlayed.one,
          [terms[1].uid]: mockNotPlayed.two,
          [terms[2].uid]: mockPending.pass.one,
          [terms[3].uid]: mockPending.pass.two,
          [terms[4].uid]: mockPending.fail.one,
          [terms[5].uid]: mockPending.fail.two,
          [terms[6].uid]: mockPending.pass.three,
          [terms[7].uid]: mockPending.pass.four,
          [terms[8].uid]: mockPending.fail.three,
          [terms[9].uid]: mockPending.fail.four,
        };

        const { failed, overdue, overLimit, notPlayed, todayDone } =
          spaceRepetitionOrder(terms, metaRecord, maxReviews);

        expect([...failed, ...overdue], "limited")
          .to.have.length(maxReviews)
          .and.be.an("Array");
        expect([...overLimit, ...notPlayed, ...todayDone], "remainder")
          .to.have.length(terms.length - maxReviews)
          .and.be.an("Array");
      });
    });
    describe("date view exclusion", function () {
      // metadata.lastView: last viewed
      // metadata.lastReview: last reviewed

      const terms = [{ uid: "0023e81f458ea75aaa9a89031105bf63" }];

      it("exclude viewed today", function () {
        const today = new Date().toJSON();

        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();

        const metaRecord = {
          // pending review
          [terms[0].uid]: {
            vC: 2,
            lastView: today,
            lastReview: xAgoDate,
            difficultyP: 90,
            accuracyP: 67,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
        };

        const { failed, overdue, notPlayed } = spaceRepetitionOrder(
          terms,
          metaRecord,
          maxReviews
        );

        // pending, but not played because date = today
        expect([...failed, ...overdue]).to.not.contain.members([0]);
        expect(notPlayed).to.contain.members([0]);
      });
      it("include viewed yesterday", function () {
        const xDaysAgo = 3;
        const t = new Date();
        const xAgoDate = new Date(t.setDate(t.getDate() - xDaysAgo)).toJSON();

        const metaRecord = {
          // pending review
          [terms[0].uid]: {
            vC: 2,
            lastView: xAgoDate,
            lastReview: xAgoDate,
            difficultyP: 90,
            accuracyP: 67,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
        };

        const { notPlayed } = spaceRepetitionOrder(terms, metaRecord, 10);

        expect(notPlayed).to.not.contain.members([0]);
      });
    });
    describe("date review inclusion", function () {
      it("include reviewed today", function () {
        const today = new Date().toJSON();

        const metaRecord = {
          // lastReview today
          [terms[0].uid]: {
            vC: 2,
            lastView: today,
            lastReview: today,
            difficultyP: 90,
            accuracyP: 67,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
        };

        const { failed, overdue, notPlayed, todayDone } = spaceRepetitionOrder(
          terms,
          metaRecord,
          maxReviews
        );

        // pending, but not played because date = today
        expect([...failed, ...overdue]).to.not.contain.members([0]);
        expect(notPlayed).to.not.contain.members([0]);
        expect(todayDone).to.contain.members([0]);
      });
    });
    describe("overdue sorted by lastView", function () {
      it("oldest first", function () {
        const metaRecord = {
          [terms[0].uid]: mockNotPlayed.one,
          [terms[1].uid]: mockNotPlayed.two,
          [terms[2].uid]: {
            vC: 2,
            lastView: xAgoDate(100),
            lastReview: xAgoDate(2),
            difficultyP: 90,
            accuracyP: 100,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
          [terms[3].uid]: {
            vC: 2,
            lastView: xAgoDate(5),
            lastReview: xAgoDate(3),
            difficultyP: 90,
            accuracyP: 71,
            daysBetweenReviews: 1,
            consecutiveRight: 1,
          },
          [terms[4].uid]: mockNotPlayed.one,
          [terms[5].uid]: mockNotPlayed.one,
          [terms[6].uid]: mockNotPlayed.one,
          [terms[7].uid]: mockNotPlayed.one,
          [terms[8].uid]: mockPending.fail.one,
          [terms[9].uid]: mockPending.fail.two,
        };

        const expected = [2, 3];
        const { overdue } = spaceRepetitionOrder(terms, metaRecord, maxReviews);

        expect(overdue, "lastView oldest first").to.deep.equal(expected);
      });
    });
  });

  describe("recallNotificationHelper", function () {
    const twoDaysAgo = xAgoDate(2);
    it("undefined", function () {
      const daysBetweenReviews = undefined;
      const lastReview = twoDaysAgo;

      const actual = recallNotificationHelper(daysBetweenReviews, lastReview);
      expect(actual).to.equal(undefined);
    });

    it("big value", function () {
      const daysBetweenReviews = 1004;
      const lastReview = twoDaysAgo;

      const expected = "1k";
      const actual = recallNotificationHelper(daysBetweenReviews, lastReview);
      expect(actual).to.be.string;
      expect(actual).to.equal(expected);
    });

    it("small value", function () {
      const daysBetweenReviews = 4;
      const lastReview = twoDaysAgo;

      const expected = "2";
      const actual = recallNotificationHelper(daysBetweenReviews, lastReview);
      expect(actual).to.be.string;
      expect(actual).to.equal(expected);
    });

    it("negtive decimal value", function () {
      const daysBetweenReviews = 1.99;
      const lastReview = twoDaysAgo;

      const expected = "-0";
      const actual = recallNotificationHelper(daysBetweenReviews, lastReview);
      expect(actual).to.be.string;
      expect(actual).to.equal(expected);
    });

    it("negtive value", function () {
      const daysBetweenReviews = 1;
      const lastReview = twoDaysAgo;

      const expected = "-1";
      const actual = recallNotificationHelper(daysBetweenReviews, lastReview);
      expect(actual).to.be.string;
      expect(actual).to.equal(expected);
    });
  });
});
