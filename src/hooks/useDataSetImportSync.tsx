import { useCallback } from "react";

import { SyncDataFile } from "../components/Form/DataSetExportSync";
import { properCase } from "../components/Games/KanjiGame";
import { decrypt } from "../helper/cryptoHelper";
import {
  RTCChannelStatus,
  RTCErrorCause,
  rtcSignalingRespond,
} from "../helper/rtcHelperHttp";
import { FilledSheetData } from "../helper/sheetHelperImport";
import { AppSettingState } from "../slices";
import { readCsvToSheet } from "../slices/sheetSlice";

interface CustomElements extends HTMLFormControlsCollection {
  syncId: HTMLInputElement;
}
interface CustomForm extends HTMLFormElement {
  elements: CustomElements;
}

/**
 * DataSetExportSync callbacks
 */
export function useDataSetImportSync(
  rtc: React.MutableRefObject<RTCDataChannel | null>,
  encryptKey: string | undefined,
  destination: "import" | "save",

  addWarning: (warnKey?: string, warnMsg?: string) => void,
  setStatus: React.Dispatch<
    React.SetStateAction<
      | "successStatus"
      | "connectError"
      | "inputError"
      | "outputError"
      | undefined
    >
  >,

  saveToFileHandler: (
    files: {
      fileName: string;
      text: string;
    }[]
  ) => Promise<void>,
  updateDataHandler: (
    importWorkbook?: FilledSheetData[] | undefined,
    importSettings?: Partial<AppSettingState> | undefined
  ) => Promise<void>
) {
  const decryptMsgIntoDecryptedFilesCB = useCallback(
    (encryptKey: string, msgBuf: ArrayBuffer) => {
      const msgAsText = new TextDecoder("utf-8").decode(msgBuf);

      let fileObj: SyncDataFile[];
      try {
        const { payload, iv } = JSON.parse(msgAsText) as {
          payload: string;
          iv: string;
        };

        fileObj = JSON.parse(
          decrypt("aes-192-cbc", encryptKey, iv, payload)
        ) as SyncDataFile[];

        fileObj.forEach((f) => {
          if (!("fileName" in f) || typeof f.fileName !== "string") {
            throw new Error("Expected filename", {
              cause: { code: "BadFileName" },
            });
          }
          if (!("text" in f) || typeof f.text !== "string") {
            throw new Error("Expected filename", {
              cause: { code: "BadText" },
            });
          }
        });
      } catch (err) {
        setStatus("outputError");
        let errCode: string | undefined;
        if (err instanceof Error && "cause" in err) {
          const { code } = err.cause as { code?: string };
          errCode = code;
        }

        addWarning(
          "msg-parse-error",
          "Sync Message JSON.parse error" + errCode ? ` [${errCode}]` : ""
        );
        return [];
      }

      return fileObj;
    },
    [setStatus, addWarning]
  );

  const toDataSetAndSettingsCB = useCallback(
    (fileObj: SyncDataFile[]) => {
      return fileObj.reduce(
        (acc, o) => {
          if (o.fileName.toLowerCase().endsWith(".csv")) {
            const dot = o.fileName.indexOf(".");
            const sheetName = properCase(
              o.fileName.slice(0, dot > -1 ? dot : undefined)
            );

            const csvFile = readCsvToSheet(o.text, sheetName);

            return { ...acc, data: [...(acc.data ?? []), csvFile] };
          } else {
            let s;
            try {
              s = JSON.parse(o.text) as Partial<AppSettingState>;
              // TODO: settings.json verify is AppSettingState
              return { ...acc, settings: s };
            } catch (err) {
              setStatus("outputError");
              addWarning("msg-parse-error", "Failed to parse Settings");
            }
          }
          return acc;
        },
        { data: [] } as {
          data: Promise<FilledSheetData>[];
          settings?: Partial<AppSettingState>;
        }
      );
    },
    [setStatus, addWarning]
  );

  const importToAppHandlerCB = useCallback(
    (
      dataObj: FilledSheetData[],
      fileObj: SyncDataFile[],
      settings: Partial<AppSettingState> | undefined,
      channel: RTCDataChannel
    ) => {
      const d = dataObj.length === 0 ? undefined : dataObj;

      return updateDataHandler(d, settings).then(() => {
        // send receive confirmation
        channel.send(RTCChannelStatus.Finalized);
      });
    },
    [updateDataHandler]
  );
  /**
   * RTC Signaling handshake complete
   * Begin messaging
   */
  const initiateTransferCB = useCallback(
    (
      arg: [encryptKey: string, channel: RTCDataChannel, msgBuf: ArrayBuffer]
    ) => {
      const [encryptKey, channel, msgBuf] = arg;

      const fileObj = decryptMsgIntoDecryptedFilesCB(encryptKey, msgBuf);
      const { data: dataP, settings } = toDataSetAndSettingsCB(fileObj);

      Promise.all(dataP)
        .then((dataObj) => {
          if (destination === "save") {
            return saveToFileHandler(fileObj);
          }

          return importToAppHandlerCB(dataObj, fileObj, settings, channel);
        })
        .catch((_err) => {
          setStatus("outputError");
          addWarning("msg-parse-error", "Failed to parse DataSet");
        });
    },
    [
      destination,
      saveToFileHandler,
      setStatus,
      addWarning,
      toDataSetAndSettingsCB,
      decryptMsgIntoDecryptedFilesCB,
      importToAppHandlerCB,
    ]
  );

  const importDataSetHandlerCB = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

      if (encryptKey === undefined) {
        addWarning("missing-encrypt-key", "Encrypt key required for sharing.");
        return;
      }

      const form = e.currentTarget.elements;
      if ("syncId" in form === false) {
        return;
      }
      const shareId = form.syncId.value;

      if (shareId.length !== 5) {
        setStatus("inputError");
        return;
      }

      // NOTE: since channel is non-serializable will no be an action
      rtcSignalingRespond(encryptKey, shareId)
        .then((channel) => {
          // signaling successful
          // start messaging
          rtc.current = channel;
          addWarning();

          return new Promise<[string, RTCDataChannel, ArrayBuffer]>(
            (resolve, reject) => {
              channel.onmessage = (msg: { data: ArrayBuffer }) => {
                if (msg.data instanceof ArrayBuffer === false) {
                  // TODO: hardcoded msg-parse-error
                  reject(
                    new Error("Failed to parse", {
                      cause: { code: "msg-parse-error" },
                    })
                  );
                }
                resolve([encryptKey, channel, msg.data]);
              };
            }
          );
        })
        .then(initiateTransferCB)
        .catch((err) => {
          if (err instanceof Error && "cause" in err) {
            const errData = err.cause as { code: string; status: string };

            if (errData.code === RTCErrorCause.ServiceError) {
              addWarning(
                `server-error-${errData.status ?? ""}`,
                `${err.message} ${errData.status ?? ""}`
              );
            }

            if (errData.code === RTCErrorCause.BadUid) {
              addWarning(`user-bad-share-id-${shareId}`, err.message);
              return;
            }

            if (errData.code === "msg-parse-error") {
              setStatus("outputError");
              addWarning("msg-parse-error", "Failed to parse");
              return;
            }
          }

          setStatus("connectError");
        });
    },
    [encryptKey, rtc, setStatus, addWarning, initiateTransferCB]
  );

  return { importDataSetHandlerCB };
}
