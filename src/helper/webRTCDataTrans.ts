import { type TransferObject } from "../components/Form/DataSetFromDragDrop";
import { encryptAES256GCM } from "../helper/cryptoHelper";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  workbookSheetNames,
  xObjectToCsvText,
} from "../helper/sheetHelper";
import { FilledSheetData } from "../helper/sheetHelperImport";
import {
  getStudyProgress,
  getUserSettings,
} from "../helper/userSettingsHelper";

/** Default size if not set */
const DEFAULT_MAX_MESSAGE_SIZE = 1024 * 10;

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
export function dataTransferAggregator(
  fileData: TransferObject[]
): Promise<SyncDataFile[]> {
  const fromFileSystem: SyncDataFile[] = fileData
    .filter((f) => f.origin === "FileSystem")
    .map(({ name, text }) => ({
      fileName: `${name}.${Object.keys(workbookSheetNames).includes(name.toLowerCase()) ? "csv" : "json"}`,
      text: text,
    }));

  const fromApp = fileData.filter((f) => f.origin === "AppCache");

  return new Promise<SyncDataFile[]>((transferResolve) => {
    if (fromApp.length === 0) {
      // if no requests from app cache
      transferResolve(fromFileSystem);
    } else {
      // some requests from app cache
      // also append requests from filesystem

      const workbookReq = fromApp.filter((req) =>
        Object.keys(workbookSheetNames).includes(req.name.toLowerCase())
      );
      const settingReq = fromApp.filter(
        (req) =>
          req.name.toLowerCase() ===
          metaDataNames.settings.prettyName.toLowerCase()
      );
      const progressReq = fromApp.filter(
        (req) =>
          req.name.toLowerCase() ===
          metaDataNames.progress.prettyName.toLowerCase()
      );

      const workbookText = new Promise<{ fileName: string; text: string }[]>(
        (bookResolve, bookReject) => {
          if (workbookReq.length > 0) {
            getWorkbookFromIndexDB()
              .then(
                (workbook) =>
                  workbook.filter((sheet) =>
                    workbookReq
                      .map((d) => d.name.toLowerCase())
                      .includes(sheet.name.toLowerCase())
                  ) as FilledSheetData[]
              )
              .then((selectedSheets) => xObjectToCsvText(selectedSheets))
              .then((d) =>
                d.map(({ name, text }) => ({
                  fileName: `${name}.csv`,
                  text: text,
                }))
              )
              .then(bookResolve)
              .catch(bookReject);
            return;
          }
          bookResolve([]);
        }
      );

      const settingText = new Promise<{ fileName: string; text: string }[]>(
        (settingResolve, settingReject) => {
          if (settingReq.length > 0) {
            getUserSettings()
              .then((setting) => [
                {
                  fileName: `${metaDataNames.settings.prettyName}.json`,
                  text: JSON.stringify(setting),
                },
              ])
              .then(settingResolve)
              .catch(settingReject);
            return;
          }

          settingResolve([]);
        }
      );

      const progressText = new Promise<{ fileName: string; text: string }[]>(
        (progResolve, progReject) => {
          if (progressReq.length > 0) {
            getStudyProgress()
              .then((progress) => [
                {
                  fileName: `${metaDataNames.progress.prettyName}.json`,
                  text: JSON.stringify(progress),
                },
              ])
              .then(progResolve)
              .catch(progReject);
            return;
          }

          progResolve([]);
        }
      );

      void Promise.allSettled<SyncDataFile[]>([
        workbookText,
        settingText,
        progressText,
      ])
        .then((result) =>
          result.reduce<SyncDataFile[]>((acc, res) => {
            if (res.status === "fulfilled") {
              return [...acc, ...res.value];
            }
            return acc;
          }, [])
        )
        .then((fromAppCache) => [
          ...fromAppCache,
          // append any filesystem requests (already text)
          ...fromFileSystem,
        ])
        .then(transferResolve);
    }
  });
}

export function sendChunkedMessage(
  channel: RTCDataChannel,
  buffer: ArrayBuffer,
  chunkSize = DEFAULT_MAX_MESSAGE_SIZE
) {
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
