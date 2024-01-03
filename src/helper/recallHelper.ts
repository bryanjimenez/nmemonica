import clamp from "lodash/clamp";
import orderBy from "lodash/orderBy";
import type { MetaDataObj } from "nmemonica";

import { daysSince, msgInnerTrim } from "./consoleHelper";
import { AppDispatch } from "../slices";
import { logger } from "../slices/globalSlice";
import { DebugLevel } from "../slices/settingHelper";

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

/**
 * Calculate interval between reviews
 * @param item.difficulty [0, 1]:[easy, hard]
 * @param item.accuracy [0, 1]:[wrong, right]
 * @param item.daysSinceReview number of days since last review
 * @param item.daysBetweenReviews number of days between scheduled reviews
 */
export function calculateDaysBetweenReviews({
  difficulty,
  accuracy,
  daysSinceReview,
  daysBetweenReviews,
}: {
  difficulty: number;
  accuracy: number;
  daysSinceReview?: number;
  daysBetweenReviews?: number;
}) {
  const percentOverdueCalc = getPercentOverdue({
    accuracy,
    daysSinceReview,
    daysBetweenReviews,
  });

  const nextDifficulty =
    difficulty + clamp((percentOverdueCalc / 17) * (8 - 9 * accuracy), 0, 1);

  const difficultyW = 3 - 1.7 * nextDifficulty;

  let daysBetweenCalc: number;
  if (accuracy >= SR_CORRECT_TRESHHOLD) {
    // previously correct
    const fuzz = Math.random() < 0.5 ? 0.95 : 1.05;

    const days =
      typeof daysBetweenReviews === "number" && daysBetweenReviews > 1
        ? daysBetweenReviews
        : 1;

    daysBetweenCalc =
      days * (1 + (difficultyW - 1) * (percentOverdueCalc * fuzz));
  } else {
    // previously incorrect
    const days =
      typeof daysBetweenReviews === "number" && daysBetweenReviews > 0
        ? daysBetweenReviews
        : 1;

    daysBetweenCalc = Math.min(1, days / (1 + 3 * nextDifficulty));
  }

  return daysBetweenCalc;
}

/**
 * Calculated percentage overdue. Value to sort by.
 *
 * overdue: (1, 2]
 *
 * due: 1
 *
 * pending: (0, 1)
 * @param item.accuracy [0, 1]:[wrong, right]
 * @param item.daysSinceReview number of days since last review
 * @param item.daysBetweenReviews number of days between scheduled reviews
 */
export function getPercentOverdue({
  accuracy,
  daysSinceReview,
  daysBetweenReviews,
}: {
  accuracy: number;
  daysSinceReview?: number;
  daysBetweenReviews?: number;
}) {
  let percentOverdueCalc;

  if (
    typeof daysSinceReview === "number" &&
    daysSinceReview > 0 &&
    typeof daysBetweenReviews === "number" &&
    daysBetweenReviews > 0 &&
    accuracy >= SR_CORRECT_TRESHHOLD
  ) {
    // subsequent grading
    percentOverdueCalc = Math.min(
      SR_REVIEW_OVERDUE_PERCENT,
      daysSinceReview / daysBetweenReviews
    );
  } else if (accuracy >= SR_CORRECT_TRESHHOLD) {
    // initial grading
    percentOverdueCalc = SR_REVIEW_DUE_PERCENT;
  } /** accuracy < SR_CORRECT_THRESHOLD */ else {
    percentOverdueCalc = SR_REVIEW_DUE_PERCENT;
  }

  return percentOverdueCalc;
}

/**
 * Space repetition order
 *
 * @returns arrays containing **indexes** of:
 *
 * ```failed``` — previously failed items
 *
 * ```overdue``` — overdue items (percentOverdueCalc in desc order >= 1)
 *
 * ```notDue``` — not yet due (percentOverdueCalc < 1)
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
  notDue: number[];
  overLimit: number[];
  notPlayed: number[];
  todayDone: number[];
} {
  interface timedPlayedSortable {
    percentOverdueCalc: number;
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
    const viewedToday =
      oMeta?.lastView && daysSince(oMeta.lastView) === 0 ? true : false;
    const reviewedToday =
      oMeta?.lastReview && daysSince(oMeta.lastReview) === 0 ? true : false;

    if (
      oMeta?.lastReview &&
      !reviewedToday &&
      !viewedToday &&
      typeof oMeta.accuracyP === "number"
    ) {
      if (oMeta.accuracyP < SR_CORRECT_TRESHHOLD * 100) {
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
      } else {
        // pending

        const daysSinceReview = daysSince(oMeta.lastReview);
        const percentOverdueCalc = getPercentOverdue({
          accuracy: oMeta.accuracyP / 100,
          daysSinceReview,
          daysBetweenReviews: oMeta.daysBetweenReviews,
        });

        overdueTemp = [
          ...overdueTemp,
          {
            percentOverdueCalc,
            lastView: oMeta.lastView,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      }
    } else if (oMeta && reviewedToday) {
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
  const overdueSort = orderBy(overdueTemp, ["percentOverdueCalc", "lastView", "uid"], ["desc", "asc", "asc"]);

  const fail = failedSort.map((el) => el.index);

  // separate due from not due (using percentOverdueCalc threshold)
  const { due, notDue } = overdueSort.reduce<{
    due: number[];
    notDue: number[];
  }>(
    (acc, el) => {
      if (el.percentOverdueCalc < 1) {
        acc.notDue = [...acc.notDue, el.index];
      } else {
        acc.due = [...acc.due, el.index];
      }

      return acc;
    },
    { due: [], notDue: [] }
  );

  const todayDone = todayTemp.map((el) => el.index);

  // maxReviews limit
  const { failed, overdue, overLimit } = overLimitSlice(fail, due, maxReviews);

  return { failed, overdue, notDue, overLimit, notPlayed, todayDone };
}

/**
 * maxReview Limiter
 * @param f failed list
 * @param o overdue list
 * @param maxReviews number of maximum items to review
 */
export function overLimitSlice(f: number[], o: number[], maxReviews?: number) {
  if (!maxReviews) return { failed: f, overdue: o, overLimit: [] };

  const idxEnd = Math.max(0, maxReviews - f.length);
  const failed = f.slice(0, Math.max(idxEnd, maxReviews));
  const overdue = o.slice(0, Math.min(o.length, idxEnd));
  const overLimit = [
    ...f.slice(Math.max(idxEnd, maxReviews)),
    ...o.slice(Math.min(o.length, idxEnd)),
  ];

  return { failed, overdue, overLimit };
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
    const {
      lastView,
      lastReview,
      daysBetweenReviews,
      accuracyP = 0,
    } = metadata[item.uid];

    if (!lastReview || !daysBetweenReviews) return acc;

    const daysSinceReview = daysSince(lastReview);
    const percentOverdueCalc = getPercentOverdue({
      accuracy: accuracyP / 100,
      daysSinceReview,
      daysBetweenReviews,
    });

    return {
      ...acc,
      [item.english]: {
        ["viewed(d)"]: daysSince(lastView),
        ["reviewed(d)"]: daysSince(lastReview),
        ["overdue(%)"]: percentOverdueCalc.toFixed(2),
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

  const { difficultyP, accuracyP, daysBetweenReviews } = metadata;
  if (difficultyP === undefined || accuracyP === undefined) {
    return { newValue: spaceRep, oldValue: spaceRep };
  }

  /** difficultyP [easy:0, hard:1] */
  const difficulty = difficultyP / 100;
  /** accuracyP [wrong:0, right:1] */
  const accuracy = accuracyP / 100;

  const lastReview =
    metadata.lastReview ?? spaceRep[uid]?.lastView ?? new Date().toJSON();

  const daysSinceReview = daysSince(lastReview);

  const calcDaysBetweenReviews = calculateDaysBetweenReviews({
    difficulty,
    accuracy,
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
  meta: MetaDataObj | undefined,
  oldMeta: MetaDataObj | undefined,
  english: string
) {
  const lastReviewDate = oldMeta?.lastReview;
  const lastReview = lastReviewDate ? `${daysSince(lastReviewDate)}d` : "";

  const reviewEvery = meta?.daysBetweenReviews?.toFixed(0);
  const w = msgInnerTrim(english, 30);

  const oReviewEvery = oldMeta?.daysBetweenReviews?.toFixed(0) ?? "";
  const consec = oldMeta?.consecutiveRight ?? "0";

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
export function recallNotificationHelper(
  daysBetweenReviews?: number,
  lastReview?: string
) {
  if (daysBetweenReviews === undefined || lastReview === undefined)
    return undefined;

  const revSince = lastReview !== undefined ? daysSince(lastReview) : 0;
  const revInterval = daysBetweenReviews ?? 0;
  const revDiff = (revInterval - revSince).toFixed(0);
  const revNotification =
    lastReview !== undefined ? revDiff.toString() : undefined;

  return revNotification;
}
