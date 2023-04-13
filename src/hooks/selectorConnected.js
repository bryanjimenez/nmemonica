import { useSelector } from "react-redux";

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * VerbMain app-state props
 */
export function useVerbMainConnected() {
  const { vocabulary, stateSettings } = useSelector(
    (/** @type {RootState}*/ { vocabulary, setting }) => ({
      vocabulary,
      stateSettings: setting,
    })
  );
  const { swipeThreshold } = stateSettings.global;
  const {
    repetition,
    romaji: romajiActive,
    verbFormsOrder,
    practiceSide: englishSideUp,
    hintEnabled,
    verbColSplit,
  } = stateSettings.vocabulary;

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
  const { value: rawKanjis } = useSelector(
    (/** @type {RootState} */ { kanji }) => kanji
  );

  const {
    activeTags,
    filter: filterType,
    reinforce,
    repetition: repetitionObj,
    choiceN,
    repetition,
  } = useSelector((/** @type {RootState}*/ { setting }) => setting.kanji);

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
