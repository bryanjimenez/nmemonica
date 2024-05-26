import {
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
  updateDataHandler: (data: FilledSheetData[]) => Promise<void>;
}

export function DataSetSyncImport(props: DataSetSyncImportProps) {
  const { visible, close, updateDataHandler } = props;

  const [status, setStatus] = useState<
    "successStatus" | "connectError" | "inputError"
  >();

  const closeCB = useCallback(() => {
    setStatus(undefined);
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
              // TODO: display unparsable error
              // eslint-disable-next-line
              console.log("failed to parse");
              return;
            }

            if (hasErr.error !== undefined) {
              // TODO: display incoming sync error
              // eslint-disable-next-line
              console.log(msgData);
            }
            return;
          }

          void msgData.arrayBuffer().then((buff) => {
            const text = new TextDecoder("utf-8").decode(buff);

            let jsonObj;
            try {
              jsonObj = JSON.parse(text) as { name: string; text: string }[];
            } catch (err) {
              // TODO: display json.parse error
              // eslint-disable-next-line
              console.log("JSON.parse error");
              // eslint-disable-next-line
              console.log(err);
              return;
            }

            Promise.all(
              jsonObj.map(({ name, text }) => readCsvToSheet(text, name))
            )
              .then((dataObj) =>
                updateDataHandler(dataObj).then(() => {
                  setStatus("successStatus");
                  setTimeout(closeCB, 1000);
                })
              )
              .catch(() => {
                // TODO: display csv parse error
                // eslint-disable-next-line
                console.log("csv parse error");
              });
          });
        });
      }
    },
    [closeCB, updateDataHandler]
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
