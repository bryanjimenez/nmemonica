import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import type { TermFilterBy } from "../slices/settingHelper";

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

  const { value: vocabList } = useSelector(
    ({ vocabulary }: RootState) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    ({ kanji }: RootState) => kanji.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [r, ft, choiceN] = useSelector<
    RootState,
    [boolean, (typeof TermFilterBy)[keyof typeof TermFilterBy], number]
  >(({ kanji }: RootState) => {
    const { reinforce, filter, choiceN } = kanji.setting;

    return [reinforce, filter, choiceN];
  }, shallowEqual);

  const activeTags = useSelector<RootState, string[]>(
    ({ kanji }: RootState) => {
      const { activeTags } = kanji.setting;
      return activeTags;
    },
    shallowEqual
  );

  /** setting to randomly re-quiz marked terms */
  const reinforce = useRef(r);
  reinforce.current = r;
  /** Settings menu selected filter method */
  const filterType = useRef(ft);
  filterType.current = ft;

  return {
    // Changing during game
    repetition,

    // Not changing during game
    swipeThreshold,
    kanjiList,
    vocabList,
    activeTags,
    choiceN,

    // Refs ()
    reinforce,
    filterType,
  };
}
