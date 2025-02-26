import { createContext, useCallback, useState } from "react";

// https://legacy.reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down
// https://react.dev/reference/react/createContext

export const WebRTCContext = createContext<{
  rtcChannel: RTCDataChannel | null;
  setRtcChannel: React.Dispatch<React.SetStateAction<RTCDataChannel | null>>;
  direction: "incoming" | "outgoing";
  setDirection: React.Dispatch<React.SetStateAction<"incoming" | "outgoing">>;
  pushMsg: (m: MessageEvent<string>) => void;
}>({
  rtcChannel: null,
  setRtcChannel: () => {},
  direction: "outgoing",
  setDirection: () => {},
  pushMsg: () => {},
});

export function WebRTCProvider(props: React.PropsWithChildren) {
  const { children } = props;

  const [rtcChannel, setRtcChannel] = useState<RTCDataChannel | null>(null);
  const [direction, setDirection] = useState<"incoming" | "outgoing">(
    "outgoing"
  );

  const [_msg, setMsg] = useState<MessageEvent<string>[]>([]);

  const pushMsg = useCallback(
    (m: MessageEvent<string>) => {
      setMsg((prev) => [...prev, m]);
    },
    [setMsg]
  );

  return (
    <WebRTCContext.Provider
      value={{ rtcChannel, setRtcChannel, direction, setDirection, pushMsg }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}
