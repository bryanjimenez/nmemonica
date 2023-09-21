import { daysSince } from "./consoleHelper";
import { SR_CORRECT_TRESHHOLD, getPercentOverdue } from "./recallHelper";
import type { MetaDataObj } from "../typings/raw";

/**
 * For every available metadata item a
 * lastView number of days is calculated
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
 * is calculated for items reviewed
 * @param metaData 
 */
export function getRecallCounts(
  metaData: Record<string, MetaDataObj | undefined>
) {
  let counts = { wrong: 0, overdue: 0, due: 0, pending: 0, unPlayed: 0 };

  const valueList = Object.keys(metaData).map((el) => {
    const { lastView, lastReview, accuracyP, daysBetweenReviews } =
      metaData[el] ?? {};

    /** Don't review items seen today  */
    const viewedToday = lastView && daysSince(lastView) === 0 ? true : false;
    const reviewedToday =
      lastReview && daysSince(lastReview) === 0 ? true : false;

    if (
      lastReview &&
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

  return counts;
}
