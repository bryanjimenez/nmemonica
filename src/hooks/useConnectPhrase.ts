import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../typings/slices";

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

  const { metadata: repetition } = useSelector(
    ({ phrases }: RootState) => phrases,
    (before, after) => before.metadataID === after.metadataID
  );

  const [englishSideUp, includeNew, includeReviewed] = useSelector(
    ({ phrases }: RootState) => {
      const { englishSideUp, includeNew, includeReviewed } = phrases.setting;
      return [englishSideUp, includeNew, includeReviewed];
    },
    shallowEqual
  );

  const [difficultyThreshold, spaRepMaxReviewItem, viewGoal] = useSelector<
    RootState,
    [number, number | undefined, number | undefined]
  >(({ phrases }: RootState) => {
    const { difficultyThreshold, spaRepMaxReviewItem, viewGoal } =
      phrases.setting;
    return [difficultyThreshold, spaRepMaxReviewItem, viewGoal];
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
  };
}
