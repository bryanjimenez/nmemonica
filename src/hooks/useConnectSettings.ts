import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";
import { KanaType, TermFilterBy } from "../slices/settingHelper";

export function useConnectSetting() {
  const [darkMode, swipeThreshold, motionThreshold, debug] = useSelector<
    RootState,
    [boolean, number, number, number]
  >(({ global }: RootState) => {
    const { darkMode, swipeThreshold, motionThreshold, debug } = global;
    return [darkMode, swipeThreshold, motionThreshold, debug];
  }, shallowEqual);

  const memory = useSelector(
    ({ global }: RootState) => {
      const { memory } = global;
      return memory;
    },
    (before, after) => before.usage === after.usage
  );

  const [
    kanjiChoiceN,
    kanjiFadeInAnswers,
    kanjiFilter,
    kanjiReinforce,
    kanjiActiveTags,
  ] = useSelector<
    RootState,
    [
      number,
      boolean,
      (typeof TermFilterBy)[keyof typeof TermFilterBy],
      boolean,
      string[]
    ]
  >(({ kanji }: RootState) => {
    const { choiceN, fadeInAnswers, filter, reinforce, activeTags } =
      kanji.setting;
    return [choiceN, fadeInAnswers, filter, reinforce, activeTags];
  }, shallowEqual);

  const [oppositesQRomaji, oppositesARomaji, oppositeFadeInAnswers] =
    useSelector<RootState, boolean[]>(({ opposite }: RootState) => {
      const { qRomaji, aRomaji, fadeInAnswers } = opposite;
      return [qRomaji, aRomaji, fadeInAnswers];
    }, shallowEqual);

  const [choiceN, wideMode, easyMode, charSet] = useSelector<
    RootState,
    [number, boolean, boolean, (typeof KanaType)[keyof typeof KanaType]]
  >(({ kana }: RootState) => {
    const { choiceN, wideMode, easyMode, charSet } = kana.setting;

    return [choiceN, wideMode, easyMode, charSet];
  }, shallowEqual);

  const [particlesARomaji, particleFadeInAnswer] = useSelector<
    RootState,
    boolean[]
  >(({ particle }: RootState) => {
    const { aRomaji, fadeInAnswers } = particle.setting;
    return [aRomaji, fadeInAnswers];
  }, shallowEqual);

  const { value: vocabList } = useSelector(
    ({ vocabulary }: RootState) => vocabulary,
    (before, after) => before.version === after.version
  );

  const { repetition: vocabMeta } = useSelector(
    ({ vocabulary }: RootState) => vocabulary.setting,
    (before, after) => before.repTID === after.repTID
  );

  const { value: phraseList } = useSelector(
    ({ phrases }: RootState) => phrases,
    (before, after) => before.version === after.version
  );

  const { repetition: phraseMeta } = useSelector(
    ({ phrases }: RootState) => phrases.setting,
    (before, after) => before.repTID === after.repTID
  );

  const { value: kanjiList } = useSelector(
    ({ kanji }: RootState) => kanji,
    (before, after) => before.version === after.version
  );

  const kanjiTagObj = useSelector<RootState, string[]>(
    ({ kanji }: RootState) => kanji.tagObj,
    shallowEqual
  );

  const { repetition: kanjiMeta } = useSelector(
    ({ kanji }: RootState) => kanji.setting,
    (before, after) => before.repTID === after.repTID
  );

  return {
    darkMode,
    swipeThreshold,
    motionThreshold,
    memory,
    debug,

    kanjiChoiceN,
    kanjiFadeInAnswers,
    kanjiFilter,
    kanjiReinforce,
    kanjiActiveTags,

    oppositesQRomaji,
    oppositesARomaji,
    oppositeFadeInAnswers,

    choiceN,
    wideMode,
    easyMode,
    charSet,

    particlesARomaji,
    particleFadeInAnswer,

    vocabList,
    kanjiTagObj,
    phraseList,
    KanjiList: kanjiList,

    vocabMeta,
    phraseMeta,
    kanjiMeta,
  };
}
