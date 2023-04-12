import { useSelector } from "react-redux";

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * VerbMain app-state props
 */
export function useVerbMainConnected() {
  const { vocabulary, stateSettingsTEMP } = useSelector(
    (/** @type {RootState}*/ { vocabulary, settingsHK }) => ({
      vocabulary,
      stateSettingsTEMP: settingsHK,
    })
  );
  const { swipeThreshold } = stateSettingsTEMP.global;
  const {
    repetition,
    romaji: romajiActive,
    verbFormsOrder,
    practiceSide: englishSideUp,
    hintEnabled,
    verbColSplit,
  } = stateSettingsTEMP.vocabulary;

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
