import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { TermFilterBy, TermSortBy } from "../slices/settingHelper";

/**
 * Vocabulary app-state props
 */
export function useConnectVocabulary() {
  const [debug, swipeThreshold, motionThreshold] = useSelector(
    ({ global }:RootState) => [
      global.debug,
      global.swipeThreshold,
      global.motionThreshold,
    ],
    shallowEqual
  );

  const { value: vocabList } = useSelector(
    ({ vocabulary }:RootState) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    ( { vocabulary }:RootState) => vocabulary.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [practiceSide, autoVerbView, verbForm]:[boolean, boolean, string ] = useSelector(
    ({ vocabulary }:RootState) => {
      const { practiceSide, autoVerbView } = vocabulary.setting;

      const { verbForm } = vocabulary;

      // TODO: https://github.com/reduxjs/reselect#basic-usage
      return [
        practiceSide,
        autoVerbView,
        verbForm,
      ];
    },
    shallowEqual
  );

  const [mt, r, ft, he, romajiEnabled, bareKanji, verbColSplit, sm]:[number,boolean,typeof TermFilterBy[keyof typeof TermFilterBy],boolean,boolean,boolean,number,typeof TermSortBy[keyof typeof TermSortBy]] =
    useSelector(({ vocabulary }:RootState) => {
      const {
        memoThreshold,
        reinforce,
        filter,
        hintEnabled,
        romaji,
        bareKanji,
        verbColSplit,
        ordered,
      } = vocabulary.setting;

      return [
        memoThreshold,
        reinforce,
        filter,
        hintEnabled,
        romaji,
        bareKanji,
        verbColSplit,
        ordered,
      ];
    }, shallowEqual);

  const verbFormsOrder = useSelector(
    ({ vocabulary }:RootState) => {
      const { verbFormsOrder } = vocabulary.setting;
      return verbFormsOrder;
    },
    shallowEqual
  );

  const activeGroup = useSelector(({ vocabulary }:RootState) => {
    const { activeGroup } = vocabulary.setting;
    return activeGroup;
  }, shallowEqual);

  /** Threshold describing how far memorized a word is */
  const memoThreshold = useRef(mt);
  memoThreshold.current = mt;
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
    englishSideUp: practiceSide,
    autoVerbView,
    verbForm,
    repetition,

    // Not changing during game
    debugLevel: debug,
    swipeThreshold,
    motionThreshold,
    vocabList,
    romajiEnabled,
    bareKanji,
    verbFormsOrder,
    verbColSplit,
    activeGroup,

    // Refs ()
    reinforce,
    hintEnabled,
    filterType,
    sortMethod,
    memoThreshold,
  };
}
