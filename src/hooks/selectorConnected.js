import { useSelector } from "react-redux";

/**
 * VerbMain app-state props
 */
export function useVerbMainConnected() {
  const { global, vocabulary } = useSelector(
    (/** @type {RootState}*/ { global, vocabulary }) => ({ global, vocabulary })
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

/**
 * SettingsPhrase app-state props
 */
export function useSettingsPhraseConnected() {
  const { phrases } = useSelector((/** @type {RootState}*/ { phrases }) => ({
    phrases,
  }));

  const {
    ordered: phraseOrder,
    romaji: phraseRomaji,
    reinforce: phraseReinforce,
    activeGroup: phraseActive,
    filter: phraseFilter,
    repetition: phraseRep,
  } = phrases.setting;

  return {
    phrases: phrases.value,
    phraseGroups: phrases.grpObj,
    phraseOrder,
    phraseRomaji,
    phraseReinforce,
    phraseActive,
    phraseFilter,
    phraseRep,
  };
}

/**
 * SettingsVocab app-state props
 */
export function useSettingsVocabConnected() {
  const { vocabulary } = useSelector((/** @type {RootState}*/ { vocabulary }) => ({
    vocabulary,
  }));

  const {
    ordered: vocabOrder,
    romaji: vocabRomaji,
    bareKanji: showBareKanji,
    hintEnabled: vocabHint,
    activeGroup: vocabActive,
    autoVerbView,
    verbColSplit,
    filter: vocabFilter,
    memoThreshold: memoThreshold,
    repetition: vocabRep,
    reinforce: vocabReinforce,
    verbFormsOrder,
  } = vocabulary.setting;

  return {
    vocabulary: vocabulary.value,
    vocabGroups: vocabulary.grpObj,

    vocabOrder,
    vocabRomaji,
    showBareKanji,
    vocabHint,
    vocabActive,
    autoVerbView,
    verbColSplit,
    vocabFilter,
    memoThreshold,
    vocabRep,
    vocabReinforce,
    verbFormsOrder,
  };
}
