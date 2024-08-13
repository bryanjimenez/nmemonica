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
import { useDataSetExportSync } from "../../hooks/useDataSetExportSync";

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
  const rtc = useRef<RTCDataChannel | null>(null);

  const closeHandlerCB = useCallback(() => {
    setFileData([]);
    setShareId(undefined);
    setWarning([]);
    close();
    setFinished(false);

    if (rtc.current !== null) {
      rtc.current.close();
    }
  }, [close]);

  const onSignalingConnectError = useCallback(() => {
    if (warning.find((w) => w.key === "connect-error") === undefined) {
      setWarning([
        <span
          key={`connect-error`}
        >{`Error connecting, service may be offline.`}</span>,
      ]);
    }
  }, [warning]);

  const onClose = useCallback(() => {
    setFinished(true);
  }, []);


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

  const { exportDataSetHandlerCB } = useDataSetExportSync(
    fileData,
    encryptKey,
    warning,
    onSignalingConnectError,
    onClose,

    setWarning,
    setShareId,

    rtc
  );

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
              className={classNames({ "d-flex": true, "opacity-50": finished })}
            >
              {finished ? (
                <CheckCircleIcon
                  size="small"
                  className="mt-1 pt-1 me-2 correct-color"
                />
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
