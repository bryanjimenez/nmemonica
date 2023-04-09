import { useSelector } from "react-redux";

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * Hook for non connected functional components
 * uses useSelector for not yet refactored action/reducer
 */
export function useVerbMainSelectorConnected() {
  const stateSettingsTEMP = useSelector(
    (/** @type {RootState}*/ { settings }) => settings
  );
  const { swipeThreshold } = stateSettingsTEMP.global;
  const {
    // repetition,                  // refactored
    romaji: romajiActive,
    verbFormsOrder,
    practiceSide: englishSideUp,
    hintEnabled,
    verbColSplit,
  } = stateSettingsTEMP.vocabulary;

  return {
    // repetition,                  // refactored
    swipeThreshold,
    romajiActive,
    verbFormsOrder,
    englishSideUp,
    hintEnabled,
    verbColSplit,
  };
}
