import { shallowEqual, useSelector } from "react-redux";

export function useConnectSetting() {
  const [darkMode, swipeThreshold, motionThreshold, debug] = useSelector(
    (/** @type {RootState}*/ { global }) => {
      const { darkMode, swipeThreshold, motionThreshold, debug } = global;
      return /** @type {[typeof darkMode, typeof swipeThreshold, typeof motionThreshold, typeof debug]}*/ ([
        darkMode,
        swipeThreshold,
        motionThreshold,
        debug,
      ]);
    },
    shallowEqual
  );

  const memory = useSelector(
    (/** @type {RootState}*/ { global }) => {
      const { memory } = global;
      return memory;
    },
    (before, after) => before.usage === after.usage
  );

  const [kanjiChoiceN, kanjiFilter, kanjiReinforce, kanjiActiveTags] =
    useSelector((/** @type {RootState}*/ { kanji }) => {
      const { choiceN, filter, reinforce, activeTags } = kanji.setting;
      return /** @type {[typeof choiceN,typeof filter,typeof reinforce, typeof activeTags]}*/ ([
        choiceN,
        filter,
        reinforce,
        activeTags,
      ]);
    }, shallowEqual);

  const [oppositesQRomaji, oppositesARomaji] = useSelector(
    (/** @type {RootState}*/ { opposite }) => {
      const { qRomaji, aRomaji } = opposite;
      return /** @type {[typeof qRomaji, typeof aRomaji]} */ ([
        qRomaji,
        aRomaji,
      ]);
    },
    shallowEqual
  );

  const [choiceN, wideMode, easyMode, charSet] = useSelector(
    (/** @type {RootState}*/ { kana }) => {
      const { choiceN, wideMode, easyMode, charSet } = kana.setting;

      return /** @type {[typeof choiceN, typeof wideMode, typeof easyMode, typeof charSet]} */ ([
        choiceN,
        wideMode,
        easyMode,
        charSet,
      ]);
    },
    shallowEqual
  );

  const particlesARomaji = useSelector(
    (/** @type {RootState}*/ { particle }) => particle.setting.aRomaji
  );

  const { value: vocabList } = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition: vocabMeta } = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => vocabulary.setting,
    (before, after) => before.repTID === after.repTID
  );

  const { value: phraseList } = useSelector(
    (/** @type {RootState}*/ { phrases }) => phrases,
    (before, after) => before.version === after.version
  );

  const { repetition: phraseMeta } = useSelector(
    (/** @type {RootState}*/ { phrases }) => phrases.setting,
    (before, after) => before.repTID === after.repTID
  );

  const { value: kanjiList } = useSelector(
    (/** @type {RootState}*/ { kanji }) => kanji,
    (before, after) => before.version === after.version
  );

  const kanjiTagObj = useSelector(
    (/** @type {RootState}*/ { kanji }) => kanji.tagObj,
    shallowEqual
  );

  const { repetition: kanjiMeta } = useSelector(
    (/** @type {RootState}*/ { kanji }) => kanji.setting,
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
  const { vocabulary } = useSelector(
    (/** @type {RootState}*/ { vocabulary }) => ({
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
