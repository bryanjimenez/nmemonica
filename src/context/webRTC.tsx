import { createContext, useCallback, useRef, useState } from "react";

// https://legacy.reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down
// https://react.dev/reference/react/createContext

export const WebRTCContext = createContext<{
  peer: React.RefObject<RTCPeerConnection | null>;
  rtcChannel: RTCDataChannel | null;
  setRtcChannel: React.Dispatch<React.SetStateAction<RTCDataChannel | null>>;
  direction: "incoming" | "outgoing";
  setDirection: React.Dispatch<React.SetStateAction<"incoming" | "outgoing">>;
  pushMsg: (m: MessageEvent<string>) => void;
  maxMsgSize: number;
  setMaxMsgSize: React.Dispatch<React.SetStateAction<number>>;
  closeWebRTC: () => void;
}>({
  // defaultValue only used if context not within provider
  peer: { current: null },
  rtcChannel: null,
  setRtcChannel: () => {},
  direction: "outgoing",
  setDirection: () => {},
  pushMsg: () => {},
  maxMsgSize: 0,
  setMaxMsgSize: () => {},
  closeWebRTC: () => {},
});

export function WebRTCProvider(props: React.PropsWithChildren) {
  const { children } = props;

  const peer = useRef<RTCPeerConnection>(null);
  const [rtcChannel, setRtcChannel] = useState<RTCDataChannel | null>(null);
  const [direction, setDirection] = useState<"incoming" | "outgoing">(
    "outgoing"
  );
  const [maxMsgSize, setMaxMsgSize] = useState<number>(0);

  const [_msg, setMsg] = useState<MessageEvent<string>[]>([]);

  const pushMsg = useCallback(
    (m: MessageEvent<string>) => {
      setMsg((prev) => [...prev, m]);
    },
    [setMsg]
  );

  const closeWebRTC = useCallback(() => {
    rtcChannel?.close();
    peer.current?.close();

    setRtcChannel(null);
    peer.current = null;
  }, [rtcChannel]);

  return (
    <WebRTCContext.Provider
      value={{
        peer,
        rtcChannel,
        setRtcChannel,
        direction,
        setDirection,
        pushMsg,
        maxMsgSize,
        setMaxMsgSize,
        closeWebRTC,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}
