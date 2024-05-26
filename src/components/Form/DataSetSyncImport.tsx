import {
  Alert,
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
} from "@mui/material";
import { FilledSheetData } from "@nmemonica/snservice";
import {
  ArrowSwitchIcon,
  BlockedIcon,
  CheckCircleIcon,
  CloudOfflineIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";
import { useCallback, useState } from "react";

import DialogMsg from "./DialogMsg";
import { syncService } from "../../../environment.development";
import { readCsvToSheet } from "../../slices/sheetSlice";

interface CustomElements extends HTMLFormControlsCollection {
  source: HTMLInputElement;
}
interface CustomForm extends HTMLFormElement {
  elements: CustomElements;
}

interface DataSetSyncImportProps {
  visible?: boolean;
  close: () => void;
  downloadFileHandler: (
    files: { name: string; text: string }[]
  ) => Promise<void>;
  updateDataHandler: (data: FilledSheetData[]) => Promise<void>;
}

export function DataSetSyncImport(props: DataSetSyncImportProps) {
  const { visible, close, updateDataHandler, downloadFileHandler } = props;

  const [status, setStatus] = useState<
    "successStatus" | "connectError" | "inputError" | "outputError"
  >();

  const [warning, setWarning] = useState<string>();

  const closeCB = useCallback(() => {
    setStatus(undefined);
    setWarning(undefined);
    close();
  }, [close]);

  const importFromSyncCB = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.currentTarget.elements;

      if (form && "source" in form) {
        const shareId = form.source.value;

        if (shareId.length !== 5) {
          setStatus("inputError");
          return;
        }

        const ws = new WebSocket(syncService);

        ws.addEventListener("error", () => {
          setStatus("connectError");
        });

        ws.addEventListener("open", () => {
          ws.send(
            JSON.stringify({
              eventName: "pull",
              payload: { uid: shareId },
            })
          );
        });

        ws.addEventListener("message", (msg: MessageEvent<Blob | string>) => {
          const { data: msgData } = msg;

          ws.close();

          if (msgData instanceof Blob === false) {
            let hasErr: { error?: string };
            try {
              hasErr = JSON.parse(msgData) as typeof hasErr;
            } catch (_err) {
              setStatus("outputError");
              setWarning("failed to parse");
              return;
            }

            if (hasErr.error !== undefined) {
              setStatus("outputError");
              setWarning(hasErr.error ?? msgData.toString());
            }
            return;
          }

          void msgData.arrayBuffer().then((buff) => {
            const text = new TextDecoder("utf-8").decode(buff);

            let jsonObj;
            try {
              jsonObj = JSON.parse(text) as { name: string; text: string }[];
            } catch (_err) {
              setStatus("outputError");
              setWarning("JSON.parse error");
              return;
            }

            Promise.all(
              jsonObj.map(({ name, text }) => readCsvToSheet(text, name))
            )
              .then((dataObj) => {
                if (
                  !confirm(
                    "User edited datasets will be overwritten [cancel: Download]"
                  )
                ) {
                  return downloadFileHandler(jsonObj).then(() => {
                    setStatus("successStatus");
                    setTimeout(closeCB, 1000);
                  });
                }

                return updateDataHandler(dataObj).then(() => {
                  setStatus("successStatus");
                  setTimeout(closeCB, 1000);
                });
              })
              .catch(() => {
                setStatus("outputError");
                setWarning("csv parse error");
              });
          });
        });
      }
    },
    [closeCB, downloadFileHandler, updateDataHandler]
  );

  const clearWarningCB = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === "") {
        setStatus(undefined);
      }
    },
    []
  );

  return (
    <DialogMsg open={visible === true} onClose={close} title="">
      <form onSubmit={importFromSyncCB}>
        <FormControl className="mt-2">
          {warning && (
            <Alert severity="warning" className="py-0 mb-1">
              <span className="p-0">{warning}</span>
            </Alert>
          )}
          <TextField
            id="source"
            error={status?.endsWith("Error")}
            size="small"
            label="Sync ID"
            variant="outlined"
            aria-label="Enter import ID"
            onChange={clearWarningCB}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {status === "connectError" && <CloudOfflineIcon />}
                  {status === "inputError" && <BlockedIcon />}
                  {status === "outputError" && (
                    <XCircleFillIcon className="incorrect-color" />
                  )}
                  {status === "successStatus" && (
                    <CheckCircleIcon className="correct-color" />
                  )}
                  {status === undefined && (
                    <ArrowSwitchIcon className="rotate-90" />
                  )}
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>Import and overwrite local data !</FormHelperText>
        </FormControl>
      </form>
    </DialogMsg>
  );
}
