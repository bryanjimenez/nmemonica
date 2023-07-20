import clamp from "lodash/clamp";
import orderBy from "lodash/orderBy";

import { daysSince } from "./consoleHelper";
import type { MetaDataObj } from "../typings/raw";

export const SR_CORRECT_TRESHHOLD = 0.6;
export const SR_FAIL_REV_INTERVAL = 1;
export const SR_PASS_REV_INTERVAL_MIN = 2;
export const SR_MIN_REV_ITEMS = 5;

interface SRGradeParams {
  /** number between [0,1] */
  difficulty: number;
  /** number between [0,1] */
  accuracy: number;
  /** number of days */
  daysSinceReview?: number;
  daysBetweenReviews?: number;
}
/**
 * Space repetition grader
 */
export function gradeSpaceRepetition({
  difficulty,
  accuracy,
  daysSinceReview,
  daysBetweenReviews,
}: SRGradeParams) {
  let percentOverdue;

  if (
    typeof daysSinceReview === "number" &&
    daysSinceReview > 0 &&
    typeof daysBetweenReviews === "number" &&
    daysBetweenReviews > 0 &&
    accuracy >= SR_CORRECT_TRESHHOLD
  ) {
    // normal
    percentOverdue = Math.min(
      SR_PASS_REV_INTERVAL_MIN,
      daysSinceReview / daysBetweenReviews
    );
  } else if (accuracy >= SR_CORRECT_TRESHHOLD) {
    // first time seeing or
    // abnomal
    percentOverdue = SR_PASS_REV_INTERVAL_MIN;
  } /** accuracy < SR_CORRECT_THRESHOLD */ else {
    percentOverdue = SR_FAIL_REV_INTERVAL;
  }

  const nextDifficulty = difficulty + clamp(
    (percentOverdue / 17) * (8 - 9 * accuracy),
    0,
    1
  );

  const difficultyW = 3 - 1.7 * nextDifficulty;

  let daysBetweenCalc;
  if (
    typeof daysBetweenReviews === "number" &&
    daysBetweenReviews > 0 &&
    accuracy >= SR_CORRECT_TRESHHOLD
    ) {
    const fuzz = Math.random() < 0.5 ? 0.95 : 1.05;

    daysBetweenCalc = daysBetweenReviews * (1 + (difficultyW - 1) * (percentOverdue * fuzz));
  } else {
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
 * Third array is everything else
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
    const dueTodayNotYetSeen = oMeta && daysSince(oMeta.d) > 0;

    if (
      spaRepMaxReviewItem > 0 &&
      dueTodayNotYetSeen &&
      oMeta.percentOverdue === 1
    ) {
      // previously incorrect
      spaRepMaxReviewItem -= 1;
      failedTemp = [
        ...failedTemp,
        {
          date: oMeta.d,
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
          date: oMeta.d,
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
