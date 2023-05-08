import { useSelector } from "react-redux";

/**
 * Kanji app-state props
 */
export function useKanjiConnected() {
  const {
    global,
    kanji: k,
    vocabulary: v,
  } = useSelector((/** @type {RootState}*/ { global, kanji, vocabulary }) => ({
    global,
    kanji,
    vocabulary,
  }));

  const { swipeThreshold } = global;
  const { filter, reinforce, activeTags, repetition, frequency } = k.setting;

  return {
    swipeThreshold,

    kanji: k.value,
    vocabulary: v.value,

    filterType: filter,
    reinforce,
    activeTags,
    repetition,
    frequency,
  };
}
