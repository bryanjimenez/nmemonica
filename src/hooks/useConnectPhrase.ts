import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import { TermFilterBy } from "../slices/settingHelper";
import type { ValuesOf } from "../typings/raw";

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

  const [r, ft, sm, rm, spaRepMaxReviewItem] = useSelector<
    RootState,
    [boolean, ValuesOf<typeof TermFilterBy>, number, boolean, number]
  >(({ phrases }: RootState) => {
    const { reinforce, filter, ordered, romaji, spaRepMaxReviewItem } =
      phrases.setting;
    return [reinforce, filter, ordered, romaji, spaRepMaxReviewItem];
  }, shallowEqual);

  const activeGroup = useSelector<RootState, string[]>(
    ({ phrases }: RootState) => {
      const { activeGroup } = phrases.setting;

      return activeGroup;
    },
    shallowEqual
  );

  /** setting to randomly re-quiz marked terms */
  const reinforce = useRef(r);
  reinforce.current = r;
  /** Settings menu selected filter method */
  const filterType = useRef(ft);
  filterType.current = ft;
  /** Settings menu selected sort method */
  const sortMethod = useRef(sm);
  sortMethod.current = sm;

  const romajiActive = useRef(rm);
  romajiActive.current = rm;

  return {
    // Changing during game
    englishSideUp: englishSideUp,
    repetition,

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

    // Refs ()
    reinforce,
    romajiActive,
    filterType,
    sortMethod,
  };
}
