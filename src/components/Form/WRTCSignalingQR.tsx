import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  Typography,
} from "@mui/material";
import { GearIcon, XIcon } from "@primer/octicons-react";
import {
  QRCodeDecoderErrorCorrectionLevel,
  QRCodeEncoder,
} from "@zxing/library";
import brotli from "brotli-wasm";
import classNames from "classnames";
import {
  JSX,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { VideoDevicesMenu } from "./VideoDevicesMenu";
import { WebRTCContext } from "../../context/webRTC";
import { DebugLevel } from "../../helper/consoleHelper";
import { urlBase64ToUint8Array } from "../../helper/cryptoHelper";
import { sdpExpand, sdpShrink } from "../../helper/webRTCMiniSDP";
import { useQRCode } from "../../hooks/useQRCode";
import { useWebRTCSignaling } from "../../hooks/useWebRTCSignaling";
import { logger } from "../../slices/globalSlice";
import "../../css/WRTCSignalingQR.css";
import { ValuesOf } from "../../typings/utils";

interface WRTCSignalingQRProps {
  close: () => void;
}

export function WRTCSignalingQR(props: WRTCSignalingQRProps) {
  const dispatch = useDispatch();
  const { close } = props;
  const {
    setRtcChannel,
    setDirection,
    pushMsg: onMessage,
  } = useContext(WebRTCContext);

  const [transaction, setTransaction] = useState<
    "genOffer" | "readOffer" | "genAnswer" | "readAnswer" | null
  >(null);

  const changeTrans = useCallback((t: typeof transaction) => {
    setTransaction(t);
    if (t === "readOffer" || t === "readAnswer") {
      setShowAvailableDevicesMenu(true);
    }
  }, []);

  const [warning, setWarning] = useState<ReactElement[]>([]);

  const [showAvailableDevicesMenu, setShowAvailableDevicesMenu] =
    useState(false);
  const showKeyInputCB = useCallback(() => {
    setShowAvailableDevicesMenu(true);
  }, []);
  const closeDeviceMenuCB = useCallback(() => {
    setShowAvailableDevicesMenu(false);
  }, []);

  // const showDoneConfirmation = useCallback(() => {
  //   // setFinished(true);
  // }, []);

  // const addWarning = useCallback(
  //   (warnKey?: string, warnMsg?: string) => {
  //     if (warnKey === undefined && warnMsg === undefined) {
  //       setWarning([]);
  //       return;
  //     }

  //     if (warning.find((w) => w.key === warnKey) === undefined) {
  //       setWarning((w) => [...w, <span key={warnKey}>{warnMsg}</span>]);
  //     }
  //   },
  //   [warning, setWarning]
  // );

  const [qrCodeEl, setQrCodeEl] = useState<JSX.Element | null>(null);

  const [activeDevice, setActiveDevice] = useState<string | null>(null);

  const loggerCB = useCallback(
    (msg: string, lvl?: ValuesOf<typeof DebugLevel>) =>
      dispatch(logger(msg, lvl)),
    [dispatch]
  );
  const { encode, decode, getDevices, selectDevice, view, stopCapture } =
    useQRCode({ w: 300, h: 300, loggerCB });

  const handleOffer = (sdp: string) => {
    // after create offer
    // ...
    void sdpToQr(sdp, encode).then((offerEl) => {
      setQrCodeEl(offerEl);
      changeTrans("genOffer");
    });
  };

  const onAnswer = useCallback(
    (sdp: string) => {
      // console.log(`ANSWER: ${sdp}`);
      dispatch(logger("sdp: " + sdp.slice(0, 30), DebugLevel.WARN));
      void sdpToQr(sdp, encode).then((answerEl) => {
        setQrCodeEl(answerEl);
        changeTrans("genAnswer");
      });
    },
    [dispatch, encode, changeTrans]
  );

  const resetCB = useCallback(() => {
    setQrCodeEl(null);
    setTransaction(null);
    stopCapture();
    setWarning([]);
  }, [stopCapture]);

  const closeHandlerCB = useCallback(() => {
    resetCB();
    close();
  }, [close, resetCB]);

  const {
    status,
    createOffer,
    offerReadyHandler,
    answerReadyHandler,
    dcChannel,
  } = useWebRTCSignaling(onMessage, handleOffer);

  useEffect(() => {
    if (status === "connected") {
      const channel = dcChannel.current;
      if (channel !== null) {
        resetCB();
        setRtcChannel(channel);
      }
    }
  }, [status, dcChannel, setRtcChannel, resetCB]);

  const decodeQRCB = useCallback(() => {
    void decode()
      .then((response) => {
        void qrToSDP(response).then((sdp) => {
          if (transaction === "readOffer") {
            // console.log(`OFFER: ${sdp}`);
            offerReadyHandler(sdp, onAnswer);
            setDirection("incoming");
          } else if (transaction === "readAnswer") {
            // console.log(`ANSWER: ${sdp}`);
            answerReadyHandler(sdp);
          }
        });
      })
      .catch(({ message }) => {
        dispatch(logger("decode failed", 1));

        const msg =
          typeof message === "string" ? message : JSON.stringify(message);
        dispatch(logger(msg, DebugLevel.ERROR));
      });
  }, [
    dispatch,
    decode,
    onAnswer,
    offerReadyHandler,
    answerReadyHandler,
    transaction,
    setDirection,
  ]);

  const selectDeviceHandlerCB = useCallback(
    (id: string) => {
      void selectDevice(id)
        .then(() => {
          setActiveDevice(id);
        })
        .catch((err) => {
          setActiveDevice(null);

          dispatch(logger("select failed:", DebugLevel.ERROR));
          dispatch(logger(JSON.stringify(err), DebugLevel.ERROR));
        });
    },
    [dispatch, selectDevice]
  );

  return (
    <>
      <VideoDevicesMenu
        visible={showAvailableDevicesMenu}
        getDevices={getDevices}
        activeDevice={activeDevice}
        selectDeviceHandler={selectDeviceHandlerCB}
        closeHandler={closeDeviceMenuCB}
      />
      <Dialog
        open={status !== "connected"}
        onClose={closeHandlerCB}
        aria-label="WebRTC Session Description Exchange"
        fullWidth={true}
      >
        <DialogContent className="p-0 m-0">
          <div className="d-flex justify-content-between">
            <div className="d-flex flex-column">
              <div className="p-2 clickable" onClick={closeHandlerCB}>
                <XIcon />
              </div>
              {/* {(transaction === "genOffer" || transaction === "genAnswer") && (
                <div className="pt-4 p-2">
                  <span>
                    {(transaction === "genOffer" && "Offer:") ||
                      transaction === "genAnswer" ||
                      "Answer:"}
                  </span>
                </div>
              )} */}
            </div>
            {(transaction === "readOffer" || transaction === "readAnswer") && (
              <div className="position-relative" onClick={decodeQRCB}>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  className="p-0 m-1"
                  disabled={activeDevice === null}
                  onClick={decodeQRCB}
                >
                  {view}
                </Button>
                {activeDevice !== null && (
                  <div className="position-absolute bottom-15 end-5 color-error">
                    <Typography color="error">
                      <span className="fs-x-small">Capture</span>
                    </Typography>
                  </div>
                )}
              </div>
            )}
            {(transaction === "genOffer" || transaction === "genAnswer") && (
              <div className="bg-light">{qrCodeEl}</div>
            )}

            <div className="d-flex flex-column p-2">
              <div className="text-end" onClick={showKeyInputCB}>
                <GearIcon className="me-1" />
              </div>

              <div className="d-flex flex-column pt-3 text-end">
                <div
                  className={classNames({
                    "pb-3": true,
                    "opacity-50": transaction === "readOffer",
                  })}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={transaction !== null}
                    onClick={createOffer}
                  >
                    Make Offer
                  </Button>
                </div>
                <div
                  className={classNames({
                    "pb-3": true,
                    "opacity-50": transaction === "genOffer",
                  })}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={transaction !== null}
                    onClick={() => {
                      changeTrans("readOffer");
                    }}
                  >
                    Read Offer
                  </Button>
                </div>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={transaction !== "genOffer"}
                  onClick={() => {
                    changeTrans("readAnswer");
                  }}
                >
                  Read Answer
                </Button>
              </div>
            </div>
          </div>
          {warning.length > 0 && (
            <Alert severity="warning" className="py-0 mb-1">
              <div className="p-0 d-flex flex-column">
                <ul className="mb-0">
                  {warning.map((el) => (
                    <li key={el.key}>{el}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

async function qrToSDP(qrMsgBase64: string) {
  const compressedBuf = urlBase64ToUint8Array(qrMsgBase64);
  const bytesBuf = (await brotli).decompress(Buffer.from(compressedBuf));
  const sdpStr = Buffer.from(bytesBuf).toString();
  // FIXME: validate the sdp string

  const sdp = sdpExpand(sdpStr);

  return sdp;
}

async function sdpToQr(sdp: string, encode: (text: string) => JSX.Element) {
  const shrinkTxt = sdpShrink(sdp);

  const shrinkBuf = (await brotli).compress(Buffer.from(shrinkTxt), {
    quality: 10,
  });
  const shrinkS = Buffer.from(shrinkBuf).toString("base64");

  // needs:
  // npm i pako --no-save
  // npm i @types/pako --save-dev --no-save
  // npm i @zxing/library --no-save
  // void compareQRCompressions(sdp);

  return encode(shrinkS);
}

/**
 * Compare pako, brotli, and my shrink() + brotli
 * @NOTE DEBUG purposes only
 * @param sdp WebRTC Session Description Protocol params
 */
/*
async function compareQRCompressions(sdp: string) {
  const pako = deflate(sdp, { level: 9 });
  const pakoS = Buffer.from(pako).toString("base64");

  const brot = (await brotli).compress(Buffer.from(sdp), { quality: 10 });
  const brotS = Buffer.from(brot).toString("base64");

  const shrinkTxt = sdpShrink(sdp);

  const shrinkBuf = (await brotli).compress(Buffer.from(shrinkTxt), {
    quality: 10,
  });
  const shrinkS = Buffer.from(shrinkBuf).toString("base64");

  // https://github.com/zxing-js/library/blob/master/src/test/core/qrcode/encoder/Encoder.spec.ts
  const pakoQr = QRCodeEncoder.encode(
    pakoS,
    QRCodeDecoderErrorCorrectionLevel.H
  );
  const brotQr = QRCodeEncoder.encode(
    brotS,
    QRCodeDecoderErrorCorrectionLevel.H
  );
  const shrinkQr = QRCodeEncoder.encode(
    shrinkS,
    QRCodeDecoderErrorCorrectionLevel.H
  );

  // eslint-disable-next-line no-console
  console.log("Comparison of pako, brotli, and my shrink() + brotli");

  // eslint-disable-next-line no-console
  console.table({
    ["pako"]: {
      ["sdp"]: sdp.length,
      ["buf"]: pako.length,
      ["base64"]: pakoS.length,
      ["qr"]: `${pakoQr.getMatrix().getWidth()}x${pakoQr.getMatrix().getHeight()}`,
    },
    ["brotli"]: {
      ["sdp"]: sdp.length,
      ["buf"]: brot.length,
      ["base64"]: brotS.length,
      ["qr"]: `${brotQr.getMatrix().getWidth()}x${brotQr.getMatrix().getHeight()}`,
    },
    ["shrink+brotli"]: {
      ["sdp"]: `${sdp.length}>>${shrinkTxt.length}`,
      ["buf"]: shrinkBuf.length,
      ["base64"]: shrinkS.length,
      ["qr"]: `${shrinkQr.getMatrix().getWidth()}x${shrinkQr.getMatrix().getHeight()}`,
    },
  });
}
*/