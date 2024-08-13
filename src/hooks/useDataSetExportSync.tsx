import React, { ReactElement, useCallback } from "react";

import { SyncDataFile } from "../components/Form/DataSetExportSync";
import { TransferObject } from "../components/Form/DataSetFromDragDrop";
import { encrypt } from "../helper/cryptoHelper";
import {
  RTCChannelStatus,
  RTCErrorCause,
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
  const { encrypted: encryptedText, iv } = encrypt(
    "aes-192-cbc",
    encryptKey,
    JSON.stringify(data)
  );
  const b = new TextEncoder().encode(
    JSON.stringify({ payload: encryptedText, iv })
  );
  const blob = new Blob([b.buffer], {
    type: "application/x-nmemonica-data",
  });

  return blob.arrayBuffer();
}

/**
 * DataSetExportSync callbacks
 */
export function useDataSetExportSync(
  fileData: TransferObject[],
  encryptKey: string | undefined,
  warning: ReactElement[],
  onSignalingConnectError: () => void,
  onClose: () => void,

  setWarning: React.Dispatch<
    React.SetStateAction<
      ReactElement<any, string | React.JSXElementConstructor<any>>[]
    >
  >,
  setShareId: React.Dispatch<React.SetStateAction<string | undefined>>,

  rtc: React.MutableRefObject<RTCDataChannel | null>
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
      setWarning([]);

      channel.onmessage = (msg: { data: unknown }) => {
        // expect confirmation msg
        if (msg.data === RTCChannelStatus.Finalized) {
          channel.close();
          onClose();
        }
      };

      void dataTransferAggregator(fileData)
        .then((msg) => encryptTransfer(encryptKey, msg))
        .then((encrypted) => channel.send(encrypted));
    },
    [rtc, fileData, onClose, setWarning]
  );

  const exportDataSetHandlerCB = useCallback(() => {
    if (encryptKey === undefined) {
      if (warning.find((w) => w.key === "missing-encrypt-key") === undefined) {
        setWarning([
          <span
            key={`missing-encrypt-key`}
          >{`Encrypt key required for sharing.`}</span>,
        ]);
      }
      return;
    }

    // NOTE: since channel is non-serializable will no be an action
    rtcSignalingInitiate(encryptKey, (signalId) => {
      // display exchange id
      setShareId(signalId);
      setWarning([]);
    })
      .then(initiateTransferCB)
      .catch((err) => {
        if (err instanceof Error && "cause" in err) {
          const errData = err.cause as { code: string; status: string };

          if (
            errData.code === RTCErrorCause.ExportInitSvcError ||
            errData.code === RTCErrorCause.ExportFinalSvcError
          ) {
            onSignalingConnectError();
            return;
          }
        }

        setWarning((w) => [
          ...w,
          <span
            key={`signaling-unexpected`}
          >{`Sharing service unexpected error`}</span>,
        ]);
      });
  }, [
    encryptKey,
    warning,
    onSignalingConnectError,

    initiateTransferCB,
    setShareId,
    setWarning,
  ]);

  return { exportDataSetHandlerCB };
}
