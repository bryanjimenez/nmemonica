import { Alert, Button, Dialog, DialogContent } from "@mui/material";
import { FilledSheetData } from "@nmemonica/snservice";
import {
  ArrowSwitchIcon,
  CheckCircleIcon,
  DatabaseIcon,
  FileDirectoryIcon,
  UploadIcon,
} from "@primer/octicons-react";
import { ReactElement, useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { DataSetFromAppCache } from "./DataSetFromAppCache";
import { DataSetFromDragDrop, TransferObject } from "./DataSetFromDragDrop";
import { syncService } from "../../../environment.development";
import { localStorageKey } from "../../constants/paths";
import { getLocalStorageSettings } from "../../helper/localStorageHelper";
import { AppDispatch } from "../../slices";
import { getDatasets } from "../../slices/sheetSlice";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  xObjectToCsvText,
} from "../Pages/Sheet";

interface DataSetExportSyncProps {
  visible?: boolean;
  close: () => void;
}

export interface SyncDataFile {
  fileName: string;
  text: string;
}

export interface SyncDataMsg {
  eventName: string;
  payload: object;
}

export function DataSetExportSync(props: DataSetExportSyncProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { visible, close } = props;

  const [warning, setWarning] = useState<ReactElement[]>([]);

  const [shareId, setShareId] = useState<string>();
  const [source, setSource] = useState<"FileSystem" | "AppCache">("AppCache");
  const [fileData, setFileData] = useState<TransferObject[]>([]);

  const closeHandlerCB = useCallback(() => {
    setFileData([]);
    setShareId(undefined);
    setWarning([]);
    close();
  }, [close]);

  /**
   * Upload to Sync
   * @param payload Array of items to be transfered
   */
  const sendMessageSyncCB = useCallback((payload: SyncDataFile[]) => {
    const ws = new WebSocket(syncService);
    ws.binaryType = "arraybuffer";

    ws.addEventListener("error", () => {
      setWarning([
        <span
          key={`connect-error`}
        >{`Error connecting, service may be offline.`}</span>,
      ]);
    });

    ws.addEventListener("open", () => {
      const b = new TextEncoder().encode(JSON.stringify(payload));
      const blob = new Blob([b.buffer], {
        type: "application/x-nmemonica-data",
      });

      void blob.arrayBuffer().then((b) => ws.send(b));
    });

    ws.addEventListener("message", (msg: MessageEvent<Blob | string>) => {
      const { data: msgData } = msg;
      if (msgData instanceof Blob === true) {
        setWarning((w) => [
          ...w,
          <span key={`no-share-id`}>{`Expected a share ID`}</span>,
        ]);

        ws.close();
        return;
      }

      let uid: unknown;
      try {
        const p = JSON.parse(msgData) as SyncDataMsg;

        if (p.eventName === "pushSuccess" && "uid" in p.payload) {
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
        ws.close();
        return;
      }

      setShareId(uid);
      setWarning([]);
      ws.close();
    });
  }, []);

  const exportDataSetHandlerCB = useCallback(() => {
    let transferData = Promise.resolve(
      fileData.map((f) => ({
        name: f.name,
        text: f.text,
      }))
    );

    const fromApp = fileData.filter((f) => f.origin === "AppCache");
    if (fromApp.length > 0) {
      transferData = getWorkbookFromIndexDB(dispatch, getDatasets).then(
        (xObj) => {
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
        }
      );
    }

    void transferData.then((d) => {
      const m: SyncDataFile[] = d.map((p) => ({
        fileName: `${p.name}.${p.name.toLowerCase() === metaDataNames.settings.prettyName.toLowerCase() ? "json" : "csv"}`,
        text: p.text,
      }));
      return sendMessageSyncCB(m);
    });
  }, [dispatch, fileData, sendMessageSyncCB]);

  return (
    <Dialog
      open={visible === true}
      onClose={closeHandlerCB}
      aria-label="File drag drop area"
      fullWidth={true}
    >
      <DialogContent className="p-2 m-0">
        <div className="d-flex justify-content-end">
          {source === "FileSystem" && (
            <div
              className="clickable"
              onClick={() => {
                setSource("AppCache");
              }}
            >
              <ArrowSwitchIcon className="px-0" /> <DatabaseIcon />
            </div>
          )}
          {source === "AppCache" && (
            <div
              className="clickable"
              onClick={() => {
                setSource("FileSystem");
              }}
            >
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
            updateDataHandler={(name) => {
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
            }}
          />
        )}
        {source === "FileSystem" && (
          <DataSetFromDragDrop
            data={fileData}
            updateDataHandler={(item) => {
              setFileData((prev) => {
                if (
                  prev.find(
                    (p) => p.name.toLowerCase() === item.name.toLowerCase()
                  ) === undefined
                ) {
                  return [...prev, item];
                } else {
                  return prev.filter(
                    (p) => p.name.toLowerCase() !== item.name.toLowerCase()
                  );
                }
              });
            }}
          />
        )}

        <div className="d-flex justify-content-between">
          <div>{shareId}</div>
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
  );
}
