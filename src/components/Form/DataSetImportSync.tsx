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

import { DataSetKeyInput } from "./DataSetKeyInput";
import { type FilledSheetData } from "../../helper/sheetHelperImport";
import { useDataSetImportSync } from "../../hooks/useDataSetImportSync";
import { AppSettingState } from "../../slices";

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

  const clearWarningCB = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === "") {
        setStatus(undefined);
      }
    },
    []
  );

  const saveToFileHandlerWStatus = useCallback(
    (
      files: {
        fileName: string;
        text: string;
      }[]
    ) =>
      downloadFileHandler(files).then(() => {
        setStatus("successStatus");
        setTimeout(closeHandlerCB, 1000);
      }),
    [downloadFileHandler, setStatus, closeHandlerCB]
  );

  const updateDataHandlerWStatus = useCallback(
    (
      importWorkbook?: FilledSheetData[] | undefined,
      importSettings?: Partial<AppSettingState> | undefined
    ) =>
      updateDataHandler(importWorkbook, importSettings).then(() => {
        setStatus("successStatus");
        setTimeout(closeHandlerCB, 1000);
      }),
    [updateDataHandler, setStatus, closeHandlerCB]
  );

  const addWarning = useCallback(
    (warnKey?: string, warnMsg?: string) => {
      if (warnKey === undefined && warnMsg === undefined) {
        setWarning([]);
        return;
      }

      if (warning.find((w) => w.key === warnKey) === undefined) {
        setWarning((w) => [...w, <span key={warnKey}>{warnMsg}</span>]);
      }
    },
    [warning, setWarning]
  );

  const { importDataSetHandlerCB } = useDataSetImportSync(
    rtc,
    encryptKey,
    destination,
    addWarning,
    setStatus,
    saveToFileHandlerWStatus,
    updateDataHandlerWStatus
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
                      size="small"
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
                      size="small"
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
