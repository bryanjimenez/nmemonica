import { shallowEqual, useSelector } from "react-redux";

import data from "../../data/kana.json";
import type { RootState } from "../slices";
import { KanaType } from "../slices/settingHelper";
import type { ValuesOf } from "../typings/raw";

/**
 * KanaGame app-state props
 */
export function useConnectKana() {
  const debug = useSelector(({ global }: RootState) => global.debug);

  const [hiragana, katakana, vowels, consonants, sounds]: [
    string[][],
    string[][],
    string[],
    string[],
    typeof data.sounds
  ] = useSelector(
    ({ kana }: RootState) => {
      const { hiragana, katakana, vowels, consonants, sounds } = kana;

      return [hiragana, katakana, vowels, consonants, sounds];
    },
    () => true
  );

  const [wideMode, easyMode, charSet, choiceN] = useSelector<
    RootState,
    [boolean, boolean, ValuesOf<typeof KanaType>, number]
  >(({ kana }: RootState) => {
    const { wideMode, easyMode, charSet, choiceN } = kana.setting;
    return [wideMode, easyMode, charSet, choiceN];
  }, shallowEqual);

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
