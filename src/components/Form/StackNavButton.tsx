import { Button } from "@mui/material";
import React from "react";
import "../../css/StackNavButton.css";

interface StackNavButtonProps {
  action: React.MouseEventHandler;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "error"
    | "inherit";
  ariaLabel: string;
  children: React.JSX.Element;
}

export function StackNavButton(props: StackNavButtonProps) {
  return (
    <Button
      size="small"
      className="MuiButton"
      color={props.color}
      aria-label={props.ariaLabel}
      sx={{
        color: !props.color ? "unset" : undefined,
      }}
      onClick={props.action}
    >
      {props.children}
    </Button>
  );
}

export default StackNavButton;
