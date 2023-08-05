import clamp from "lodash/clamp";
import orderBy from "lodash/orderBy";

import { daysSince } from "./consoleHelper";
import type { MetaDataObj } from "../typings/raw";

/** Cutoff value between right/wrong
 *
 *  Right = [T, 1]
 */
export const SR_CORRECT_TRESHHOLD = 0.6;
/** Interval value for item not recalled */
export const SR_REVIEW_DUE_PERCENT = 1;
/** Maximum interval for any item */
export const SR_REVIEW_OVERDUE_PERCENT = 2;
/** Minimum items to review at once */
export const SR_MIN_REV_ITEMS = 5;

interface ItemGradeParams {
  /** number between [0, 1] */
  difficulty: number;
  /** number between [0, 1] */
  accuracy: number;
  /** number of days */
  daysSinceReview?: number;
  daysBetweenReviews?: number;
}
/**
 * Space repetition grader
 * @param item.difficulty [0, 1]:[easy, hard]
 * @param item.accuracy [0, 1]:[wrong, right]
 * @param item.daysSinceReview number of days since last review
 * @param item.daysBetweenReviews number of days between scheduled reviews (recalculated after a review)
 */
export function gradeSpaceRepetition({
  difficulty,
  accuracy,
  daysSinceReview,
  daysBetweenReviews,
}: ItemGradeParams) {
  let percentOverdue;

  if (
    typeof daysSinceReview === "number" &&
    daysSinceReview > 0 &&
    typeof daysBetweenReviews === "number" &&
    daysBetweenReviews > 0 &&
    accuracy >= SR_CORRECT_TRESHHOLD
  ) {
    // subsequent grading
    percentOverdue = Math.min(
      SR_REVIEW_OVERDUE_PERCENT,
      daysSinceReview / daysBetweenReviews
    );
  } else if (accuracy >= SR_CORRECT_TRESHHOLD) {
    // initial grading
    percentOverdue = SR_REVIEW_DUE_PERCENT;
  } /** accuracy < SR_CORRECT_THRESHOLD */ else {
    percentOverdue = SR_REVIEW_DUE_PERCENT;
  }

  const nextDifficulty =
    difficulty + clamp((percentOverdue / 17) * (8 - 9 * accuracy), 0, 1);

  const difficultyW = 3 - 1.7 * nextDifficulty;

  let daysBetweenCalc;
  if (
    typeof daysBetweenReviews === "number" &&
    daysBetweenReviews > 0 &&
    accuracy >= SR_CORRECT_TRESHHOLD
  ) {
    // previously correct
    const fuzz = Math.random() < 0.5 ? 0.95 : 1.05;

    daysBetweenCalc =
      daysBetweenReviews * (1 + (difficultyW - 1) * (percentOverdue * fuzz));
  } else {
    // previously incorrect
    daysBetweenCalc = 1 / (1 + 3 * nextDifficulty);
  }

  return {
    /** Calculated review value */
    calcDaysBetweenReviews: daysBetweenCalc,
    /** Calculated review value. The sort value.*/
    calcPercentOverdue: percentOverdue,
  };
}

/**
 * Space repetition order
 *
 * First two arrays are items being rotated
 *
 * First contains previously failed items
 * Second overdue items (percentOverdue in desc order)
 * Third everyting else
 * Fourth items reviewed today
 * @returns arrays containing **indexes**
 */
export function spaceRepetitionOrder<T extends { uid: string }>(
  terms: T[],
  metaRecord: Record<string, MetaDataObj | undefined>,
  spaRepMaxReviewItem: number
): {
  failed: number[];
  overdue: number[];
  notPlayed: number[];
  todayDone: number[];
} {
  interface timedPlayedSortable {
    percentOverdue: number;
    uid: string;
    index: number;
  }
  interface notTimedPlayedSortable {
    date: string;
    views: number;
    uid: string;
    index: number;
  }

  let notPlayed: number[] = [];
  let overdueTemp: timedPlayedSortable[] = [];
  let failedTemp: notTimedPlayedSortable[] = [];
  let todayTemp: notTimedPlayedSortable[] = [];

  terms.forEach((term, tIdx) => {
    const tUid = term.uid;
    const oMeta = metaRecord[tUid];

    /** Don't review items seen today  */
    const dueTodayNotYetSeen = oMeta && daysSince(oMeta.lastView) > 0;

    if (
      spaRepMaxReviewItem > 0 &&
      dueTodayNotYetSeen &&
      oMeta.percentOverdue &&
      typeof oMeta.accuracy === 'number' &&
      oMeta.accuracy < SR_CORRECT_TRESHHOLD * 100
    ) {
      // previously incorrect
      spaRepMaxReviewItem -= 1;
      failedTemp = [
        ...failedTemp,
        {
          date: oMeta.lastView,
          views: oMeta.vC,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else if (
      spaRepMaxReviewItem > 0 &&
      dueTodayNotYetSeen &&
      oMeta?.percentOverdue
    ) {
      // pending
      spaRepMaxReviewItem -= 1;
      overdueTemp = [
        ...overdueTemp,
        {
          percentOverdue: oMeta.percentOverdue,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else if (oMeta?.lastReview && daysSince(oMeta.lastReview) === 0) {
      // reivewed today
      todayTemp = [
        ...todayTemp,
        {
          date: oMeta.lastView,
          views: oMeta.vC,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else {
      notPlayed = [...notPlayed, Number(tIdx)];
    }
  });

  // prettier-ignore
  const failedSort = orderBy(failedTemp, ["uid"], ["asc"]);
  // prettier-ignore
  const overdueSort = orderBy(overdueTemp, ["percentOverdue", "uid"], ["desc", "asc"]);

  const failed = failedSort.map((el) => el.index);
  const overdue = overdueSort.map((el) => el.index);

  const todayDone = todayTemp.map((el) => el.index);

  return { failed, overdue, notPlayed, todayDone };
}

/**
 * Console.table friendly output
 * @param filteredVocab List of items
 * @param metadata  Metadata Record
 */
export function recallInfoTable<T extends { uid: string; english: string }>(
  filteredVocab: T[],
  metadata: Record<string, MetaDataObj>
) {
  return filteredVocab.reduce((acc, item) => {
    const { percentOverdue, lastView, lastReview, daysBetweenReviews } =
      metadata[item.uid];

    if (!lastReview || !percentOverdue || !daysBetweenReviews) return acc;

    return {
      ...acc,
      [item.english]: {
        ["viewed(d)"]: daysSince(lastView),
        ["reviewed(d)"]: daysSince(lastReview),
        ["overdue(%)"]: percentOverdue.toFixed(2),
        ["daysBetweenReviews(d)"]: daysBetweenReviews.toFixed(2),
      },
    };
  }, {});
}

/**
 * Space Repetition
 *
 * Logic to update the MetaDataObj when item is removed
 * @param uid
 * @param spaceRep
 */
export function removeAction(
  uid: string,
  spaceRep: Record<string, MetaDataObj | undefined>
) {
  const metadata = spaceRep[uid];
  if (!metadata) {
    return undefined;
  }

  const o: MetaDataObj = {
    ...metadata,

    daysBetweenReviews: undefined,
    percentOverdue: undefined,
    consecutiveRight: undefined,

    lastReview: undefined,
  };

  const newValue = { ...spaceRep, [uid]: o };
  return newValue;
}

/**
 * Space Repetition
 *
 * Logic to update the MetaDataObj
 * @param uid
 * @param spaceRep
 */
export function updateAction(
  uid: string,
  spaceRep: Record<string, MetaDataObj | undefined>
) {
  const metadata = spaceRep[uid] ?? { lastView: new Date().toJSON(), vC: 1 };

  const { difficulty, accuracy, daysBetweenReviews } = metadata;
  if (difficulty === undefined || accuracy === undefined) {
    return { newValue: spaceRep, oldValue: spaceRep };
  }

  /** difficultyP [easy:0, hard:1] */
  const difficultyP = difficulty / 100;
  /** accuracyP [wrong:0, right:1] */
  const accuracyP = accuracy / 100;

  const lastReview =
    metadata.lastReview ?? spaceRep[uid]?.lastView ?? new Date().toJSON();

  const daysSinceReview = daysSince(lastReview);

  const { calcDaysBetweenReviews, calcPercentOverdue } = gradeSpaceRepetition({
    difficulty: difficultyP,
    accuracy: accuracyP,
    daysSinceReview,
    daysBetweenReviews,
  });

  const consecutiveRight =
    accuracyP >= SR_CORRECT_TRESHHOLD
      ? (metadata.consecutiveRight ?? 0) + 1
      : 0;

  const now = new Date().toJSON();
  const o: MetaDataObj = {
    ...metadata,
    daysBetweenReviews: calcDaysBetweenReviews,
    percentOverdue: calcPercentOverdue,

    consecutiveRight,
    lastView: now,
    lastReview: now,
  };

  const newValue = { ...spaceRep, [uid]: o };
  return { newValue, oldValue: { ...spaceRep } };
}
