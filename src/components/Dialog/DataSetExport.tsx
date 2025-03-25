import { Button, Dialog, DialogContent } from "@mui/material";
import {
  ArrowSwitchIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  DatabaseIcon,
  FileDirectoryIcon,
  UploadIcon,
} from "@primer/octicons-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { DataSetFromAppCache } from "../Form/DataSetFromAppCache";
import { DataSetFromDragDrop, TransferObject } from "../Form/DataSetFromDragDrop";
import {
  type DataSetSharingAction,
  RTCTransferRequired,
} from "../Form/DataSetSharingActions";
import { WebRTCContext } from "../../context/webRTC";
import {
  dataTransferAggregator,
  plainTransfer,
  sendChunkedMessage,
} from "../../helper/webRTCDataTrans";

interface DataSetExportProps extends DataSetSharingAction {
  close: () => void;
}

function errorHandler(ev: RTCErrorEvent) {
  const { message } = ev.error;

  // OperationError
  if (message === "User-Initiated Abort, reason=Close called") {
    return;
  }

  throw new Error("Unexpected error during transmission");
}

// function messageHandler(msg: { data: string }) {
//   console.log("got a message");
//   console.log(msg);
// }

export function DataSetExport(props: DataSetExportProps) {
  const { close } = props;

  const { peer, rtcChannel, direction, maxMsgSize, closeWebRTC } =
    useContext(WebRTCContext);
  const connection = useRef({ channel: rtcChannel, peer: peer.current });

  useEffect(
    () => {
      const { channel: copyChannel, peer: copyPeer } = connection.current;

      if (copyChannel === null || copyPeer === null) {
        return () => {};
      }

      copyChannel.addEventListener("error", errorHandler);
      // copyChannel.addEventListener("message", messageHandler);

      const closeHandler = (ev: Event) => {
        const { iceConnectionState: iceStatus } =
          ev.currentTarget as RTCPeerConnection;

        if (iceStatus === "closed" || iceStatus === "disconnected") {
          closeHandlerCB();
        }
      };
      copyPeer.addEventListener("connectionstatechange", closeHandler);

      return () => {
        if (copyChannel === null) {
          return;
        }

        copyChannel.removeEventListener("error", errorHandler);
        copyPeer.removeEventListener("connectionstatechange", closeHandler);
        // copyChannel.removeEventListener("message", messageHandler);
      };
    },
    [
      /** only on mount dismount */
    ]
  );

  const [source, setSource] = useState<"FileSystem" | "AppCache">("AppCache");
  const sourceFileSysCB = useCallback(() => {
    setSource("FileSystem");
  }, []);
  const sourceAppCacheCB = useCallback(() => {
    setSource("AppCache");
  }, []);

  const [fileData, setFileData] = useState<TransferObject[]>([]);
  const [finished, setFinished] = useState(false);

  const closeHandlerCB = useCallback(() => {
    setFileData([]);
    close();
    setFinished(false);
    closeWebRTC();
  }, [close, closeWebRTC]);

  const fromAppCacheUpdateDataCB = useCallback((name: string) => {
    setFileData((prev) => {
      let newPrev: TransferObject[] = [];
      // if is not in state add it
      if (prev.find((p) => p.name === name) === undefined) {
        // text is added for all on final action trigger (btn)
        newPrev = [...prev, { name, origin: "AppCache", text: "" }];
      } else {
        newPrev = prev.filter((p) => p.name !== name);
      }

      return newPrev;
    });
  }, []);

  const fromFileSysUpdateDataCB = useCallback((item: TransferObject) => {
    setFileData((prev) => {
      if (
        prev.find((p) => p.name.toLowerCase() === item.name.toLowerCase()) ===
        undefined
      ) {
        return [...prev, item];
      } else {
        return prev.filter(
          (p) => p.name.toLowerCase() !== item.name.toLowerCase()
        );
      }
    });
  }, []);

  const exportDataCB = useCallback(() => {
    const { channel } = connection.current;
    if (channel === null) {
      throw new Error(RTCTransferRequired.channel);
    }

    void dataTransferAggregator(fileData)
      // .then((msg) => encryptTransfer(TEMP_FAKE_KEY, msg))
      .then((msg) => plainTransfer(msg))
      .then((buffer) => sendChunkedMessage(channel, buffer, maxMsgSize))
      .then(() => {
        setFinished(true);
      });
  }, [fileData, maxMsgSize]);

  if (direction === "incoming") {
    return null;
  }

  return (
    <>
      <Dialog
        open={true}
        onClose={closeHandlerCB}
        aria-label="File drag drop area"
        fullWidth={true}
      >
        <DialogContent className="p-2 m-0">
          <div className="d-flex justify-content-between">
            <div className="ps-2">
              <span className="fw-light">Sharing </span>
              <ArrowUpIcon className="rotate-45" />
            </div>
            {source === "FileSystem" && (
              <div className="clickable pe-2" onClick={sourceAppCacheCB}>
                <ArrowSwitchIcon className="px-0" /> <DatabaseIcon />
              </div>
            )}
            {source === "AppCache" && (
              <div className="clickable pe-2" onClick={sourceFileSysCB}>
                <FileDirectoryIcon /> <ArrowSwitchIcon className="px-0" />
              </div>
            )}
          </div>
          {source === "AppCache" && (
            <DataSetFromAppCache
              data={fileData}
              updateDataHandler={fromAppCacheUpdateDataCB}
            />
          )}
          {source === "FileSystem" && (
            <DataSetFromDragDrop
              data={fileData}
              updateDataHandler={fromFileSysUpdateDataCB}
            />
          )}

          <div className="d-flex justify-content-end">
            <div className="d-flex">
              <Button
                aria-label="Share Datasets"
                variant="outlined"
                size="small"
                disabled={fileData.length < 1 || finished}
                onClick={exportDataCB}
                style={{ textTransform: "none" }}
              >
                {finished ? (
                  <CheckCircleIcon size="small" className="pe-1" />
                ) : (
                  <UploadIcon size="small" className="pe-1" />
                )}
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
