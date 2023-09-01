import clamp from "lodash/clamp";
import orderBy from "lodash/orderBy";

import { daysSince, msgInnerTrim } from "./consoleHelper";
import { AppDispatch } from "../slices";
import { logger } from "../slices/globalSlice";
import { DebugLevel } from "../slices/settingHelper";
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

  let daysBetweenCalc: number;
  if (accuracy >= SR_CORRECT_TRESHHOLD) {
    // previously correct
    const fuzz = Math.random() < 0.5 ? 0.95 : 1.05;

    const days =
      typeof daysBetweenReviews === "number" && daysBetweenReviews > 1
        ? daysBetweenReviews
        : 1;

    daysBetweenCalc = days * (1 + (difficultyW - 1) * (percentOverdue * fuzz));
  } else {
    // previously incorrect
    const days =
      typeof daysBetweenReviews === "number" && daysBetweenReviews > 0
        ? daysBetweenReviews
        : 1;

    daysBetweenCalc = Math.min(1, days / (1 + 3 * nextDifficulty));
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
 * @returns arrays containing **indexes** of:
 *
 * ```failed``` — previously failed items
 *
 * ```overdue``` — overdue items (percentOverdue in desc order)
 *
 * ```overLimit``` — items beyond ```maxReviews``` limit (unordered)
 *
 * ```notPlayed```
 *
 * ```todayDone``` — items reviewed today
 */
export function spaceRepetitionOrder<T extends { uid: string }>(
  terms: T[],
  metaRecord: Record<string, MetaDataObj | undefined>,
  maxReviews?: number
): {
  failed: number[];
  overdue: number[];
  overLimit: number[];
  notPlayed: number[];
  todayDone: number[];
} {
  interface timedPlayedSortable {
    percentOverdue: number;
    lastView: string;
    uid: string;
    index: number;
  }
  interface notTimedPlayedSortable {
    lastView: string;
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
    const reviewedToday =
      oMeta?.lastReview && daysSince(oMeta.lastReview) === 0;

    if (
      dueTodayNotYetSeen &&
      oMeta.percentOverdue &&
      typeof oMeta.accuracy === "number" &&
      oMeta.accuracy < SR_CORRECT_TRESHHOLD * 100
    ) {
      // previously incorrect
      failedTemp = [
        ...failedTemp,
        {
          lastView: oMeta.lastView,
          views: oMeta.vC,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else if (dueTodayNotYetSeen && oMeta?.percentOverdue) {
      // pending
      overdueTemp = [
        ...overdueTemp,
        {
          percentOverdue: oMeta.percentOverdue,
          lastView: oMeta.lastView,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else if (reviewedToday) {
      // reivewed today
      todayTemp = [
        ...todayTemp,
        {
          lastView: oMeta.lastView,
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
  const failedSort = orderBy(failedTemp, ["lastView", "uid"], ["asc", "asc"]);
  // prettier-ignore
  const overdueSort = orderBy(overdueTemp, ["percentOverdue", "lastView", "uid"], ["desc", "asc", "asc"]);

  const f = failedSort.map((el) => el.index);
  const o = overdueSort.map((el) => el.index);

  const todayDone = todayTemp.map((el) => el.index);

  // maxReviews limit
  let failed = f;
  let overdue = o;
  let overLimit: number[] = [];
  if (maxReviews && maxReviews > 0) {
    const idxEnd = Math.max(0, maxReviews - f.length);
    failed = f.slice(0, Math.max(idxEnd, maxReviews));
    overdue = o.slice(0, Math.min(o.length, idxEnd));
    overLimit = [
      ...f.slice(Math.max(idxEnd, maxReviews)),
      ...o.slice(Math.min(o.length, idxEnd)),
    ];
  }

  return { failed, overdue, overLimit, notPlayed, todayDone };
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

/**
 * Logic to log debug message
 * @param dispatch
 * @param uid
 * @param meta
 * @param oldMeta
 * @param term
 */
export function recallDebugLogHelper(
  dispatch: AppDispatch,
  uid: string,
  meta: Record<string, MetaDataObj>,
  oldMeta: Record<string, MetaDataObj>,
  english: string
) {
  const lastReviewDate = oldMeta[uid]?.lastReview;
  const lastReview = lastReviewDate ? `${daysSince(lastReviewDate)}d` : "";

  const reviewEvery = meta[uid].daysBetweenReviews?.toFixed(0);
  const w = msgInnerTrim(english, 30);

  // FIXME: testing
  const oReviewEvery = oldMeta[uid].daysBetweenReviews?.toFixed(0) ?? "";
  const consec = oldMeta[uid].consecutiveRight ?? "0";

  const msg =
    reviewEvery === undefined
      ? `Space Rep [${w}] removed`
      : `Space Rep [${w}] updated ${lastReview} f:${oReviewEvery}d #${consec} -> f:${reviewEvery}d`;

  dispatch(logger(msg, DebugLevel.WARN));
}

/**
 * Calculate how many days
 *
 * overdue (negative values)
 *
 * or
 *
 * pending until the due date (positive values)
 * @param daysBetweenReviews
 * @param lastReview
 */
export function recallNotificationHelper(daysBetweenReviews?:number, lastReview?:string ){

  if(daysBetweenReviews === undefined || lastReview === undefined)
    return undefined;

  const revSince = lastReview !== undefined ? daysSince(lastReview): 0;
  const revInterval = daysBetweenReviews ?? 0;
  const revDiff = (revInterval - revSince).toFixed(0);
  const revNotification = lastReview !== undefined ? revDiff.toString(): undefined;

  return revNotification;
}