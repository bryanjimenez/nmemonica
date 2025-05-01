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
  parseCsvToSheet,
  parseJSONToStudyProgress,
  parseJSONToUserSettings,
} from "../../helper/transferHelper";
import { AppProgressState, AppSettingState } from "../../slices";
import { DataSelectFromFile } from "../Form/DataSelectFromFile";
import "../../css/DragDrop.css";
import { properCase } from "../Games/KanjiGame";

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
    setShareId(undefined);
    setImportStatus(undefined);
    socket.current?.close();
    close();
  }, [close]);

  const importDatasetCB = useCallback(() => {
    setImportStatus(undefined);

    const fileObj = fileData;

    const data = fileObj.filter((file) =>
      file.fileName.toLowerCase().endsWith(".csv")
    );
    const meta = fileObj.filter((file) =>
      file.fileName.toLowerCase().endsWith(".json")
    );

    const { settings, progress } = meta.reduce<{
      settings: Partial<AppSettingState>;
      progress: Partial<AppProgressState>;
    }>(
      (acc, m) => {
        const { fileName, file: text } = m;

        if (
          fileName.toLowerCase() === metaDataNames.settings.file.toLowerCase()
        ) {
          const parsed = parseJSONToUserSettings(text);

          if (parsed instanceof Error) {
            // const { key, msg } = buildMsgCSVError(fileName, parsed);
            // addWarning(key, msg);
            return acc;
          }

          return { ...acc, settings: parsed };
        } else if (
          fileName.toLowerCase() === metaDataNames.progress.file.toLowerCase()
        ) {
          const parsed = parseJSONToStudyProgress(text);

          if (parsed instanceof Error) {
            // const { key, msg } = buildMsgCSVError(fileName, parsed);
            // addWarning(key, msg);

            return acc;
          }

          return { ...acc, progress: parsed };
        }

        return acc;
      },
      { settings: {}, progress: {} }
    );

    void Promise.allSettled(
      data.map((fileItem) =>
        new Promise<SyncDataFile>((resolve) => resolve(fileItem)).then(
          async ({ file: text, fileName }) => {
            try {
              const dot = fileName.indexOf(".");
              const sheetName = properCase(
                fileName.slice(0, dot > -1 ? dot : undefined)
              );

              const sheet = await parseCsvToSheet(text, sheetName);
              return sheet;
            } catch (exception) {
              // default message
              // let key = `${fileName}-parse`;
              // let msg = `Failed to parse (${fileName})`;

              if (exception instanceof Error && "cause" in exception) {
                // ({ key, msg } = buildMsgCSVError(fileName, exception));
              }

              // addWarning(key, msg);
              return undefined;
            }
          }
        )
      )
    )
      .then((sheetPromiseArr) =>
        sheetPromiseArr.reduce<FilledSheetData[]>((acc, r) => {
          if (r.status === "fulfilled" && r.value !== undefined) {
            return [...acc, r.value];
          }

          return acc;
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
