import { shallowEqual, useSelector } from "react-redux";

import {
  type EnglishVoiceType,
  type JapaneseVoiceType,
} from "../constants/voiceConstants";
import type { RootState } from "../slices";

export function useConnectSetting() {
  const [
    cookies,
    darkMode,
    swipeThreshold,
    motionThreshold,
    debug,
    japaneseVoice,
    englishVoice,
  ] = useSelector<
    RootState,
    [
      boolean,
      boolean,
      number,
      number,
      number,
      JapaneseVoiceType,
      EnglishVoiceType,
    ]
  >(({ global }: RootState) => {
    const {
      cookies,
      darkMode,
      swipeThreshold,
      motionThreshold,
      debug,
      japaneseVoice,
      englishVoice,
    } = global;
    return [
      cookies,
      darkMode,
      swipeThreshold,
      motionThreshold,
      debug,
      japaneseVoice,
      englishVoice,
    ];
  }, shallowEqual);

  const memory = useSelector(
    ({ global }: RootState) => {
      const { memory } = global;
      return memory;
    },
    (before, after) => before.usage === after.usage
  );

  const [oppositeFadeInAnswers] = useSelector<RootState, boolean[]>(
    ({ opposite }: RootState) => {
      const { fadeInAnswers } = opposite;
      return [fadeInAnswers];
    },
    shallowEqual
  );

  const [particleFadeInAnswer] = useSelector<RootState, boolean[]>(
    ({ particle }: RootState) => {
      const { fadeInAnswers } = particle.setting;
      return [fadeInAnswers];
    },
    shallowEqual
  );

  return {
    cookies,
    darkMode,
    swipeThreshold,
    motionThreshold,
    memory,
    debug,
    japaneseVoice,
    englishVoice,

    oppositeFadeInAnswers,

    particleFadeInAnswer,
  };
}
