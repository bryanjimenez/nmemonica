import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { FilledSheetData } from "@nmemonica/snservice";
import {
  AlertIcon,
  CheckCircleIcon,
  DownloadIcon,
} from "@primer/octicons-react";
import { useCallback, useRef, useState } from "react";

import { DataSetFromDragDrop, TransferObject } from "./DataSetFromDragDrop";
import { readCsvToSheet } from "../../slices/sheetSlice";
import "../../css/DragDrop.css";

interface DataSetImportFileProps {
  visible?: boolean;
  close: () => void;
  updateDataHandler: (data: FilledSheetData[]) => Promise<void>;
}

export function DataSetImportFile(props: DataSetImportFileProps) {
  const { visible, close, updateDataHandler } = props;

  const [fileData, setFileData] = useState<TransferObject[]>([]);
  const [importStatus, setImportStatus] = useState<boolean>();

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

    void Promise.all(fileData.map((d) => readCsvToSheet(d.text, d.name)))
      .then((dataObj) => updateDataHandler(dataObj))
      .then(() => {
        setImportStatus(true);
        setTimeout(closeHandlerCB, 1000);
      })
      .catch(() => {
        setImportStatus(false);
      });
  }, [fileData, updateDataHandler, closeHandlerCB]);

  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Dialog
        open={confirm}
        onClose={() => {
          setConfirm(false);
        }}
        aria-label="Confirm file import"
      >
        <DialogContent>
          <Alert severity="warning" className="py-0 mb-1">
            <span>User edited datasets will be overwritten!</span>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={importDatasetCB}>Ok</Button>
          <Button
            onClick={() => {
              setConfirm(false);
            }}
          >
            Cancel
          </Button>
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

          <div className="d-flex justify-content-between">
            <div>{shareId}</div>
            <div className="d-flex">
              <Button
                aria-label="Import Datasets from disk"
                variant="outlined"
                size="small"
                disabled={fileData.length < 1 || importStatus === true}
                onClick={() => {
                  setConfirm(true);
                }}
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
