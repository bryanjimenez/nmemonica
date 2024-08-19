import {
  Alert,
  Dialog,
  DialogContent,
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
} from "@mui/material";
import { KeyIcon, PackageIcon, TrashIcon } from "@primer/octicons-react";
import { ReactElement, useCallback, useMemo, useRef, useState } from "react";

import {
  AES256GCMStringKeyLength,
  generateAES256GCMKey,
} from "../../helper/cryptoHelper";

import "../../css/DataSetKeyInput.css";

interface CustomElements extends HTMLFormControlsCollection {
  syncEncryptKey: HTMLInputElement;
}
interface CustomForm extends HTMLFormElement {
  elements: CustomElements;
}

interface DataSetKeyInputProps {
  visible?: boolean;
  generate?: boolean;
  encryptKey?: string;
  enterHandler: (key?: string) => void;
  closeHandler: () => void;
}

export function DataSetKeyInput(props: DataSetKeyInputProps) {
  const { visible, encryptKey, generate, enterHandler, closeHandler } = props;

  const text = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<ReactElement[]>([]);

  const enterkeyCB = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.currentTarget.elements;
      if ("syncEncryptKey" in form) {
        const syncEncryptKey = form.syncEncryptKey.value;
        if (syncEncryptKey.length !== AES256GCMStringKeyLength) {
          setWarning([
            <span
              key={`encrypt-key-length`}
            >{`Encrypt key requires ${AES256GCMStringKeyLength} characters`}</span>,
          ]);
          return;
        }
        enterHandler(syncEncryptKey !== "" ? syncEncryptKey : undefined);
        setWarning([]);
        closeHandler();
      }
    },
    [enterHandler, closeHandler]
  );

  const clearKeyCB = useCallback(() => {
    enterHandler(undefined);
    setWarning([]);
    const t = document.getElementById(
      "syncEncryptKey"
    ) as HTMLInputElement | null;
    if (t !== null) t.value = "";
  }, [enterHandler]);

  const generateKeyCB = useCallback(() => {
    const key = generateAES256GCMKey();
    enterHandler(key);

    setWarning([]);
    const t = document.getElementById(
      "syncEncryptKey"
    ) as HTMLInputElement | null;
    if (t !== null) t.value = key;
  }, [enterHandler]);

  const decoration = useMemo(() => {
    if (generate !== undefined && encryptKey === undefined) {
      return (
        <div className="clickable" onClick={generateKeyCB}>
          <PackageIcon />
        </div>
      );
    } else if (encryptKey?.length === AES256GCMStringKeyLength) {
      return (
        <div className="clickable" onClick={clearKeyCB}>
          <TrashIcon />
        </div>
      );
    } else {
      return <KeyIcon />;
    }
  }, [generate, encryptKey, generateKeyCB, clearKeyCB]);

  return (
    <Dialog
      open={visible === true}
      onClose={closeHandler}
      aria-label="Message encryption key input"
    >
      <DialogContent className="p-2 m-0">
        {warning.length > 0 && (
          <Alert severity="warning" className="py-0 mb-1">
            <div className="p-0 d-flex flex-column">
              <ul className="mb-0">
                {warning.map((el) => (
                  <li key={el.key}>{el}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
        <div
          className="my-1"
          style={{ minWidth: "360px", fontFamily: "monospace" }}
        >
          {/*"key: "+(encryptKey??"")*/}
        </div>
        <form onSubmit={enterkeyCB}>
          <FormControl className="mt-2 w-100">
            <TextField
              id="syncEncryptKey"
              ref={text}
              error={warning.length > 0}
              size="small"
              label="Sync Key"
              variant="outlined"
              aria-label="Enter Sync Encryption Key"
              defaultValue={encryptKey}
              sx={{
                ".MuiInputBase-input": {
                  fontFamily: "Ubuntu Mono",
                  paddingLeft: "1.5em",
                  paddingRight: ".5em",
                },
              }}
              InputProps={{
                // style: {fontFamily: "monospace", minWidth: "360px"},
                startAdornment: (
                  <InputAdornment position="start">{decoration}</InputAdornment>
                ),
              }}
            />
            <FormHelperText>
              <span>End-to-End encryption key</span>
            </FormHelperText>
          </FormControl>
        </form>
      </DialogContent>
    </Dialog>
  );
}
