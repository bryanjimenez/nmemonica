import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../slices";

export function useConnectAudio() {
  const loading = useSelector<RootState, string[]>(({ audio }: RootState) => {
    const { loading } = audio;
    return loading;
  }, shallowEqual);

  return { loadingAudio: loading };
}
