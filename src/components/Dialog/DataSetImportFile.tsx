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
import { TransferObject } from "../../helper/transferHelper";
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

  const [fileData, setFileData] = useState<TransferObject[]>([]);
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
    setShareId(undefined);
    setImportStatus(undefined);
    socket.current?.close();
    close();
  }, [close]);

  const importDatasetCB = useCallback(() => {
    setImportStatus(undefined);

    const workbook = fileData.reduce<FilledSheetData[]>(
      (acc, el) => (el.sheet ? [...acc, el.sheet] : acc),
      []
    );

    const [settings] = fileData.reduce<
      Partial<AppSettingState | AppProgressState>[]
    >(
      (acc, el) =>
        el.setting && el.name === metaDataNames.settings.prettyName
          ? [...acc, el.setting]
          : acc,
      []
    ) as Partial<AppSettingState>[];

    const [progress] = fileData.reduce<
      Partial<AppSettingState | AppProgressState>[]
    >(
      (acc, el) =>
        el.setting && el.name === metaDataNames.progress.prettyName
          ? [...acc, el.setting]
          : acc,
      []
    ) as Partial<AppProgressState>[];

    importHandler(workbook, settings, progress)
      .then(() => {
        setImportStatus(true);
        setTimeout(closeHandlerCB, 1000);
      })
      .catch(() => {
        setImportStatus(false);
      });
  }, [fileData, importHandler, closeHandlerCB]);

  const fromDragDropUpdateDataCB = useCallback((item: TransferObject) => {
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
      <Dialog
        open={confirm}
        onClose={cancelCB}
        aria-label="Confirm file import"
      >
        <DialogContent>
          <Alert severity="warning" className="py-0 mb-1">
            <div className="p-0 d-flex flex-column">
              <ul className="mb-0">
                {fileData.find((f) => f.sheet !== undefined) && (
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
            updateDataHandler={fromDragDropUpdateDataCB}
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
