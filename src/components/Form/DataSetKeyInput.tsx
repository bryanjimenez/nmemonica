import {
  Dialog,
  DialogContent,
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
} from "@mui/material";
import { KeyIcon } from "@primer/octicons-react";
import { useCallback } from "react";

interface CustomElements extends HTMLFormControlsCollection {
  syncEncryptKey: HTMLInputElement;
}
interface CustomForm extends HTMLFormElement {
  elements: CustomElements;
}

interface DataSetKeyInputProps {
  visible?: boolean;
  encryptKey?: string;
  enterHandler: (key?: string) => void;
  closeHandler: () => void;
}

export function DataSetKeyInput(props: DataSetKeyInputProps) {
  const { visible, encryptKey, enterHandler, closeHandler } = props;

  const enterkeyCB = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.currentTarget.elements;
      if (form && "syncEncryptKey" in form) {
        const syncEncryptKey = form.syncEncryptKey.value;
        enterHandler(syncEncryptKey !== "" ? syncEncryptKey : undefined);
        closeHandler();
      }
    },
    [closeHandler, enterHandler]
  );

  return (
    <Dialog
      open={visible === true}
      onClose={closeHandler}
      aria-label="Message encryption key input"
      fullWidth={true}
    >
      <DialogContent className="p-2 m-0">
        <form onSubmit={enterkeyCB}>
          <FormControl className="mt-2 w-100">
            <TextField
              id="syncEncryptKey"
              // error={status?.endsWith("Error")}
              size="small"
              label="Sync Encryption Key"
              variant="outlined"
              aria-label="Enter Sync Encryption Key"
              defaultValue={encryptKey}
              fullWidth={true}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon />
                  </InputAdornment>
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
