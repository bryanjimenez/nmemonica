import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import { TermFilterBy, TermSortBy } from "../slices/settingHelper";
import type { ValuesOf } from "../typings/utils";

/**
 * Vocabulary app-state props
 */
export function useConnectVocabulary() {
  const [debug, swipeThreshold, motionThreshold] = useSelector<
    RootState,
    [number, number, number]
  >(
    ({ global }: RootState) => [
      global.debug,
      global.swipeThreshold,
      global.motionThreshold,
    ],
    shallowEqual
  );

  const { value: vocabList, grpObj: vocabGroups } = useSelector(
    ({ vocabulary }: RootState) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    ({ vocabulary }: RootState) => vocabulary.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [
    englishSideUp,
    autoVerbView,
    verbForm,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
  ] = useSelector<
    RootState,
    [boolean, boolean, string, number, boolean, boolean]
  >(({ vocabulary }: RootState) => {
    const {
      englishSideUp,
      autoVerbView,
      spaRepMaxReviewItem,
      includeNew,
      includeReviewed,
    } = vocabulary.setting;

    const { verbForm } = vocabulary;

    // TODO: https://github.com/reduxjs/reselect#basic-usage
    return [
      englishSideUp,
      autoVerbView,
      verbForm,
      spaRepMaxReviewItem,
      includeNew,
      includeReviewed,
    ];
  }, shallowEqual);

  const [
    difficultyThreshold,
    r,
    ft,
    he,
    romajiEnabled,
    bareKanji,
    verbColSplit,
    sm,
  ] = useSelector<
    RootState,
    [
      number,
      boolean,
      ValuesOf<typeof TermFilterBy>,
      boolean,
      boolean,
      boolean,
      number,
      ValuesOf<typeof TermSortBy>,
    ]
  >(({ vocabulary }: RootState) => {
    const {
      difficultyThreshold,
      reinforce,
      filter,
      hintEnabled,
      romaji,
      bareKanji,
      verbColSplit,
      ordered,
    } = vocabulary.setting;

    return [
      difficultyThreshold,
      reinforce,
      filter,
      hintEnabled,
      romaji,
      bareKanji,
      verbColSplit,
      ordered,
    ];
  }, shallowEqual);

  const verbFormsOrder = useSelector<RootState, string[]>(
    ({ vocabulary }: RootState) => {
      const { verbFormsOrder } = vocabulary.setting;
      return verbFormsOrder;
    },
    shallowEqual
  );

  const activeGroup = useSelector<RootState, string[]>(
    ({ vocabulary }: RootState) => {
      const { activeGroup } = vocabulary.setting;
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
  const hintEnabled = useRef(he);
  hintEnabled.current = he;
  /** Settings menu selected sort method */
  const sortMethod = useRef(sm);
  sortMethod.current = sm;

  return {
    // Changing during game
    englishSideUp: englishSideUp,
    autoVerbView,
    verbForm,
    repetition,

    /** Threshold to filter terms difficulty */
    difficultyThreshold,

    // Not changing during game
    debugLevel: debug,
    swipeThreshold,
    motionThreshold,
    vocabList,
    vocabGroups,
    romajiEnabled,
    bareKanji,
    verbFormsOrder,
    verbColSplit,
    activeGroup,
    /** Maximum number of space repetition items to review at once */
    spaRepMaxReviewItem,
    /** dateViewOrder include new terms */
    includeNew,
    /** dateViewOrder include terms previously reviewed */
    includeReviewed,

    // Refs ()
    reinforce,
    hintEnabled,
    filterType,
    sortMethod,
  };
}
