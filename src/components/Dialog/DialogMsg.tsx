import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { PropsWithChildren } from "react";

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
