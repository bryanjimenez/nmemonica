import { Button, Dialog, DialogContent, Typography } from "@mui/material";
import { DeviceCameraVideoIcon } from "@primer/octicons-react";
import brotli from "brotli-wasm";
import classNames from "classnames";
import { JSX, useCallback, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Warnings } from "./DialogMsg";
import { VideoDevicesPermission } from "./VideoDevicesPermission";
import { WebRTCContext } from "../../context/webRTC";
import { DebugLevel } from "../../helper/consoleHelper";
import { sdpExpand, sdpShrink } from "../../helper/webRTCMiniSDP";
import { useQRCode } from "../../hooks/useQRCode";
import { useWebRTCSignaling } from "../../hooks/useWebRTCSignaling";
import { logger } from "../../slices/globalSlice";
import "../../css/WRTCSignalingQR.css";

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
    closeWebRTC,
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

  const [warning, setWarning] = useState<{ key?: string; msg?: string }[]>([]);

  const [showAvailableDevicesMenu, setShowAvailableDevicesMenu] =
    useState(false);

  const addWarning = useCallback(
    (warnKey?: string, warnMsg?: string) => {
      if (warnKey === undefined && warnMsg === undefined) {
        setWarning([]);
        return;
      }

      setWarning((w) => {
        if (w.find((w) => w.key === warnKey) === undefined) {
          return [...w, { key: warnKey, msg: warnMsg }];
        }

        return w;
      });
    },
    [setWarning]
  );

  const [qrCodeEl, setQrCodeEl] = useState<JSX.Element | null>(null);

  const [activeDevice, setActiveDevice] = useState<string | null>(null);

  const { encode, decode, getDevices, selectDevice, view, stopCapture } =
    useQRCode({ w: 300, h: 300 });

  const declinePermission = useCallback(
    (msg: string) => {
      if (transaction === "readOffer") {
        setTransaction(null);
      } else if (transaction === "readAnswer") {
        setTransaction("genOffer");
      }
      setActiveDevice(null);
      stopCapture();
      setShowAvailableDevicesMenu(false);
      addWarning("Video device:" + msg, msg);
    },
    [transaction, setActiveDevice, stopCapture, addWarning]
  );

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

  const {
    status,
    createOffer,
    offerReadyHandler,
    answerReadyHandler,
    dataChannel,
  } = useWebRTCSignaling(onMessage, handleOffer);

  const displayOfferQR = useCallback(() => {
    createOffer();
    setWarning([]);
  }, [createOffer]);

  const closeHandlerCB = useCallback(() => {
    resetCB();
    close();

    // when connected, dialog "hides"
    if (status !== "connected") {
      closeWebRTC();
    }
  }, [status, close, resetCB, closeWebRTC]);

  useEffect(() => {
    if (status === "connected") {
      const channel = dataChannel.current;
      if (channel !== null) {
        resetCB();
        setRtcChannel(channel);
      }
    }
  }, [status, dataChannel, setRtcChannel, resetCB]);

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
        addWarning(/** clear */);
      })
      .catch((err) => {
        if (err instanceof Error && err.message) {
          addWarning("QR decode", err.message);
        } else {
          addWarning("QR decode", "QR Code decode failed, try again");
          const aMsg = JSON.stringify(err);
          if (aMsg !== "{}") {
            dispatch(logger(JSON.stringify(err), DebugLevel.ERROR));
          }
        }
      });
  }, [
    dispatch,
    decode,
    onAnswer,
    offerReadyHandler,
    answerReadyHandler,
    transaction,
    setDirection,
    addWarning,
  ]);

  const selectDeviceHandlerCB = useCallback(
    (id: string) => {
      void selectDevice(id)
        .then(() => {
          setActiveDevice(id);
          setShowAvailableDevicesMenu(false);
          addWarning(/** clear */);
        })
        .catch((err) => {
          if (err instanceof Error) {
            declinePermission(err.message);
          } else {
            declinePermission("Failed to select video device");
          }
          dispatch(logger(JSON.stringify(err), DebugLevel.ERROR));
        });
    },
    [dispatch, selectDevice, declinePermission, addWarning]
  );

  return (
    <>
      <VideoDevicesPermission
        visible={showAvailableDevicesMenu}
        getDevices={getDevices}
        activeDevice={activeDevice}
        accept={selectDeviceHandlerCB}
        decline={declinePermission}
      />
      <Dialog
        open={status !== "connected"}
        onClose={closeHandlerCB}
        aria-label="WebRTC Session Description Exchange"
      >
        <DialogContent className="p-0 m-0">
          <Warnings
            fileWarning={warning.map((el) => (
              <span key={el.key}>{el.msg}</span>
            ))}
            clearWarnings={setWarning}
          />
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2">
              <div className="col p-0">
                {(transaction === null ||
                  transaction === "readOffer" ||
                  transaction === "readAnswer") && (
                  <Button
                    variant="text"
                    color="error"
                    className="p-0 m-0 mx-1 position-relative"
                    disabled={activeDevice === null}
                    onClick={decodeQRCB}
                  >
                    {view}
                    {activeDevice !== null && (
                      <div className="position-absolute bottom-15 end-5">
                        <Typography color="error">
                          <span className="fs-x-small fw-bolder opacity-50">
                            Capture
                          </span>
                        </Typography>
                      </div>
                    )}
                  </Button>
                )}
                {(transaction === "genOffer" ||
                  transaction === "genAnswer") && (
                  <Button
                    variant="text"
                    color="success"
                    className="p-0 m-0 mx-1"
                    // onClick={TODO: downloadQr}
                  >
                    <div className="bg-light">{qrCodeEl}</div>
                  </Button>
                )}
              </div>

              <div className="col d-flex flex-column p-2">
                <div
                  className={classNames({
                    "pt-0 px-1 clickable text-end": true,
                    "incorrect-color": activeDevice !== null,
                    invisible:
                      transaction !== "readAnswer" &&
                      transaction !== "readOffer",
                  })}
                  onClick={() => setShowAvailableDevicesMenu(true)}
                >
                  <DeviceCameraVideoIcon className="mirror-x" />
                </div>
                <div className="d-flex flex-column pt-0 pt-sm-3 text-start text-sm-end">
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
                      onClick={displayOfferQR}
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
                  <div>
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

async function qrToSDP(qrMsgBase64: string) {
  const compressedBuf = Buffer.from(qrMsgBase64, "base64");
  const bytesBuf = (await brotli).decompress(Buffer.from(compressedBuf));
  const sdpStr = Buffer.from(bytesBuf).toString();

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
