import { useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

/**
 * @typedef {import("../slices/globalSlice").TermFilterBy} TermFilterBy
 */

/**
 * Phrase app-state props
 */
export function useConnectPhrase() {
  const [debug, motionThreshold, swipeThreshold] = useSelector(
    (/** @type {RootState}*/ { global }) => [
      global.debug,
      global.motionThreshold,
      global.swipeThreshold,
    ],
    shallowEqual
  );

  const { value: phraseList } = useSelector(
    (/** @type {RootState}*/ { phrases }) => phrases,
    (before, after) => before.version === after.version
  );

  const { repetition } = useSelector(
    (/** @type {RootState}*/ { phrases }) => phrases.setting,
    (before, after) => before.repTID === after.repTID
  );

  const practiceSide = useSelector(
    (/** @type {RootState}*/ { vocabulary: phrases }) => {
      const { practiceSide } = phrases.setting;
      return practiceSide;
    }
  );

  const [r, ft, sm, rm] = useSelector((/** @type {RootState}*/ { phrases }) => {
    const { reinforce, filter, ordered, romaji } = phrases.setting;
    return /** @type {[boolean, TermFilterBy[keyof TermFilterBy], number, boolean]} */ ([
      reinforce,
      filter,
      ordered,
      romaji,
    ]);
  }, shallowEqual);

  const activeGroup = useSelector((/** @type {RootState}*/ { vocabulary }) => {
    const { activeGroup } = vocabulary.setting;

    return activeGroup;
  }, shallowEqual);

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
    englishSideUp: practiceSide,
    repetition,

    // Not changing during game
    debugLevel: debug,
    motionThreshold,
    swipeThreshold,
    phraseList,
    activeGroup,

    // Refs ()
    reinforce,
    romajiActive,
    filterType,
    sortMethod,
  };
}
