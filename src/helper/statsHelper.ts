import type { MetaDataObj } from "nmemonica";

import { daysSince } from "./consoleHelper";
import { SR_CORRECT_TRESHHOLD, getPercentOverdue } from "./recallHelper";

/**
 * For every available metadata item a
 * number of days since lastView is calculated
 * @param metaData
 * @param days Number of days from today to include
 */
export function getLastViewCounts(
  metaData: Record<string, MetaDataObj | undefined>,
  days: number
) {
  const valueList = Object.keys(metaData).map((el) => {
    const lastView = metaData[el]?.lastView;
    if (lastView === undefined) {
      return -1;
    } else {
      return daysSince(lastView);
    }
  });

  let counts: number[] = new Array(days) as number[];
  counts.fill(0);
  valueList.forEach((val) => {
    if (val > -1 && val < days) {
      counts[val] = counts[val] ? counts[val] + 1 : 1;
    }
  });

  return counts;
}

/**
 * For every available metadata item a
 * count of wrong, overdue, due, pending, and unPlayed
 * is calculated. These are Recall game stats.
 * @param metaData
 */
export function getRecallCounts(
  metaData: Record<string, MetaDataObj | undefined>
) {
  let counts = {
    wrong: 0,
    overdue: 0,
    due: 0,
    pending: 0,
    unPlayed: 0,
    values: [],
  };

  const valueList = Object.keys(metaData).map((el) => {
    const { lastView, lastReview, accuracyP, daysBetweenReviews } =
      metaData[el] ?? {};

    /** Don't review items seen today  */
    const viewedToday =
      lastView !== undefined && daysSince(lastView) === 0 ? true : false;
    const reviewedToday =
      lastReview !== undefined && daysSince(lastReview) === 0 ? true : false;

    if (
      lastReview !== undefined &&
      !reviewedToday &&
      !viewedToday &&
      typeof accuracyP === "number"
    ) {
      const daysSinceReview = daysSince(lastReview);

      const percent = getPercentOverdue({
        accuracy: accuracyP / 100,
        daysBetweenReviews,
        daysSinceReview,
      });

      if (accuracyP < SR_CORRECT_TRESHHOLD * 100) {
        // wrong
        counts.wrong += 1;
      } else {
        // right

        if (percent === 2) {
          counts.overdue += 1;
        } else if (percent >= 1) {
          counts.due += 1;
        } else if (percent > 0) {
          counts.pending += 1;
        }
      }
      return percent;
    } else if (reviewedToday) {
      // reviewed today
      return 0;
    } else {
      // never reviewed
      counts.unPlayed = counts.unPlayed + 1;
      return -1;
    }
  });

  return { ...counts, value: valueList };
}

/**
 * Get basic stats about lastView
 * @param metaData
 */
export function getStalenessCounts<T extends { uid: string }>(
  metaData: Record<string, MetaDataObj | undefined>,
  termList: T[]
) {
  const numbers = {
    range: 0,
    unPlayed: termList.length,
    min: Number.MAX_SAFE_INTEGER,
    max: -1,
    mean: Number.NaN,
    q1: Number.NaN,
    q2: Number.NaN,
    q3: Number.NaN,
  };
  let sum = 0;
  const valueList = Object.keys(metaData).reduce<number[]>((acc, el) => {
    // count items which meta uid is in the term list
    const termIsInList = termList.find((tel) => tel.uid === el) !== undefined;
    if (termIsInList === false) {
      return acc;
    }

    const lastView = metaData[el]?.lastView;
    if (lastView !== undefined) {
      const n = daysSince(lastView);
      numbers.min = numbers.min > n ? n : numbers.min;
      numbers.max = numbers.max < n ? n : numbers.max;
      numbers.unPlayed -= 1;

      sum += n;

      return [...acc, n];
    }

    return acc;
  }, []);

  const sorted = [...valueList].sort((a, b) => a - b);
  numbers.range = valueList.length;
  numbers.mean = sum / valueList.length;
  numbers.q1 = sorted[Math.round(valueList.length * 0.25) - 1];
  numbers.q3 = sorted[Math.round(valueList.length * 0.75) - 1];
  if (valueList.length % 2 === 0) {
    numbers.q2 =
      (sorted[Math.round(valueList.length * 0.5) - 1] +
        sorted[Math.round(valueList.length * 0.5)]) /
      2;
  } else {
    numbers.q2 = sorted[Math.round(valueList.length * 0.5) - 1];
  }

  return numbers;
}

export function getStats(n: number[]) {
  const stats = {
    range: 0,
    min: Number.MAX_SAFE_INTEGER,
    max: -1,
    mean: Number.NaN,
    q0: Number.MAX_SAFE_INTEGER,
    q1: Number.NaN,
    q2: Number.NaN,
    q3: Number.NaN,
    q4: Number.MIN_SAFE_INTEGER,
  };

  const sorted = [...n].sort((a, b) => a - b);
  const sum = n.reduce((tot, val) => tot + val, 0);
  const max = Math.max(...n);
  const min = Math.min(...n);

  stats.range = n.length;
  stats.mean = sum / n.length;
  stats.min = min;
  stats.q0 = min;
  stats.q1 = sorted[Math.round(n.length * 0.25) - 1];
  stats.q3 = sorted[Math.round(n.length * 0.75) - 1];
  stats.q4 = max;
  stats.max = max;
  if (n.length % 2 === 0) {
    stats.q2 =
      (sorted[Math.round(n.length * 0.5) - 1] +
        sorted[Math.round(n.length * 0.5)]) /
      2;
  } else {
    stats.q2 = sorted[Math.round(n.length * 0.5) - 1];
  }

  return stats;
}

/**
 * For every available metadata item a
 * difficulty range counts are calculated
 * @param metaData
 */
export function getDifficultyCounts(
  metaData: Record<string, MetaDataObj | undefined>
) {
  // let unPlayed = 0;
  let difficultyRange: number[] = new Array(10) as number[];
  difficultyRange.fill(0);

  Object.keys(metaData).map((el) => {
    const difficulty = metaData[el]?.difficultyP;
    if (difficulty === undefined) {
      // unPlayed += 1;
      return -1;
    } else {
      const index = difficulty / 10 - 1;
      difficultyRange[index] = difficultyRange[index] + 1;

      return difficulty;
    }
  });

  return difficultyRange;
}
