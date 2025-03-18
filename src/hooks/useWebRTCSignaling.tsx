import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { WebRTCContext } from "../context/webRTC";
import { getSDPMaxSize } from "../helper/webRTCMiniSDP";

function initDataChannel(
  channel: React.RefObject<RTCDataChannel | null>,
  messageHandler: (m: MessageEvent<string>) => void
) {
  channel.current?.addEventListener("message", messageHandler);
}

/**
 * Hook for WebRTC Signaling (no service)
 */
export function useWebRTCSignaling(
  msgHandler: (m: MessageEvent<string>) => void,

  handleOffer: (sdp: string) => void,

  log?: (msg: string) => void
) {

  const pc = useRef(new RTCPeerConnection());
  const [status, setStatus] = useState<RTCPeerConnection["iceConnectionState"]>(
    pc.current.iceConnectionState
  );
  const pcPrevRef = useRef(pc.current);
  const dcChannel = useRef<RTCDataChannel>(null);

  const logREF = useRef(log);

  const msgHandlerRef = useRef(msgHandler);

  const { setMaxMsgSize } = useContext(WebRTCContext);

  useEffect(
    () => {
      const { current: messageHandl } = msgHandlerRef;

      const pcCopy = pc.current;
      const dataChanHandl = (e: RTCDataChannelEvent) => {
        dcChannel.current = e.channel;

        if (pc.current.iceConnectionState === "connected") {
          setStatus(pc.current.iceConnectionState);
        }

        initDataChannel(dcChannel, messageHandl);
      };
      const connStateHandl = (ev: Event) => {
        const { iceConnectionState: iceStatus } =
          ev.currentTarget as RTCPeerConnection;

        if (dcChannel.current === null && iceStatus === "connected") {
          return;
        }

        setStatus(iceStatus);
      };

      pcCopy.addEventListener("datachannel", dataChanHandl);
      pcCopy.addEventListener("connectionstatechange", connStateHandl);

      return () => {
        pcCopy.removeEventListener("datachannel", dataChanHandl);
        pcCopy.removeEventListener("connectionstatechange", connStateHandl);
      };
    },
    [
      /* Initial Load */
    ]
  );

  const createOffer = useCallback(() => {
    const { current: writeLog } = logREF;

    dcChannel.current = pc.current.createDataChannel("data");
    initDataChannel(dcChannel, msgHandler);
    void pc.current
      .createOffer()
      .then((sdp) => pc.current.setLocalDescription(sdp))
      .catch(writeLog);

    const iceHandler = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) return;

      if (pc.current.localDescription !== null) {
        const { sdp } = pc.current.localDescription;

        const maxSize = getSDPMaxSize(sdp);
        setMaxMsgSize(Number(maxSize));

        handleOffer(pc.current.localDescription.sdp);
      }
    };

    pcPrevRef.current.removeEventListener("icecandidate", iceHandler);
    pcPrevRef.current = pc.current;
    pc.current.addEventListener("icecandidate", iceHandler);
  }, [handleOffer, msgHandler, setMaxMsgSize]);

  const offerReadyHandler = useCallback(
    (sdp: string, answer: (sdp: string) => void) => {
      const { current: writeLog } = logREF;

      if (pc.current.signalingState !== "stable") return;

      const desc = new RTCSessionDescription({
        type: "offer",
        sdp,
      });

      const iceHandler = (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate) return;

        if (pc.current !== null && pc.current.localDescription !== null) {
          answer(pc.current.localDescription.sdp);
        }
      };

      void pc.current
        .setRemoteDescription(desc)
        .then(() => pc.current.createAnswer())
        .then((d) => pc.current.setLocalDescription(d))
        .catch(writeLog);

      pc.current.addEventListener("icecandidate", iceHandler);
    },
    []
  );

  const answerReadyHandler = useCallback((sdp: string) => {
    if (pc.current.signalingState !== "have-local-offer") return;

    const { current: writeLog } = logREF;

    const desc = new RTCSessionDescription({
      type: "answer",
      sdp,
    });
    void pc.current.setRemoteDescription(desc).catch(writeLog);
  }, []);

  return {
    dcChannel,
    status,

    createOffer,
    offerReadyHandler,
    answerReadyHandler,
  };
}
