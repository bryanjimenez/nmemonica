import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import type { TermFilterBy, TermSortBy } from "../slices/settingHelper";

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

  const [r, ft, or, memoThreshold, choiceN, fadeInAnswers] = useSelector<
    RootState,
    [
      boolean,
      (typeof TermFilterBy)[keyof typeof TermFilterBy],
      (typeof TermSortBy)[keyof typeof TermSortBy],
      number,
      number,
      boolean
    ]
  >(({ kanji }: RootState) => {
    const {
      reinforce,
      filter,
      ordered,
      memoThreshold,
      choiceN,
      fadeInAnswers,
    } = kanji.setting;

    return [reinforce, filter, ordered, memoThreshold, choiceN, fadeInAnswers];
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

    // Refs ()
    reinforce,
    filterType,
    orderType,
  };
}
