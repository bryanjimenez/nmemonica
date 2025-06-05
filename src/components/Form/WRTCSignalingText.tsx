import {
  Button,
  Dialog,
  DialogContent,
  InputAdornment,
  TextField,
} from "@mui/material";
import md5 from "md5";
import {
  JSX,
  KeyboardEventHandler,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { WebRTCContext } from "../../context/webRTC";
import { useWebRTCSignaling } from "../../hooks/useWebRTCSignaling";
import { logger } from "../../slices/globalSlice";

interface WRTCSignalingTextProps {
  close: () => void;
}

function enterPressed(e: React.KeyboardEvent<unknown>) {
  return e.code === "Enter" || e.keyCode === 13;
}

function updateChat(
  stateSetter: React.Dispatch<React.SetStateAction<JSX.Element[]>>,
  el: JSX.Element
) {
  stateSetter((prev) => [...prev, el]);
}

export function WRTCSignalingText(props: WRTCSignalingTextProps) {
  const dispatch = useDispatch();
  const { close } = props;
  const {
    setRtcChannel,
    setDirection,
    pushMsg: onMessage,
    closeWebRTC,
  } = useContext(WebRTCContext);

  // const [warning, setWarning] = useState<ReactElement[]>([]);

  const offerEl = useRef<HTMLTextAreaElement>(null);
  const answerEl = useRef<HTMLTextAreaElement>(null);
  const chatEl = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<JSX.Element[]>([]);

  const onAnswer = useCallback((sdp: string) => {
    if (answerEl.current !== null) {
      answerEl.current.value = sdp;
      answerEl.current.select();
    }
  }, []);

  const onOffer = useCallback((sdp: string) => {
    if (offerEl.current !== null) {
      offerEl.current.value = sdp;
      offerEl.current.select();
    }
  }, []);

  // const chatReady = useCallback(() => {
  //   chatEl.current?.focus();
  // }, []);

  const _onMsgChatHandler = useCallback((m: MessageEvent<string>) => {
    setMessages((prev) => [
      ...prev,
      <div key={md5(String(m.timeStamp))} className="text-start">
        {m.data}
      </div>,
    ]);
  }, []);

  const {
    status,
    createOffer,
    offerReadyHandler,
    answerReadyHandler,
    dataChannel,
  } = useWebRTCSignaling(onMessage, onOffer);

  const closeHandlerCB = useCallback(() => {
    // setWarning([]);
    close();
    // when connected, dialog "hides"
    if (status !== "connected") {
      closeWebRTC();
    }
  }, [status, close, closeWebRTC]);

  useEffect(() => {
    if (status === "connected") {
      const channel = dataChannel.current;
      if (channel !== null) {
        setRtcChannel(channel);
      }
    }
  }, [status, dataChannel, setRtcChannel]);

  const offerKHandl: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (!enterPressed(e)) return;

      const sdp = `${offerEl.current?.value.trim()}\n`;
      if (sdp.split("\n").length < 5) {
        // TODO: verify requirements
        dispatch(logger("Invalid offer"));
        return;
      }

      offerReadyHandler(sdp, onAnswer);
      setDirection("incoming");
    },
    [dispatch, offerReadyHandler, onAnswer, setDirection]
  );

  const answerKHandl: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (!enterPressed(e)) return;

      const sdp = `${answerEl.current?.value.trim()}\n`;
      if (sdp.split("\n").length < 5) {
        // TODO: verify requirements
        dispatch(logger("Invalid answer"));
        return;
      }

      answerReadyHandler(sdp);
    },
    [dispatch, answerReadyHandler]
  );

  const chatKHandl = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (chatEl.current && chatEl.current.value) {
        const m = chatEl.current?.value;
        dataChannel.current?.send(m);

        updateChat(
          setMessages,
          <div key={md5(String(Date.now()))} className={"text-end"}>
            {m}
          </div>
        );
      }

      if (chatEl.current !== null) {
        chatEl.current.value = "";
      }
    },
    [dataChannel]
  );

  return (
    <>
      <Dialog
        open={true}
        onClose={closeHandlerCB}
        aria-label="WebRTC Session Description Exchange"
        fullWidth={true}
      >
        <DialogContent className="p-2 m-0">
          <div className="px-3">{status}</div>
          <div className="d-flex p-3">
            <div className="row d-flex flex-row w-50">
              <div className="d-flex flex-column justify-content-between">
                {status !== "connected" && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={status !== "new"}
                      className="m-0"
                      onClick={createOffer}
                    >
                      Gen Offer
                    </Button>
                    <div>.</div>

                    <TextField
                      inputRef={offerEl}
                      className="w-100"
                      // error={warning.length > 0}
                      size="small"
                      label="Offer"
                      variant="outlined"
                      aria-label="Offer Key"
                      multiline
                      rows={4}
                      onKeyUp={offerKHandl}
                      sx={{
                        ".MuiInputBase-input": {
                          fontFamily: "Ubuntu Mono",
                          padding: "0",
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">{}</InputAdornment>
                        ),
                      }}
                    />
                    <div>.</div>
                    <TextField
                      inputRef={answerEl}
                      // error={warning.length > 0}
                      size="small"
                      label="Answer"
                      variant="outlined"
                      aria-label="Answer Key"
                      multiline
                      rows={4}
                      onKeyUp={answerKHandl}
                      sx={{
                        ".MuiInputBase-input": {
                          fontFamily: "Ubuntu Mono",
                          padding: "0",
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">{}</InputAdornment>
                        ),
                      }}
                    />
                  </>
                )}
                {status === "connected" && (
                  <div>
                    <Button
                      variant="outlined"
                      size="small"
                      className="m-0"
                      onClick={closeWebRTC}
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
                <div>.</div>
                <form onSubmit={chatKHandl}>
                  <TextField
                    inputRef={chatEl}
                    className="w-100"
                    size="small"
                    label="Chat"
                    variant="outlined"
                    aria-label="Enter Messages here"
                    disabled={
                      status !== "connected" &&
                      offerEl.current?.value.length === 0 &&
                      answerEl.current?.value.length === 0
                    }
                    sx={{
                      ".MuiInputBase-input": {
                        fontFamily: "Ubuntu Mono",
                        padding: "0",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">{}</InputAdornment>
                      ),
                    }}
                  />
                </form>
              </div>
            </div>
            <div className="w-50 px-3">{messages}</div>
          </div>
          <div></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
