import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import { TermFilterBy } from "../slices/settingHelper";
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

  const { metadata: repetition } = useSelector(
    ({ vocabulary }: RootState) => vocabulary,
    (before, after) => before.metadataID === after.metadataID
  );

  const [
    englishSideUp,
    autoVerbView,
    verbForm,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
    viewGoal,
  ] = useSelector<
    RootState,
    [
      boolean,
      boolean,
      string,
      number | undefined,
      boolean,
      boolean,
      number | undefined,
    ]
  >(({ vocabulary }: RootState) => {
    const {
      englishSideUp,
      autoVerbView,
      spaRepMaxReviewItem,
      includeNew,
      includeReviewed,
      viewGoal,
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
      viewGoal,
    ];
  }, shallowEqual);

  const [difficultyThreshold, ft, he, bareKanji, verbColSplit] = useSelector<
    RootState,
    [number, ValuesOf<typeof TermFilterBy>, boolean, boolean, number]
  >(({ vocabulary }: RootState) => {
    const {
      difficultyThreshold,
      filter,
      hintEnabled,
      bareKanji,
      verbColSplit,
    } = vocabulary.setting;

    return [difficultyThreshold, filter, hintEnabled, bareKanji, verbColSplit];
  }, shallowEqual);

  const sortMethod = useSelector(({ vocabulary }: RootState) => {
    const { ordered } = vocabulary.setting;

    return ordered;
  });

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

  /** Settings menu selected filter method */
  const filterType = useRef(ft);
  filterType.current = ft;
  const hintEnabled = useRef(he);
  hintEnabled.current = he;

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

    /** Goal of daily term views */
    viewGoal,

    /** Settings menu selected sort method */
    sortMethod,

    // Refs ()
    hintEnabled,
    filterType,
  };
}
