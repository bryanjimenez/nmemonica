import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
} from "@mui/material";
import { ArrowDownIcon } from "@primer/octicons-react";
import {
  type Dispatch,
  ReactElement,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { WebRTCContext } from "../../context/webRTC";
import { decryptAES256GCM } from "../../helper/cryptoHelper";
import { buildMsgCSVError } from "../../helper/csvHelper";
import { metaDataNames } from "../../helper/sheetHelper";
import { type FilledSheetData } from "../../helper/sheetHelperImport";
import {
  type SyncDataFile,
  parseCsvToSheet,
  parseJSONToStudyProgress,
  parseJSONToUserSettings,
} from "../../helper/transferHelper";
import {
  SharingMessageErrorCause,
  receiveChunkedMessageBuilder,
} from "../../helper/webRTCDataTrans";
import { type AppProgressState, type AppSettingState } from "../../slices";
import { type DataSetSharingAction } from "../Form/DataSetSharingActions";
import { properCase } from "../Games/KanjiGame";

export interface CryptoMessage {
  payload: string;
  iv: string;
  tag: string;
}

interface DataSetImportProps extends DataSetSharingAction {
  close: () => void;
  downloadHandler: (
    files: { fileName: string; text: string }[]
  ) => Promise<void>;
  importHandler: (
    workbook?: FilledSheetData[],
    settings?: Partial<AppSettingState>,
    progress?: Partial<AppProgressState>
  ) => Promise<void>;
}

function errorHandler(ev: RTCErrorEvent) {
  const { message } = ev.error;

  // OperationError
  if (message === "User-Initiated Abort, reason=Close called") {
    return;
  }

  throw new Error("Unexpected error during transmission");
}

export function DataSetImport(props: DataSetImportProps) {
  const { close, importHandler, downloadHandler } = props;

  const { peer, rtcChannel, direction, closeWebRTC } =
    useContext(WebRTCContext);
  const connection = useRef({ channel: rtcChannel, peer: peer.current });

  const [destination, setDestination] = useState<"import" | "save">("import");
  const destinationImportCB = useCallback(() => {
    setDestination("import");
  }, []);
  const destinationSaveCB = useCallback(() => {
    setDestination("save");
  }, []);

  const [status, setStatus] = useState<"successStatus" | "dataError">();

  const [warning, setWarning] = useState<ReactElement[]>([]);
  const addWarning = useCallback(
    (warnKey?: string, warnMsg?: string) => {
      if (warnKey === undefined && warnMsg === undefined) {
        setWarning([]);
        return;
      }

      if (warning.find((w) => w.key === warnKey) === undefined) {
        setWarning((w) => [...w, <span key={warnKey}>{warnMsg}</span>]);
      }
    },
    [warning, setWarning]
  );

  const closeHandlerCB = useCallback(() => {
    setStatus(undefined);
    setWarning([]);
    close();
    setMsgBuffer(null);

    closeWebRTC();
  }, [close, closeWebRTC]);

  const [msgBuffer, setMsgBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(
    () => {
      const { channel: copyChannel, peer: copyPeer } = connection.current;

      if (copyChannel === null || copyPeer === null) {
        return () => {};
      }

      copyChannel.addEventListener("error", errorHandler);

      const closeHandler = (ev: Event) => {
        const { iceConnectionState: iceStatus } =
          ev.currentTarget as RTCPeerConnection;

        if (iceStatus === "closed" || iceStatus === "disconnected") {
          closeHandlerCB();
        }
      };
      copyPeer.addEventListener("connectionstatechange", closeHandler);

      const messageHandler = receiveChunkedMessageBuilder(setMsgBuffer);
      copyChannel.addEventListener("message", messageHandler);

      return () => {
        if (copyChannel === null) {
          return;
        }

        copyChannel.removeEventListener("error", errorHandler);
        copyPeer.removeEventListener("connectionstatechange", closeHandler);
        copyChannel.removeEventListener("message", messageHandler);
      };
    },
    [
      /** only on mount dismount */
    ]
  );

  const saveToFileHandlerWStatus = useCallback(
    (
      files: {
        fileName: string;
        text: string;
      }[]
    ) =>
      downloadHandler(files).then(() => {
        setStatus("successStatus");
        setTimeout(closeHandlerCB, 1000);
      }),
    [downloadHandler, setStatus, closeHandlerCB]
  );

  const importToAppHandlerCB = useCallback(
    (
      dataObj: FilledSheetData[],
      settings: Partial<AppSettingState>,
      progress: Partial<AppProgressState>
    ) => {
      const workbook = dataObj.length === 0 ? undefined : dataObj;

      return importHandler(workbook, settings, progress).then(() => {
        setStatus("successStatus");
        setTimeout(closeHandlerCB, 1000);
      });
    },
    [importHandler, setStatus, closeHandlerCB]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const decryptMsgIntoDecryptedFilesCB = useCallback(
    (encryptKey: string, msgBuf: ArrayBuffer) => {
      const msgAsText = new TextDecoder("utf-8").decode(msgBuf);

      let payload: string;
      let iv: string;
      let tag: string;
      try {
        const {
          payload: payloadO,
          iv: ivO,
          tag: tagO,
        } = JSON.parse(msgAsText) as CryptoMessage;
        payload = payloadO;
        iv = ivO;
        tag = tagO;
      } catch {
        throw new Error("Failed to parse message", {
          cause: { code: SharingMessageErrorCause.BadPayload },
        });
      }

      let decryptedText: string;
      try {
        decryptedText = decryptAES256GCM(
          "aes-256-gcm",
          encryptKey,
          iv,
          tag,
          payload
        );
      } catch {
        throw new Error("Failed to decrypt message", {
          cause: { code: SharingMessageErrorCause.BadCryptoKey },
        });
      }

      return parseFileObject(decryptedText, setStatus);
    },
    [setStatus]
  );

  const parseMsgIntoPlainFilesCB = useCallback(
    (msgBuf: ArrayBuffer) => {
      const msgAsText = new TextDecoder("utf-8").decode(msgBuf);

      return parseFileObject(msgAsText, setStatus);
    },
    [setStatus]
  );

  /**
   * RTC Signaling handshake complete
   * Begin messaging
   */
  const initiateTransferCB = useCallback(() => {
    const msgBuf = msgBuffer;
    if (msgBuf === null) {
      throw new Error("Initiate button enabled without receiving data");
    }

    // const fileObj = decryptMsgIntoDecryptedFilesCB(TEMP_FAKE_KEY, msgBuf);
    const fileObj = parseMsgIntoPlainFilesCB(msgBuf);

    if (destination === "save") {
      void saveToFileHandlerWStatus(fileObj);
      return;
    }

    const data = fileObj.filter((file) =>
      file.fileName.toLowerCase().endsWith(".csv")
    );
    const meta = fileObj.filter((file) =>
      file.fileName.toLowerCase().endsWith(".json")
    );

    const { settings, progress } = meta.reduce<{
      settings: Partial<AppSettingState>;
      progress: Partial<AppProgressState>;
    }>(
      (acc, m) => {
        const { fileName, text } = m;

        if (
          fileName.toLowerCase() === metaDataNames.settings.file.toLowerCase()
        ) {
          const parsed = parseJSONToUserSettings(text);

          if (parsed instanceof Error) {
            setStatus("dataError");
            const { key, msg } = buildMsgCSVError(fileName, parsed);
            addWarning(key, msg);
            return acc;
          }

          return { ...acc, settings: parsed };
        } else if (
          fileName.toLowerCase() === metaDataNames.progress.file.toLowerCase()
        ) {
          const parsed = parseJSONToStudyProgress(text);

          if (parsed instanceof Error) {
            setStatus("dataError");
            const { key, msg } = buildMsgCSVError(fileName, parsed);
            addWarning(key, msg);

            return acc;
          }

          return { ...acc, progress: parsed };
        }

        return acc;
      },
      { settings: {}, progress: {} }
    );

    void Promise.allSettled(
      data.map((fileItem) =>
        new Promise<SyncDataFile>((resolve) => resolve(fileItem)).then(
          async ({ text, fileName }) => {
            try {
              const dot = fileName.indexOf(".");
              const sheetName = properCase(
                fileName.slice(0, dot > -1 ? dot : undefined)
              );

              const sheet = await parseCsvToSheet(text, sheetName);
              return sheet;
            } catch (exception) {
              // default message
              let key = `${fileName}-parse`;
              let msg = `Failed to parse (${fileName})`;

              if (exception instanceof Error && "cause" in exception) {
                ({ key, msg } = buildMsgCSVError(fileName, exception));
              }

              setStatus("dataError");
              addWarning(key, msg);
              return undefined;
            }
          }
        )
      )
    )
      .then((sheetPromiseArr) =>
        sheetPromiseArr.reduce<FilledSheetData[]>((acc, r) => {
          if (r.status === "fulfilled" && r.value !== undefined) {
            return [...acc, r.value];
          }

          return acc;
        }, [])
      )
      .then((workbook) => importToAppHandlerCB(workbook, settings, progress));
  }, [
    destination,
    saveToFileHandlerWStatus,
    setStatus,
    addWarning,
    parseMsgIntoPlainFilesCB,
    importToAppHandlerCB,
    msgBuffer,
  ]);

  if (direction === "outgoing") {
    return null;
  }

  return (
    <>
      <Dialog
        open={true}
        onClose={closeHandlerCB}
        aria-label="DataSet Sync import"
      >
        <DialogContent>
          <div className="d-flex justify-content-start">
            <div className="ps-2">
              <span className="fw-light">Sharing </span>
              <ArrowDownIcon className="rotate-45" />
            </div>
          </div>
          <div className="d-flex justify-content-between">
            <span className="pt-2">Action:</span>
            <FormControl>
              <RadioGroup row aria-labelledby="Import destination">
                <FormControlLabel
                  className="m-0"
                  value="Import"
                  control={
                    <Radio
                      size="small"
                      checked={destination === "import"}
                      onChange={destinationImportCB}
                    />
                  }
                  label={<span>Import</span>}
                />
                <FormControlLabel
                  className="m-0"
                  value="Save to file"
                  control={
                    <Radio
                      size="small"
                      checked={destination === "save"}
                      onChange={destinationSaveCB}
                    />
                  }
                  label={<span>Save</span>}
                />
              </RadioGroup>
            </FormControl>
          </div>

          <FormControl className="mt-2 w-100">
            {warning.length > 0 && (
              <Alert severity="warning" className="py-0 mb-2">
                <div className="p-0 d-flex flex-column">
                  <ul className="mb-0">
                    {warning.map((el) => (
                      <li key={el.key}>{el}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}

            {msgBuffer !== null && (
              <div className="fw-bold mb-2">{`Data Received: ${msgBuffer.byteLength}`}</div>
            )}

            <Button
              variant="outlined"
              size="small"
              style={{ textTransform: "none" }}
              disabled={msgBuffer === null || status === "dataError"}
              onClick={initiateTransferCB}
            >
              {properCase(destination)}
            </Button>

            {status !== "dataError" && (
              <FormHelperText>
                {destination === "import" ? (
                  <span>
                    Import and <strong>overwrite</strong> local data{" "}
                    <strong>!</strong>
                  </span>
                ) : (
                  <span>Save to file system</span>
                )}
              </FormHelperText>
            )}
          </FormControl>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Parse file object, throws and sets error
 * @param msgAsText
 * @param setErrorStatus
 */
function parseFileObject(
  msgAsText: string,
  setErrorStatus: Dispatch<
    SetStateAction<"successStatus" | "dataError" | undefined>
  >
) {
  let fileObj: SyncDataFile[];

  try {
    fileObj = JSON.parse(msgAsText) as SyncDataFile[];

    fileObj.forEach((f) => {
      if (!("fileName" in f) || typeof f.fileName !== "string") {
        throw new Error("Unexpected filename", {
          cause: { code: SharingMessageErrorCause.BadFileName },
        });
      }
      if (!("text" in f) || typeof f.text !== "string") {
        throw new Error("Unexpected file content", {
          cause: { code: SharingMessageErrorCause.BadFileContent },
        });
      }
    });
  } catch (err) {
    setErrorStatus("dataError");
    if (err instanceof Error && "cause" in err) {
      throw err;
    }

    throw new Error("Failed to parse message contents", {
      cause: { code: SharingMessageErrorCause.BadPayload },
    });
  }

  return fileObj;
}
