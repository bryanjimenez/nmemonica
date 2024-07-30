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
import {
  ArrowSwitchIcon,
  BlockedIcon,
  CheckCircleIcon,
  CloudOfflineIcon,
  KeyIcon,
  ShieldSlashIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";
import { ReactElement, useCallback, useRef, useState } from "react";

import { SyncDataFile } from "./DataSetExportSync";
import { DataSetKeyInput } from "./DataSetKeyInput";
import { decrypt } from "../../helper/cryptoHelper";
import { RTCChannelStatus, importSignaling } from "../../helper/rtcHelperHttp";
import { type FilledSheetData } from "../../helper/sheetHelperImport";
import { AppSettingState } from "../../slices";
import { readCsvToSheet } from "../../slices/sheetSlice";
import { properCase } from "../Games/KanjiGame";

interface CustomElements extends HTMLFormControlsCollection {
  syncId: HTMLInputElement;
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
  updateDataHandler: (
    importWorkbook?: FilledSheetData[],
    importSettings?: Partial<AppSettingState>
  ) => Promise<void>;
}

export function DataSetImportSync(props: DataSetImportSyncProps) {
  const { visible, close, updateDataHandler, downloadFileHandler } = props;

  const [showKeyInput, setShowKeyInput] = useState(false);
  const showKeyInputCB = useCallback(() => {
    setShowKeyInput(true);
  }, []);
  const closeKeyInputCB = useCallback(() => {
    setShowKeyInput(false);
  }, []);

  const [encryptKey, setEncryptKey] = useState<string>();

  const [destination, setDestination] = useState<"import" | "save">("import");
  const destinationImportCB = useCallback(() => {
    setDestination("import");
  }, []);
  const destinationSaveCB = useCallback(() => {
    setDestination("save");
  }, []);

  const [status, setStatus] = useState<
    "successStatus" | "connectError" | "inputError" | "outputError"
  >();

  const [warning, setWarning] = useState<ReactElement[]>([]);
  const rtc = useRef<RTCDataChannel | null>(null);

  const closeHandlerCB = useCallback(() => {
    setStatus(undefined);
    setWarning([]);
    close();
    if (rtc.current !== null) {
      rtc.current.close();
    }
  }, [close]);

  const importDataSetHandlerCB = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

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

      const form = e.currentTarget.elements;
      if (/*form &&*/ "syncId" in form === false) {
        return;
      }
      const shareId = form.syncId.value;

      if (shareId.length !== 5) {
        setStatus("inputError");
        return;
      }

      importSignaling(encryptKey, shareId)
        .then((channel) => {
          // signaling successful
          // start messaging
          rtc.current = channel;
          setWarning([]);

          channel.onmessage = (msg: { data: ArrayBuffer }) => {
            if (msg.data instanceof ArrayBuffer === false) {
              setStatus("outputError");
              setWarning((w) => [
                ...w,
                <span key={`msg-parse-error`}>{`Failed to parse`}</span>,
              ]);
              return;
            }

            const msgAsText = new TextDecoder("utf-8").decode(msg.data);

            let fileObj;
            try {
              const { payload, iv } = JSON.parse(msgAsText) as {
                payload: string;
                iv: string;
              };

              fileObj = JSON.parse(
                decrypt("aes-192-cbc", encryptKey, iv, payload)
              ) as SyncDataFile[];

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
              let errCode: string | undefined;
              if (err instanceof Error && "cause" in err) {
                const { code } = err.cause as { code?: string };
                errCode = code;
              }

              setWarning((w) => [
                ...w,
                <span key={`msg-parse-error`}>
                  {"Sync Message JSON.parse error" + errCode
                    ? ` [${errCode}]`
                    : ""}
                </span>,
              ]);
              return;
            }

            const { data, settings } = fileObj.reduce(
              (acc, o) => {
                if (o.fileName.toLowerCase().endsWith(".csv")) {
                  const dot = o.fileName.indexOf(".");
                  const sheetName = properCase(
                    o.fileName.slice(0, dot > -1 ? dot : undefined)
                  );

                  const csvFile = readCsvToSheet(o.text, sheetName);

                  return { ...acc, data: [...(acc.data ?? []), csvFile] };
                } else {
                  let s;
                  try {
                    s = JSON.parse(o.text) as Partial<AppSettingState>;
                    // TODO: settings.json verify is LocalStorageState
                    return { ...acc, settings: s };
                  } catch (err) {
                    setStatus("outputError");
                    setWarning((w) => [
                      ...w,
                      <span
                        key={`msg-parse-error`}
                      >{`Failed to parse Settings`}</span>,
                    ]);
                  }
                }
                return acc;
              },
              { data: [] } as {
                data: Promise<FilledSheetData>[];
                settings?: Partial<AppSettingState>;
              }
            );

            Promise.all(data)
              .then((dataObj) => {
                if (destination === "save") {
                  return downloadFileHandler(fileObj).then(() => {
                    setStatus("successStatus");
                    setTimeout(closeHandlerCB, 1000);
                  });
                }

                const d = dataObj.length === 0 ? undefined : dataObj;

                return updateDataHandler(d, settings).then(() => {
                  setStatus("successStatus");
                  setTimeout(closeHandlerCB, 1000);
                  // send receive confirmation
                  channel.send(RTCChannelStatus.Finalized);
                });
              })
              .catch((_err) => {
                setStatus("outputError");
                setWarning((w) => [
                  ...w,
                  <span
                    key={`msg-parse-error`}
                  >{`Failed to parse DataSet`}</span>,
                ]);
              });
          };
        })
        .catch((err) => {
          if (
            err.event_name === "error" &&
            err.payload.error === "Invalid UID"
          ) {
            setWarning((w) => [
              ...w,
              <span
                key={`user-bad-share-id-${shareId}`}
              >{`Incorrect Share-ID`}</span>,
            ]);

            return;
          }

          setStatus("connectError");
        });
    },
    [
      closeHandlerCB,
      downloadFileHandler,
      updateDataHandler,
      destination,
      encryptKey,
      warning,
    ]
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
    <>
      <DataSetKeyInput
        visible={showKeyInput}
        encryptKey={encryptKey}
        enterHandler={setEncryptKey}
        closeHandler={closeKeyInputCB}
      />
      <Dialog
        open={visible === true}
        onClose={closeHandlerCB}
        aria-label="DataSet Sync import"
      >
        <DialogContent>
          <div className="d-flex justify-content-start">
            <div onClick={showKeyInputCB}>
              {encryptKey !== undefined ? <KeyIcon /> : <ShieldSlashIcon />}
            </div>
          </div>
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
                      onChange={destinationImportCB}
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
                      onChange={destinationSaveCB}
                    />
                  }
                  label={<span>Save</span>}
                />
              </RadioGroup>
            </FormControl>
          </div>

          <form onSubmit={importDataSetHandlerCB}>
            <FormControl className="mt-2">
              {warning.length > 0 && (
                <Alert severity="warning" className="py-0 mb-2">
                  <div className="p-0 d-flex flex-column">
                    <ul className="mb-0">
                      {warning.map((el) => (
                        <li key={el.key}>{el}</li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}
              <TextField
                id="syncId"
                error={status?.endsWith("Error")}
                size="small"
                label="Sync ID"
                variant="outlined"
                aria-label="Enter Sync ID"
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
    </>
  );
}
