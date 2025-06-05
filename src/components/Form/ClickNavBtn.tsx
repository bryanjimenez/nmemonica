import { Button } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";

import { useConnectSetting } from "../../hooks/useConnectSettings";
import "../../css/ClickNavBtn.css";

interface ClickNavProps {
  direction: "next" | "previous";
  action: () => void;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "error"
    | "inherit";
}

export default function ClickNavBtn(props: ClickNavProps) {
  const { swipeThreshold } = useConnectSetting();

  const hidden = swipeThreshold > 0;
  const { direction, action } = props;

  const btnEl =
    direction === "next" ? (
      <ChevronRightIcon size={16} />
    ) : (
      <ChevronLeftIcon size={16} />
    );
  const ariaLabel = direction === "next" ? "Next" : "Previous";
  return hidden ? (
    <div />
  ) : (
    <Button
      size="small"
      className="MuiButton"
      color={props.color}
      aria-label={ariaLabel}
      sx={{
        color: !props.color ? "unset" : undefined,
      }}
      onClick={action}
    >
      {btnEl}
    </Button>
  );
}
