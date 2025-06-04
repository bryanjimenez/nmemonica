import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import { TermFilterBy } from "../slices/settingHelper";
import type { ValuesOf } from "../typings/utils";

/**
 * Phrase app-state props
 */
export function useConnectPhrase() {
  const [debug, motionThreshold, swipeThreshold] = useSelector<
    RootState,
    [number, number, number]
  >(
    ({ global }: RootState) => [
      global.debug,
      global.motionThreshold,
      global.swipeThreshold,
    ],
    shallowEqual
  );

  const { value: phraseList, grpObj: phraseGroups } = useSelector(
    ({ phrases }: RootState) => phrases,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    ({ phrases }: RootState) => phrases.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [englishSideUp, includeNew, includeReviewed] = useSelector(
    ({ phrases }: RootState) => {
      const { englishSideUp, includeNew, includeReviewed } = phrases.setting;
      return [englishSideUp, includeNew, includeReviewed];
    },
    shallowEqual
  );

  const [ft, difficultyThreshold, spaRepMaxReviewItem, viewGoal] = useSelector<
    RootState,
    [
      ValuesOf<typeof TermFilterBy>,
      number,
      number | undefined,
      number | undefined,
    ]
  >(({ phrases }: RootState) => {
    const { filter, difficultyThreshold, spaRepMaxReviewItem, viewGoal } =
      phrases.setting;
    return [filter, difficultyThreshold, spaRepMaxReviewItem, viewGoal];
  }, shallowEqual);

  const sortMethod = useSelector(({ phrases }: RootState) => {
    const { ordered } = phrases.setting;

    return ordered;
  });

  const activeGroup = useSelector<RootState, string[]>(
    ({ phrases }: RootState) => {
      const { activeGroup } = phrases.setting;

      return activeGroup;
    },
    shallowEqual
  );

  /** Settings menu selected filter method */
  const filterType = useRef(ft);
  filterType.current = ft;

  return {
    // Changing during game
    englishSideUp: englishSideUp,
    repetition,

    /** Threshold to filter terms difficulty */
    difficultyThreshold,

    // Not changing during game
    debugLevel: debug,
    motionThreshold,
    swipeThreshold,
    phraseList,
    phraseGroups,
    activeGroup,
    /** Maximum number of space repetition items to review at once */
    spaRepMaxReviewItem,
    /** dateViewOrder include new terms */
    includeNew,
    /** dateViewOrder include terms previously reviewed */
    includeReviewed,

    /** Goal of daily term views */
    viewGoal,

    /** Settings menu selected sort method */
    sortMethod,

    // Refs ()
    filterType,
  };
}
