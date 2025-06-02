import { useCallback } from "react";

import { CryptoMessage } from "./useDataSetImportSync";
import { SyncDataFile } from "../components/Form/DataSetExportSync";
import { TransferObject } from "../components/Form/DataSetFromDragDrop";
import { encryptAES256GCM } from "../helper/cryptoHelper";
import {
  RTCChannelMessageHeader,
  RTCChannelStatus,
  RTCSignalingErrorCause,
  rtcSignalingInitiate,
} from "../helper/rtcHelperHttp";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  xObjectToCsvText,
} from "../helper/sheetHelper";
import { FilledSheetData } from "../helper/sheetHelperImport";
import { getUserSettings } from "../helper/userSettingsHelper";

/**
 * Gathers datasets from file system or app memory
 * @param fileData file descriptor object (w/ info about location)
 * @returns returns an array of files
 */
function dataTransferAggregator(fileData: TransferObject[]) {
  let transferData = Promise.resolve(
    fileData.map((f) => ({
      name: f.name,
      text: f.text,
    }))
  );

  const fromApp = fileData.filter((f) => f.origin === "AppCache");
  if (fromApp.length > 0) {
    transferData = getWorkbookFromIndexDB()
    .then(xObj=>getUserSettings().then(usrSets=>({xObj,usrSets})))
    .then(({xObj,usrSets}) => {
      const included = xObj.filter((o) =>
        fromApp.find((a) => a.name.toLowerCase() === o.name.toLowerCase())
      ) as FilledSheetData[];

      // send AppCache UserSettings if selected
      const appSettings = fileData.reduce<{ name: string; text: string }[]>(
        (acc, f) => {
          if (
            f.origin === "AppCache" &&
            f.name.toLowerCase() ===
              metaDataNames.settings.prettyName.toLowerCase()
          ) {

            if (usrSets) {
              return [
                ...acc,
                {
                  name: metaDataNames.settings.prettyName,
                  text: JSON.stringify(usrSets),
                },
              ];
            }
          }
          return acc;
        },
        []
      );

      return xObjectToCsvText(included).then((dBtoCsv) => [
        // any filesystem imports (already text)
        ...fileData.filter((f) => f.origin === "FileSystem"),
        // converted AppCache to csv text
        ...dBtoCsv,
        // converted UserSettings to json text
        ...appSettings,
      ]);
    });
  }

  return transferData.then((d) => {
    const m: SyncDataFile[] = d.map((p) => ({
      fileName: `${p.name}.${p.name.toLowerCase() === metaDataNames.settings.prettyName.toLowerCase() ? "json" : "csv"}`,
      text: p.text,
    }));

    return m;
  });
}

function encryptTransfer(encryptKey: string, data: SyncDataFile[]) {
  const {
    encrypted: encryptedText,
    iv,
    tag,
  } = encryptAES256GCM("aes-256-gcm", encryptKey, JSON.stringify(data));

  const msgFields: CryptoMessage = { payload: encryptedText, iv, tag };
  const b = new TextEncoder().encode(JSON.stringify(msgFields));
  const blob = new Blob([b.buffer], {
    type: "application/x-nmemonica-data",
  });

  return blob.arrayBuffer();
}

function buildChunkHeader(messageByteLength: number, chunkSize: number) {
  const arr = new TextEncoder().encode(
    JSON.stringify({
      header: RTCChannelMessageHeader,
      len: Math.ceil(messageByteLength / chunkSize),
    })
  );

  return arr.buffer;
}

/**
 * DataSetExportSync callbacks
 */
export function useDataSetExportSync(
  rtc: React.MutableRefObject<RTCDataChannel | null>,
  encryptKey: string | undefined,
  fileData: TransferObject[],

  addWarning: (warnKey?: string, warnMsg?: string) => void,
  setShareId: React.Dispatch<React.SetStateAction<string | undefined>>,
  showDoneConfirmation: () => void
) {
  /**
   * RTC Signaling handshake complete
   * Begin messaging
   */
  const initiateTransferCB = useCallback(
    (arg: [encryptKey: string, channel: RTCDataChannel]) => {
      // signaling successful
      // start messaging
      const [encryptKey, channel] = arg;
      rtc.current = channel;
      addWarning();

      return new Promise<void>((resolve, reject) => {
        channel.onerror = () => {
          reject(new Error("Unexpected error during transmission"));
        };
        channel.onmessage = (msg: { data: string }) => {
          // expect confirmation msg

          switch (msg.data) {
            case RTCChannelStatus.Initialized:
              void dataTransferAggregator(fileData)
                .then((msg) => encryptTransfer(encryptKey, msg))
                .then((encrypted) => {
                  // TODO: chunkSize arbitrarily chosen
                  const chunkSize = 1024 * 10;

                  const chunkHeader = buildChunkHeader(
                    encrypted.byteLength,
                    chunkSize
                  );
                  channel.send(chunkHeader);

                  let i = 0;
                  while (i < encrypted.byteLength) {
                    const j = i + chunkSize;
                    const chunk = encrypted.slice(i, j);
                    i = j;
                    channel.send(chunk);
                  }

                  resolve();
                });
              break;

            case RTCChannelStatus.Finalized:
              channel.close();
              showDoneConfirmation();
              break;

            default:
              channel.close();
              reject(new Error("Incorrect peer confirmation"));
              break;
          }
        };
      });
    },
    [rtc, fileData, showDoneConfirmation, addWarning]
  );

  const exportDataSetHandlerCB = useCallback(() => {
    if (encryptKey === undefined) {
      addWarning("missing-encrypt-key", "Encrypt key required for sharing.");
      return;
    }

    // NOTE: since channel is non-serializable will no be an action
    rtcSignalingInitiate(encryptKey, (signalId) => {
      // display exchange id
      setShareId(signalId);
      addWarning();
    })
      .then(initiateTransferCB)
      .catch((err) => {
        if (err instanceof Error && "cause" in err) {
          const errData = err.cause as { code: string; status: string };

          if (
            Object.values<string>(RTCSignalingErrorCause).includes(errData.code)
          ) {
            addWarning(errData.code, `${err.message} ${errData.status ?? ""}`);
            if (errData.code !== RTCSignalingErrorCause.ServiceError) {
              return;
            }
          }
        }

        addWarning("signaling-unexpected", "Possible network failure");
      });
  }, [encryptKey, initiateTransferCB, setShareId, addWarning]);

  return { exportDataSetHandlerCB };
}
