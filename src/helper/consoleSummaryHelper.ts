import type { MetaDataObj } from "nmemonica";

import {
  ConsoleMessage,
  DebugLevel,
  daysSince,
  msgInnerTrim,
} from "./consoleHelper";
import { getPercentOverdue } from "./recallHelper";
import { type TermSortBy, TermSortByLabel } from "../slices/settingHelper";
import type { ValuesOf } from "../typings/utils";

export function recallSortLogSummary<Term extends { uid: string }>(
  pending: number[],
  metadata: React.RefObject<Record<string, MetaDataObj | undefined>>,
  filtered: Term[],
  overLimit: number[],
  setLog: React.Dispatch<React.SetStateAction<ConsoleMessage[]>>,
  sort: ValuesOf<typeof TermSortBy>
) {
  const overdueVals = pending.map((_item, i) => {
    const {
      accuracyP = 0,
      lastReview,
      daysBetweenReviews,
      // metadata includes filtered in Recall sort
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = metadata.current[filtered[i].uid]!;
    const daysSinceReview =
      lastReview !== undefined ? daysSince(lastReview) : undefined;
    const p = getPercentOverdue({
      accuracy: accuracyP / 100,
      daysSinceReview,
      daysBetweenReviews,
    });

    return p.toFixed(2).replace(".00", "").replace("0.", ".");
  });

  const more = overLimit.length > 0 ? `+${overLimit.length}` : "";

  const arrVals = msgInnerTrim(overdueVals.toString(), 60);

  setLog((l) => [
    ...l,
    {
      msg: `${TermSortByLabel[sort]} (${
        overdueVals.length
      })${more} [${arrVals}]`,
      lvl: pending.length === 0 ? DebugLevel.WARN : DebugLevel.DEBUG,
    },
  ]);
}
