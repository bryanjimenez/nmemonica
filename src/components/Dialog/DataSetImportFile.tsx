import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import {
  AlertIcon,
  CheckCircleIcon,
  DownloadIcon,
} from "@primer/octicons-react";
import { ReactElement, useCallback, useRef, useState } from "react";

import { Warnings } from "./DataSetExport";
import { metaDataNames } from "../../helper/sheetHelper";
import { type FilledSheetData } from "../../helper/sheetHelperImport";
import {
  SyncDataFile,
  parseSettingsAndProgress,
  parseSheet,
} from "../../helper/transferHelper";
import { AppProgressState, AppSettingState } from "../../slices";
import { DataSelectFromFile } from "../Form/DataSelectFromFile";
import "../../css/DragDrop.css";

interface DataSetImportFileProps {
  visible?: boolean;
  close: () => void;
  importHandler: (
    workbook?: FilledSheetData[],
    settings?: Partial<AppSettingState>,
    progress?: Partial<AppProgressState>
  ) => Promise<void>;
}

export function DataSetImportFile(props: DataSetImportFileProps) {
  const { visible, close, importHandler } = props;

  const [fileData, setFileData] = useState<SyncDataFile[]>([]);
  const [importStatus, setImportStatus] = useState<boolean>();

  const [fileWarning, setFileWarning] = useState<ReactElement[]>([]);

  const [confirm, setConfirm] = useState(false);
  const cancelCB = useCallback(() => {
    setConfirm(false);
  }, []);

  const confirmCB = useCallback(() => {
    setConfirm(true);
  }, []);

  const [shareId, setShareId] = useState<string>();
  const socket = useRef<WebSocket>(undefined);

  const closeHandlerCB = useCallback(() => {
    setConfirm(false);
    setFileData([]);
    setFileWarning([]);
    setShareId(undefined);
    setImportStatus(undefined);
    socket.current?.close();
    close();
  }, [close]);

  const importDatasetCB = useCallback(() => {
    setImportStatus(undefined);
    const fileObj = fileData;

    const { settings, progress } = parseSettingsAndProgress(fileObj);

    void parseSheet(fileObj)
      .then((sheetPromiseArr) =>
        sheetPromiseArr.reduce<FilledSheetData[]>((acc, r) => {
          if (r.status !== "fulfilled") {
            return acc;
          }

          if (r.value instanceof Error) {
            // const { key, msg } = r.value.cause as { key: string; msg: string };
            return acc;
          }

          const { sheet } = r.value;
          return [...acc, sheet];
        }, [])
      )
      .then((workbook) =>
        importHandler(workbook, settings, progress)
          .then(() => {
            setImportStatus(true);
            setTimeout(closeHandlerCB, 1000);
          })
          .catch(() => {
            setImportStatus(false);
          })
      );
  }, [fileData, importHandler, closeHandlerCB]);

  return (
    <>
      <Dialog
        open={confirm}
        onClose={cancelCB}
        aria-label="Confirm file import"
      >
        <DialogContent>
          <Alert severity="warning" className="py-0 mb-1">
            <div className="p-0 d-flex flex-column">
              <ul className="mb-0">
                {fileData.find((f) => f.fileName.endsWith(".csv")) && (
                  <li>
                    <strong>Datasets</strong> will be overwritten!
                  </li>
                )}
                {fileData.find(
                  (f) =>
                    f.name.toLowerCase() ===
                    metaDataNames.settings.prettyName.toLowerCase()
                ) && (
                  <li>
                    <strong>Settings</strong> will be overwritten!
                  </li>
                )}
                {fileData.find(
                  (f) =>
                    f.name.toLowerCase() ===
                    metaDataNames.progress.prettyName.toLowerCase()
                ) && (
                  <li>
                    <strong>Progress</strong> will be overwritten!
                  </li>
                )}
              </ul>
            </div>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={importDatasetCB}>Ok</Button>
          <Button onClick={cancelCB}>Cancel</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={visible === true}
        onClose={closeHandlerCB}
        aria-label="File drag drop area"
        fullWidth={true}
      >
        <DialogContent className="p-2 m-0">
          <Warnings fileWarning={fileWarning} clearWarnings={setFileWarning} />
          <DataSelectFromFile
            data={fileData}
            addWarning={setFileWarning}
            updateDataHandler={setFileData}
          />

          <div className="d-flex justify-content-between">
            <div>{shareId}</div>
            <div className="d-flex">
              <Button
                aria-label="Import Datasets from disk"
                variant="outlined"
                size="small"
                disabled={fileData.length < 1 || importStatus === true}
                onClick={confirmCB}
                style={{ textTransform: "none" }}
              >
                {importStatus === undefined ? (
                  <DownloadIcon size="small" className="pe-1" />
                ) : importStatus === true ? (
                  <CheckCircleIcon size="small" className="pe-1" />
                ) : (
                  <AlertIcon size="small" className="pe-1" />
                )}
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
