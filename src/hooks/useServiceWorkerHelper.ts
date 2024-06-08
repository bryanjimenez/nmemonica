import { useCallback } from "react";

import { SWMsgOutgoing, SWVersionInfo } from "../helper/serviceWorkerHelper";

export function useSWMessageVersionEventHandler(
  setSwVersion: React.Dispatch<React.SetStateAction<string>>,
  setJsVersion: React.Dispatch<React.SetStateAction<string>>,
  setBundleVersion: React.Dispatch<React.SetStateAction<string>>
) {
  /** swMessageEventListenerCB Callback*/
  const swMessageEventListenerCB = useCallback(
    (event: MessageEvent) => {
      const { type } = event.data as { type: string; error: string };
      if (type === SWMsgOutgoing.SW_GET_VERSIONS) {
        const { swVersion, jsVersion, bundleVersion } =
          event.data as SWVersionInfo;

        setSwVersion(swVersion);
        setJsVersion(jsVersion);
        setBundleVersion(bundleVersion);
      }
    },
    [setSwVersion, setJsVersion, setBundleVersion]
  );

  return swMessageEventListenerCB;
}
