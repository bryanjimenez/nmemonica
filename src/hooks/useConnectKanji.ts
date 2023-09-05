import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import type { TermFilterBy, TermSortBy } from "../slices/settingHelper";
import { ValuesOf } from "../typings/raw";

/**
 * Kanji app-state props
 */
export function useConnectKanji() {
  const swipeThreshold = useSelector(
    ({ global }: RootState) => global.swipeThreshold
  );

  const { value: kanjiList } = useSelector(
    ({ kanji }: RootState) => kanji,
    (before, after) => before.version === after.version
  );

  const kanjiTagObj = useSelector<RootState, string[]>(
    ({ kanji }: RootState) => kanji.tagObj,
    shallowEqual
  );

  const { repetition } = useSelector(
    ({ kanji }: RootState) => kanji.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [
    r,
    ft,
    or,
    memoThreshold,
    choiceN,
    fadeInAnswers,
    spaRepMaxReviewItem,
  ] = useSelector<
    RootState,
    [
      boolean,
      ValuesOf<typeof TermFilterBy>,
      ValuesOf<typeof TermSortBy>,
      number,
      number,
      boolean,
      number
    ]
  >(({ kanji }: RootState) => {
    const {
      reinforce,
      filter,
      ordered,
      memoThreshold,
      choiceN,
      fadeInAnswers,
      spaRepMaxReviewItem,
    } = kanji.setting;

    return [
      reinforce,
      filter,
      ordered,
      memoThreshold,
      choiceN,
      fadeInAnswers,
      spaRepMaxReviewItem,
    ];
  }, shallowEqual);

  const activeTags = useSelector<RootState, string[]>(
    ({ kanji }: RootState) => {
      const { activeTags } = kanji.setting;
      return activeTags;
    },
    shallowEqual
  );

  /** Setting to randomly re-quiz marked terms */
  const reinforce = useRef(r);
  reinforce.current = r;
  /** Settings menu selected filter method */
  const filterType = useRef(ft);
  filterType.current = ft;
  const orderType = useRef(or);
  orderType.current = or;

  return {
    // Changing during game
    repetition,

    // Not changing during game
    swipeThreshold,
    memoThreshold,
    kanjiList,
    /** All available kanji tags */
    kanjiTagObj,
    /** Selected kanji tags */
    activeTags,
    // Game
    choiceN,
    fadeInAnswers,
    /** Maximum number of space repetition items to review at once */
    spaRepMaxReviewItem,

    // Refs ()
    reinforce,
    filterType,
    orderType,
  };
}
