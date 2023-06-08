import { shallowEqual, useSelector } from "react-redux";

/**
 * KanaGame app-state props
 */
export function useConnectKana() {
  const debug = useSelector(
    (/** @type {RootState}*/ { global }) => global.debug
  );

  const [hiragana, katakana, vowels, consonants, sounds] = useSelector(
    (/** @type {RootState}*/ { kana }) => {
      const { hiragana, katakana, vowels, consonants, sounds } = kana;

      return /** @type {[typeof hiragana, typeof katakana, typeof vowels, typeof consonants, typeof sounds]}*/ ([
        hiragana,
        katakana,
        vowels,
        consonants,
        sounds,
      ]);
    },
    () => true
  );

  const [wideMode, easyMode, charSet, choiceN] = useSelector(
    (/** @type {RootState}*/ { kana }) => {
      const { wideMode, easyMode, charSet, choiceN } = kana.setting;
      return /** @type {[typeof wideMode, typeof easyMode, typeof charSet, typeof choiceN]} */ ([
        wideMode,
        easyMode,
        charSet,
        choiceN,
      ]);
    },
    shallowEqual
  );

  const choiceNum = wideMode ? 31 : choiceN;

  return {
    debug,
    hiragana,
    katakana,
    vowels,
    consonants,
    sounds,
    choiceN: choiceNum,
    wideMode,
    easyMode,
    charSet,
  };
}