import { Alert, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { PropsWithChildren, ReactElement } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  ariaLabel?: string;
  ariaLabelledby?: string;
}

export default function DialogMsg(props: PropsWithChildren<DialogProps>) {
  const { children, open, onClose, title, ariaLabel, ariaLabelledby } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
    >
      <DialogTitle id="lesson">{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

export function Warnings(props: {
  fileWarning: ReactElement[];
  clearWarnings: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const { fileWarning, clearWarnings } = props;

  return fileWarning.length > 0 ? (
    <Alert
      severity="warning"
      variant="outlined"
      className="py-0 mb-1"
      onClose={() => clearWarnings([])}
    >
      <div className="p-0 d-flex flex-column">{fileWarning}</div>
    </Alert>
  ) : null;
}
