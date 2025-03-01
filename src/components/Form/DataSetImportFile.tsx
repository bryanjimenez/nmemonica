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
import { useCallback, useRef, useState } from "react";

import { DataSetFromDragDrop, TransferObject } from "./DataSetFromDragDrop";
import { type FilledSheetData } from "../../helper/sheetHelperImport";
import { LocalStorageState } from "../../slices";
import "../../css/DragDrop.css";

interface DataSetImportFileProps {
  visible?: boolean;
  close: () => void;
  updateDataHandler: (
    data?: FilledSheetData[],
    settings?: Partial<LocalStorageState>
  ) => Promise<void>;
}

export function DataSetImportFile(props: DataSetImportFileProps) {
  const { visible, close, updateDataHandler } = props;

  const [fileData, setFileData] = useState<TransferObject[]>([]);
  const [importStatus, setImportStatus] = useState<boolean>();

  const [confirm, setConfirm] = useState(false);
  const cancelCB = useCallback(() => {
    setConfirm(false);
  }, []);

  const confirmCB = useCallback(() => {
    setConfirm(true);
  }, []);

  const [shareId, setShareId] = useState<string>();
  const socket = useRef<WebSocket>();

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

    const xObj = fileData.reduce<FilledSheetData[]>(
      (acc, el) => (el.sheet ? [...acc, el.sheet] : acc),
      []
    );

    const [settingObj] = fileData.reduce<Partial<LocalStorageState>[]>(
      (acc, el) => (el.setting ? [...acc, el.setting] : acc),
      []
    );

    updateDataHandler(xObj, settingObj)
      .then(() => {
        setImportStatus(true);
        setTimeout(closeHandlerCB, 1000);
      })
      .catch(() => {
        setImportStatus(false);
      });
  }, [fileData, updateDataHandler, closeHandlerCB]);

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
                {fileData.find((f) => f.sheet) && (
                  <li>
                    User <strong>Datasets</strong> will be overwritten!
                  </li>
                )}
                {fileData.find((f) => f.setting) && (
                  <li>
                    User <strong>Settings</strong> will be overwritten!
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
          <DataSetFromDragDrop
            data={fileData}
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
