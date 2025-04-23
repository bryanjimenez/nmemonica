import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import type { TermFilterBy } from "../slices/settingHelper";
import { ValuesOf } from "../typings/utils";

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

  const { metadata: repetition } = useSelector(
    ({ kanji }: RootState) => kanji,
    (before, after) => before.metadataID === after.metadataID
  );

  const [
    ft,
    difficultyThreshold,
    choiceN,
    fadeInAnswers,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
    viewGoal,
  ] = useSelector<
    RootState,
    [
      ValuesOf<typeof TermFilterBy>,
      number,
      number,
      boolean,
      number | undefined,
      boolean,
      boolean,
      number | undefined,
    ]
  >(({ kanji }: RootState) => {
    const {
      filter,
      difficultyThreshold,
      choiceN,
      fadeInAnswers,
      spaRepMaxReviewItem,
      includeNew,
      includeReviewed,
      viewGoal,
    } = kanji.setting;

    return [
      filter,
      difficultyThreshold,
      choiceN,
      fadeInAnswers,
      spaRepMaxReviewItem,
      includeNew,
      includeReviewed,
      viewGoal,
    ];
  }, shallowEqual);

  const sortMethod = useSelector(({ kanji }: RootState) => {
    const { ordered } = kanji.setting;

    return ordered;
  });

  const activeTags = useSelector<RootState, string[]>(
    ({ kanji }: RootState) => {
      const { activeTags } = kanji.setting;
      return activeTags;
    },
    shallowEqual
  );

  /** Settings menu selected filter method */
  const filterType = useRef(ft);
  filterType.current = ft;

  return {
    // Changing during game
    repetition,

    // Not changing during game
    swipeThreshold,
    /** Threshold to filter terms difficulty */
    difficultyThreshold,
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
    /** dateViewOrder include new terms */
    includeNew,
    /** dateViewOrder include terms previously reviewed */
    includeReviewed,

    /** Goal of daily term views */
    viewGoal,

    sortMethod,

    // Refs ()
    filterType,
  };
}
