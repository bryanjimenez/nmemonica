import React from "react";
import PropTypes from "prop-types";
import { Button } from "@mui/material";
import "./StackNavButton.css";

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

StackNavButton.propTypes = {
  action: PropTypes.func.isRequired,
  color: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
};

export default StackNavButton;
