import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";

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

  const [oppositesQRomaji, oppositesARomaji, oppositeFadeInAnswers] =
    useSelector<RootState, boolean[]>(({ opposite }: RootState) => {
      const { qRomaji, aRomaji, fadeInAnswers } = opposite;
      return [qRomaji, aRomaji, fadeInAnswers];
    }, shallowEqual);

  const [particlesARomaji, particleFadeInAnswer] = useSelector<
    RootState,
    boolean[]
  >(({ particle }: RootState) => {
    const { aRomaji, fadeInAnswers } = particle.setting;
    return [aRomaji, fadeInAnswers];
  }, shallowEqual);

  return {
    darkMode,
    swipeThreshold,
    motionThreshold,
    memory,
    debug,

    oppositesQRomaji,
    oppositesARomaji,
    oppositeFadeInAnswers,

    particlesARomaji,
    particleFadeInAnswer,
  };
}
