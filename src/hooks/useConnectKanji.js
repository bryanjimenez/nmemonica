import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

/**
 * @typedef {import("../slices/globalSlice").TermFilterBy} TermFilterBy
 */

/**
 * Kanji app-state props
 */
export function useConnectKanji() {
  const [swipeThreshold] = useSelector(
    (/** @type {RootState}*/ { global }) => [global.swipeThreshold],
    shallowEqual
  );

  const { value: kanjiList } = useSelector(
    (/** @type {RootState}*/ { kanji }) => kanji,
    (before, after) => before.version === after.version
  );

  const { value: vocabList } = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    (/** @type {RootState}*/ { kanji }) => kanji.setting,
    (before, after) => before.repTID === after.repTID
  );

  const [r, ft, choiceN] = useSelector((/** @type {RootState}*/ { kanji }) => {
    const { reinforce, filter, choiceN } = kanji.setting;

    return /** @type {[typeof reinforce, typeof filter, typeof choiceN]} */ ([
      reinforce,
      filter,
      choiceN,
    ]);
  }, shallowEqual);

  const activeTags = useSelector((/** @type {RootState}*/ { kanji }) => {
    const { activeTags } = kanji.setting;
    return activeTags;
  }, shallowEqual);

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
