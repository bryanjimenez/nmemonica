import { shallowEqual, useSelector } from "react-redux";
import { KanaType, TermFilterBy } from "../slices/settingHelper";

export function useConnectSetting() {
  const [darkMode, swipeThreshold, motionThreshold, debug]:[boolean,number,number,number] = useSelector(
    ({ global }:RootState) => {
      const { darkMode, swipeThreshold, motionThreshold, debug } = global;
      return [
        darkMode,
        swipeThreshold,
        motionThreshold,
        debug,
      ];
    },
    shallowEqual
  );

  const memory = useSelector(
    ({ global }:RootState) => {
      const { memory } = global;
      return memory;
    },
    (before, after) => before.usage === after.usage
  );

  const [kanjiChoiceN, kanjiFilter, kanjiReinforce, kanjiActiveTags]:[number, typeof TermFilterBy[keyof typeof TermFilterBy],boolean,string[]] =
    useSelector(( { kanji }:RootState) => {
      const { choiceN, filter, reinforce, activeTags } = kanji.setting;
      return[
        choiceN,
        filter,
        reinforce,
        activeTags,
      ];
    }, shallowEqual);

  const [oppositesQRomaji, oppositesARomaji] = useSelector(
    ({ opposite }:RootState) => {
      const { qRomaji, aRomaji } = opposite;
      return [
        qRomaji,
        aRomaji,
      ];
    },
    shallowEqual
  );

  const [choiceN, wideMode, easyMode, charSet]:[number,boolean,boolean,typeof KanaType[keyof typeof KanaType]] = useSelector(
    ({ kana }:RootState) => {
      const { choiceN, wideMode, easyMode, charSet } = kana.setting;

      return [
        choiceN,
        wideMode,
        easyMode,
        charSet,
      ];
    },
    shallowEqual
  );

  const particlesARomaji = useSelector(
    ({ particle }:RootState) => particle.setting.aRomaji
  );

  const { value: vocabList } = useSelector(
    ({ vocabulary }:RootState) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition: vocabMeta } = useSelector(
    ( { vocabulary }:RootState) => vocabulary.setting,
    (before, after) => before.repTID === after.repTID
  );

  const { value: phraseList } = useSelector(
    ({ phrases }:RootState) => phrases,
    (before, after) => before.version === after.version
  );

  const { repetition: phraseMeta } = useSelector(
    ({ phrases }:RootState) => phrases.setting,
    (before, after) => before.repTID === after.repTID
  );

  const { value: kanjiList } = useSelector(
    ({ kanji }:RootState) => kanji,
    (before, after) => before.version === after.version
  );

  const kanjiTagObj = useSelector(
    ( { kanji }:RootState) => kanji.tagObj,
    shallowEqual
  );

  const { repetition: kanjiMeta } = useSelector(
    ({ kanji }:RootState) => kanji.setting,
    (before, after) => before.repTID === after.repTID
  );

  return {
    darkMode,
    swipeThreshold,
    motionThreshold,
    memory,
    debug,

    kanjiChoiceN,
    kanjiFilter,
    kanjiReinforce,
    kanjiActiveTags,

    oppositesQRomaji,
    oppositesARomaji,

    choiceN,
    wideMode,
    easyMode,
    charSet,

    particlesARomaji,

    vocabList,
    kanjiTagObj,
    phraseList,
    KanjiList: kanjiList,

    vocabMeta,
    phraseMeta,
    kanjiMeta,
  };
}

/**
 * SettingsPhrase app-state props
 */
export function useSettingsPhraseConnected() {
  const { phrases } = useSelector(({ phrases }:RootState) => ({
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
  const { vocabulary } = useSelector(
    ({ vocabulary }:RootState) => ({
      vocabulary,
    })
  );

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
