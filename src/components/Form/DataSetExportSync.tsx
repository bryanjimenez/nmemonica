import { Alert, Button, Dialog, DialogContent } from "@mui/material";
import {
  ArrowSwitchIcon,
  CheckCircleIcon,
  DatabaseIcon,
  FileDirectoryIcon,
  KeyIcon,
  LinkIcon,
  ShieldSlashIcon,
  UploadIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { ReactElement, useCallback, useRef, useState } from "react";

import { DataSetFromAppCache } from "./DataSetFromAppCache";
import { DataSetFromDragDrop, TransferObject } from "./DataSetFromDragDrop";
import { DataSetKeyInput } from "./DataSetKeyInput";
import { localStorageKey } from "../../constants/paths";
import { encrypt } from "../../helper/cryptoHelper";
import { getLocalStorageSettings } from "../../helper/localStorageHelper";
import { webSocketPeerSend } from "../../helper/peerShareHelper";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  xObjectToCsvText,
} from "../../helper/sheetHelper";
import { type FilledSheetData } from "../../helper/sheetHelperImport";

interface DataSetExportSyncProps {
  visible?: boolean;
  close: () => void;
}

export interface SyncDataFile {
  fileName: string;
  text: string;
}

export interface SyncDataMsg {
  event_name: string;
  payload: object;
}

export function DataSetExportSync(props: DataSetExportSyncProps) {
  const { visible, close } = props;

  const [warning, setWarning] = useState<ReactElement[]>([]);

  const [showKeyInput, setShowKeyInput] = useState(false);
  const showKeyInputCB = useCallback(() => {
    setShowKeyInput(true);
  }, []);
  const closeKeyInputCB = useCallback(() => {
    setShowKeyInput(false);
  }, []);

  const [encryptKey, setEncryptKey] = useState<string>();

  const [shareId, setShareId] = useState<string>();
  const [source, setSource] = useState<"FileSystem" | "AppCache">("AppCache");
  const sourceFileSysCB = useCallback(() => {
    setSource("FileSystem");
  }, []);
  const sourceAppCacheCB = useCallback(() => {
    setSource("AppCache");
  }, []);

  const [fileData, setFileData] = useState<TransferObject[]>([]);
  const [finished, setFinished] = useState(false);
  const connection = useRef<WebSocket | null>(null);

  const closeHandlerCB = useCallback(() => {
    setFileData([]);
    setShareId(undefined);
    setWarning([]);
    close();
    setFinished(false);
    if (connection.current) {
      connection.current.close();
    }
  }, [close]);

  /**
   * Upload to Sync
   * @param payload Array of items to be transfered
   */
  const sendMessageSyncCB = useCallback(
    (payload: SyncDataFile[]) => {
      if (encryptKey === undefined) {
        if (
          warning.find((w) => w.key === "missing-encrypt-key") === undefined
        ) {
          setWarning([
            <span
              key={`missing-encrypt-key`}
            >{`Encrypt key required for sharing.`}</span>,
          ]);
        }
        return;
      }

      const onError = () => {
        if (warning.find((w) => w.key === "connect-error") === undefined) {
          setWarning([
            <span
              key={`connect-error`}
            >{`Error connecting, service may be offline.`}</span>,
          ]);
        }
      };
      const onClose = () => {
        setFinished(true);
      };

      const onOpen = () => {
        const { encrypted: encryptedText, iv } = encrypt(
          "aes-192-cbc",
          encryptKey,
          JSON.stringify(payload)
        );
        const b = new TextEncoder().encode(
          JSON.stringify({ payload: encryptedText, iv })
        );
        const blob = new Blob([b.buffer], {
          type: "application/x-nmemonica-data",
        });

        void blob.arrayBuffer().then((b) => connection.current?.send(b));
      };

      const onMessage = (msgData: string) => {
        let uid: unknown;
        try {
          const p = JSON.parse(msgData) as SyncDataMsg;

          if (p.event_name === "push_success" && "uid" in p.payload) {
            uid = p.payload.uid;
          }

          if (typeof uid !== "string") {
            throw new Error("Expected a string ID");
          }
        } catch (_err) {
          setWarning((w) => [
            ...w,
            <span key={`bad-share-id`}>{`Failed to parse share ID`}</span>,
          ]);
          connection.current?.close();
          return;
        }

        setShareId(uid);
        setWarning([]);
      };

      connection.current = webSocketPeerSend(
        onError,
        onClose,
        onOpen,
        onMessage
      );
    },
    [encryptKey, warning]
  );

  const exportDataSetHandlerCB = useCallback(() => {
    let transferData = Promise.resolve(
      fileData.map((f) => ({
        name: f.name,
        text: f.text,
      }))
    );

    const fromApp = fileData.filter((f) => f.origin === "AppCache");
    if (fromApp.length > 0) {
      transferData = getWorkbookFromIndexDB().then((xObj) => {
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
              const ls = getLocalStorageSettings(localStorageKey);
              if (ls) {
                return [
                  ...acc,
                  {
                    name: metaDataNames.settings.prettyName,
                    text: JSON.stringify(ls),
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

    void transferData.then((d) => {
      const m: SyncDataFile[] = d.map((p) => ({
        fileName: `${p.name}.${p.name.toLowerCase() === metaDataNames.settings.prettyName.toLowerCase() ? "json" : "csv"}`,
        text: p.text,
      }));
      return sendMessageSyncCB(m);
    });
  }, [fileData, sendMessageSyncCB]);

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

  return (
    <>
      <DataSetKeyInput
        visible={showKeyInput}
        generate={true}
        encryptKey={encryptKey}
        enterHandler={setEncryptKey}
        closeHandler={closeKeyInputCB}
      />
      <Dialog
        open={visible === true}
        onClose={closeHandlerCB}
        aria-label="File drag drop area"
        fullWidth={true}
      >
        <DialogContent className="p-2 m-0">
          <div className="d-flex justify-content-between">
            <div onClick={showKeyInputCB}>
              {encryptKey !== undefined ? <KeyIcon /> : <ShieldSlashIcon />}
            </div>
            {source === "FileSystem" && (
              <div className="clickable" onClick={sourceAppCacheCB}>
                <ArrowSwitchIcon className="px-0" /> <DatabaseIcon />
              </div>
            )}
            {source === "AppCache" && (
              <div className="clickable" onClick={sourceFileSysCB}>
                <FileDirectoryIcon /> <ArrowSwitchIcon className="px-0" />
              </div>
            )}
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

          <div className="d-flex justify-content-between">
            <div
              className={classNames({ "d-flex": true, "opacity-25": finished })}
            >
              {finished ? (
                <CheckCircleIcon size="small" className="mt-1 pt-1 me-2" />
              ) : (
                shareId !== undefined && (
                  <LinkIcon size="small" className="mt-1 pt-1 me-2" />
                )
              )}
              <div className="mt-1 me-2">{shareId}</div>
            </div>
            <div className="d-flex">
              <Button
                aria-label="Share Datasets"
                variant="outlined"
                size="small"
                disabled={fileData.length < 1 || shareId !== undefined}
                onClick={exportDataSetHandlerCB}
                style={{ textTransform: "none" }}
              >
                {shareId !== undefined ? (
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
