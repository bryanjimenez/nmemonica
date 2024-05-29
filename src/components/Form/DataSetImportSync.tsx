import {
  Alert,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Radio,
  RadioGroup,
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

import { SyncDataFile } from "./DataSetExportSync";
import { syncService } from "../../../environment.development";
import { readCsvToSheet } from "../../slices/sheetSlice";

interface CustomElements extends HTMLFormControlsCollection {
  source: HTMLInputElement;
}
interface CustomForm extends HTMLFormElement {
  elements: CustomElements;
}

interface DataSetImportSyncProps {
  visible?: boolean;
  close: () => void;
  downloadFileHandler: (
    files: { fileName: string; text: string }[]
  ) => Promise<void>;
  updateDataHandler: (data: FilledSheetData[]) => Promise<void>;
}

export function DataSetImportSync(props: DataSetImportSyncProps) {
  const { visible, close, updateDataHandler, downloadFileHandler } = props;

  const [destination, setDestination] = useState<"import" | "save">("import");
  const [status, setStatus] = useState<
    "successStatus" | "connectError" | "inputError" | "outputError"
  >();

  const [warning, setWarning] = useState<string>();

  const closeHandlerCB = useCallback(() => {
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

            let fileObj;
            try {
              fileObj = JSON.parse(text) as SyncDataFile[];
              fileObj.forEach((f) => {
                if (!("fileName" in f) || typeof f.fileName !== "string") {
                  throw new Error("Expected filename", {
                    cause: { code: "BadFileName" },
                  });
                }
                if (!("text" in f) || typeof f.text !== "string") {
                  throw new Error("Expected filename", {
                    cause: { code: "BadText" },
                  });
                }
              });
            } catch (err) {
              setStatus("outputError");
              let errCode;
              if (err instanceof Error) {
                const { code } = err.cause as { code?: string };
                errCode = code;
              }
              setWarning("JSON.parse error" + errCode ? ` [${errCode}]` : "");
              return;
            }

            Promise.all(
              fileObj.map(({ fileName, text }) => {
                const sheetName = fileName.slice(0, fileName.indexOf("."));
                return readCsvToSheet(text, sheetName);
              })
            )
              .then((dataObj) => {
                if (destination === "save") {
                  return downloadFileHandler(fileObj).then(() => {
                    setStatus("successStatus");
                    setTimeout(closeHandlerCB, 1000);
                  });
                }

                return updateDataHandler(dataObj).then(() => {
                  setStatus("successStatus");
                  setTimeout(closeHandlerCB, 1000);
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
    [destination, closeHandlerCB, downloadFileHandler, updateDataHandler]
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
    <Dialog
      open={visible === true}
      onClose={closeHandlerCB}
      aria-label="DataSet Sync import"
    >
      <DialogContent>
        <div className="d-flex justify-content-between">
          <span className="pt-2">Destination:</span>
          <FormControl>
            <RadioGroup row aria-labelledby="Import destination">
              <FormControlLabel
                className="m-0"
                value="Import"
                control={
                  <Radio
                    //@ts-expect-error size=sm
                    size="sm"
                    checked={destination === "import"}
                    onChange={() => {
                      setDestination("import");
                    }}
                  />
                }
                label={<span>Import</span>}
              />
              <FormControlLabel
                className="m-0"
                value="Save to file"
                control={
                  <Radio
                    //@ts-expect-error size=sm
                    size="sm"
                    checked={destination === "save"}
                    onChange={() => {
                      setDestination("save");
                    }}
                  />
                }
                label={<span>Save</span>}
              />
            </RadioGroup>
          </FormControl>
        </div>

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
            <FormHelperText>
              {destination === "import" ? (
                <span>
                  Import and <strong>overwrite</strong> local data{" "}
                  <strong>!</strong>
                </span>
              ) : (
                <span>Save to file system</span>
              )}
            </FormHelperText>
          </FormControl>
        </form>
      </DialogContent>
    </Dialog>
  );
}
