import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

/**
 * @typedef {import("../slices/globalSlice").TermFilterBy} TermFilterBy
 */

/**
 * Vocabulary app-state props
 */
export function useVocabularyConnected() {
  const [debug, motionThreshold] = useSelector(
    (/** @type {RootState}*/ { global }) => [
      global.debug,
      global.motionThreshold,
    ],
    shallowEqual
  );

  const { value: vocabList } = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => vocabulary.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [practiceSide, autoVerbView, verbForm] = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => {
      const { practiceSide, autoVerbView } = vocabulary.setting;

      const { verbForm } = vocabulary;


      // TODO: https://github.com/reduxjs/reselect#basic-usage
      return /** @type {[boolean, boolean, string ]} */ ([
        practiceSide,
        autoVerbView,
        verbForm,
      ]);
    },
    shallowEqual
  );

  const [mt, r, ft, he, sm] = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => {
      const {
        memoThreshold,
        reinforce,
        filter,
        hintEnabled,
        ordered,
      } = vocabulary.setting;

      return /** @type {[number, boolean, TermFilterBy[keyof TermFilterBy], boolean, number]} */ ([
        memoThreshold,
        reinforce,
        filter,
        hintEnabled,
        ordered,
      ]);
    },
    shallowEqual
  );

  const activeGroup = useSelector((/** @type {RootState}*/ { vocabulary }) => {
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
    motionThreshold,
    vocabList,
    activeGroup,

    // Refs ()
    reinforce,
    hintEnabled,
    filterType,
    sortMethod,
    memoThreshold,
  };
}
