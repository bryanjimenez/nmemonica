import { useCallback } from "react";

import { SWMsgOutgoing, SWVersionInfo } from "../helper/serviceWorkerHelper";
import type { AppDispatch } from "../slices";
import { logger } from "../slices/globalSlice";
import { DebugLevel } from "../slices/settingHelper";

export function useSWMessageVersionEventHandler(
  dispatch: AppDispatch,
  setSpin: React.Dispatch<React.SetStateAction<boolean>>,
  setHardRefreshUnavailable: React.Dispatch<React.SetStateAction<boolean>>,
  setSwVersion: React.Dispatch<React.SetStateAction<string>>,
  setJsVersion: React.Dispatch<React.SetStateAction<string>>,
  setBundleVersion: React.Dispatch<React.SetStateAction<string>>
) {
  /** swMessageEventListenerCB Callback*/
  const swMessageEventListenerCB = useCallback(
    (event: MessageEvent) => {
      const { type, error } = event.data as { type: string; error: string };
      if (type === SWMsgOutgoing.DO_HARD_REFRESH) {
        if (error) {
          dispatch(logger(error, DebugLevel.ERROR));
        }

        setTimeout(() => {
          setSpin(false);
          setHardRefreshUnavailable(true);
        }, 2000);
      } else if (type === SWMsgOutgoing.SW_VERSION) {
        const { swVersion, jsVersion, bundleVersion } =
          event.data as SWVersionInfo;

        setSwVersion(swVersion);
        setJsVersion(jsVersion);
        setBundleVersion(bundleVersion);
      }
    },
    [
      dispatch,
      setSpin,
      setHardRefreshUnavailable,
      setSwVersion,
      setJsVersion,
      setBundleVersion,
    ]
  );

  return swMessageEventListenerCB;
}
