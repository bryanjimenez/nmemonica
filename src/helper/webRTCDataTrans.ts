import { type TransferObject } from "../components/Form/DataSetFromDragDrop";
import { encryptAES256GCM } from "../helper/cryptoHelper";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  xObjectToCsvText,
} from "../helper/sheetHelper";
import { FilledSheetData } from "../helper/sheetHelperImport";
import { getUserSettings } from "../helper/userSettingsHelper";

// FIXME: chunkSize arbitrarily chosen
// a=max-message-size:262144
const MAX_MESSAGE_SIZE = 1024 * 256;

export const enum SharingMessageErrorCause {
  BadCryptoKey = "message-user-bad-crypto-key",
  BadPayload = "message-bad-payload",
  BadFileName = "message-bad-filename",
  BadFileContent = "message-bad-file-contents",
}

export const RTCChannelMessageHeader = "RTCChannelMessageHeader";
export interface RTCChannelMessageHeader {
  header: string;
  len: number;
}
export const enum RTCChannelStatus {
  // value must be string
  // channel.send(string)
  Initialized = "1",
  Finalized = "0",
}

export interface CryptoMessage {
  payload: string;
  iv: string;
  tag: string;
}

export interface SyncDataFile {
  fileName: string;
  text: string;
}

export interface SyncDataMsg {
  event_name: string;
  payload: object;
}

/**
 * Gathers datasets from file system or app memory
 * @param fileData file descriptor object (w/ info about location)
 * @returns returns an array of files
 */
export function dataTransferAggregator(fileData: TransferObject[]) {
  let transferData = Promise.resolve(
    fileData.map((f) => ({
      name: f.name,
      text: f.text,
    }))
  );

  const fromApp = fileData.filter((f) => f.origin === "AppCache");
  if (fromApp.length > 0) {
    transferData = getWorkbookFromIndexDB()
      .then((xObj) => getUserSettings().then((usrSets) => ({ xObj, usrSets })))
      .then(({ xObj, usrSets }) => {
        const included = xObj.filter(
          (o) =>
            fromApp.find(
              (a) => a.name.toLowerCase() === o.name.toLowerCase()
            ) !== undefined
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

export function sendChunkedMessage(
  channel: RTCDataChannel,
  buffer: ArrayBuffer
) {
  const chunkSize = MAX_MESSAGE_SIZE;

  const chunkHeader = buildChunkHeader(buffer.byteLength, chunkSize);
  channel.send(chunkHeader);

  let i = 0;
  while (i < buffer.byteLength) {
    const j = i + chunkSize;
    const chunk = buffer.slice(i, j);
    i = j;
    channel.send(chunk);
  }
}

export function receiveChunkedMessageBuilder(
  setMsgBuffer: React.Dispatch<React.SetStateAction<ArrayBuffer | null>>
) {
  let remainingChunks = 0;
  let buff: ArrayBuffer[] = [];

  return function messageHandler(msg: { data: ArrayBuffer }) {
    if (msg.data instanceof ArrayBuffer === false) {
      throw new Error("Unexpected peer response");
    }

    // first msg is a header
    if (buff.length === 0 && remainingChunks === 0) {
      const headerText = new TextDecoder("utf-8").decode(
        new Uint8Array(msg.data)
      );
      try {
        const { header, len } = JSON.parse(
          headerText
        ) as RTCChannelMessageHeader;
        if (header === RTCChannelMessageHeader) {
          remainingChunks = len;
        }
      } catch (_err) {
        throw new Error("Invalid msg header");
      }

      return;
    }

    remainingChunks -= 1;
    buff.push(msg.data);

    if (remainingChunks === 0) {
      void new Blob(buff).arrayBuffer().then((combined) => {
        setMsgBuffer(combined);
        remainingChunks = 0;
        buff = [];
      });
    }

  };
}

export function encryptTransfer(encryptKey: string, data: SyncDataFile[]) {
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

export function plainTransfer(data: SyncDataFile[]) {
  const b = new TextEncoder().encode(JSON.stringify(data));
  const blob = new Blob([b.buffer], {
    type: "application/x-nmemonica-data",
  });

  return blob.arrayBuffer();
}

export function buildChunkHeader(messageByteLength: number, chunkSize: number) {
  const arr = new TextEncoder().encode(
    JSON.stringify({
      header: RTCChannelMessageHeader,
      len: Math.ceil(messageByteLength / chunkSize),
    })
  );

  return arr.buffer;
}
