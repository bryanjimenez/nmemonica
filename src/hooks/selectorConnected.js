import { useSelector } from "react-redux";

/**
 * VerbMain app-state props
 */
export function useVerbMainConnected() {
  const { global, vocabulary } = useSelector(
    (/** @type {RootState}*/ { global, vocabulary }) => ({global, vocabulary})
  );
  const { swipeThreshold } = global;
  const {
    repetition,
    romaji: romajiActive,
    verbFormsOrder,
    practiceSide: englishSideUp,
    hintEnabled,
    verbColSplit,
  } = vocabulary.setting;

  return {
    verbForm: vocabulary.verbForm,
    repetition,
    swipeThreshold,
    romajiActive,
    verbFormsOrder,
    englishSideUp,
    hintEnabled,
    verbColSplit,
  };
}

/**
 * KanjiGame app-state props
 */
export function useKanjiGameConnected() {
  const { value: rawKanjis, setting: kanjiSettings } = useSelector(
    (/** @type {RootState} */ { kanji }) => kanji
  );

  const {
    activeTags,
    filter: filterType,
    reinforce,
    repetition: repetitionObj,
    choiceN,
    repetition,
  } = kanjiSettings;

  return {
    rawKanjis,
    activeTags,
    filterType,
    reinforce,
    repetitionObj,
    choiceN,
    repetition,
  };
}
