import {
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
} from "@mui/material";
import { FilledSheetData } from "@nmemonica/snservice";
import { ArrowSwitchIcon } from "@primer/octicons-react";
import { useCallback } from "react";

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

  const termporaryPullCB_TEST = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.currentTarget.elements;

      if (form && "source" in form) {
        const shareId = form.source.value;

        if (shareId.length !== 5) {
          // TODO: display input check error
          return;
        }

        const ws = new WebSocket(syncService);

        ws.addEventListener("open", () => {
          // TODO: other ws.send use eventName also
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
                  close();
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
    [close, updateDataHandler]
  );

  return (
    <DialogMsg open={visible === true} onClose={close} title="">
      <form onSubmit={termporaryPullCB_TEST}>
        <FormControl className="mt-2">
          <TextField
            id="source"
            // error={userInputError}
            size="small"
            label={"Sync ID"}
            variant="outlined"
            aria-label="Enter import ID"
            onChange={() => {}}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ArrowSwitchIcon className="rotate-90" />
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
