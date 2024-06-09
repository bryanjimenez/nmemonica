import {
  faPlayCircle,
  faStopCircle,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GitCompareIcon } from "@primer/octicons-react";
import classNames from "classnames";
import React from "react";

interface BtnLoopProps {
  visible?: boolean;
  active?: boolean;
  loop: number;
  onClick?: () => void;
}

export function LoopSettingBtn(props: BtnLoopProps) {
  return props.visible ? null : (
    <div
      className="loop-btn loop-setting-btn clickable"
      aria-label="Loop repeat settings button"
      onClick={() => {
        if (props.onClick && typeof props.onClick === "function")
          props.onClick();
      }}
    >
      <GitCompareIcon
        className={classNames({
          "rotate-135": true,
          "disabled-color": !props.active,
        })}
        size="small"
      />
      {props.active && <span className="notification">{props.loop}</span>}
    </div>
  );
}

interface LoopStartBtn {
  visible?: boolean;
  onClick?: () => void;
  className?: { [name: string]: boolean };
  countDown?: number;
}

export function LoopStartBtn(props: LoopStartBtn) {
  const { className } = props;
  return props.visible ? null : (
    <div
      className={classNames({
        "loop-btn loop-start-btn clickable": true,
        ...(className || {}),
      })}
      aria-label="Loop start button"
    >
      <FontAwesomeIcon
        size="sm"
        onClick={() => {
          if (props.onClick && typeof props.onClick === "function")
            props.onClick();
        }}
        icon={faPlayCircle}
      />
      {props.countDown !== undefined && (
        <span className="notification">{props.countDown}</span>
      )}
    </div>
  );
}

interface LoopStopBtn {
  visible?: boolean;
  onClick?: () => void;
  className?: { [name: string]: boolean };
}

export function LoopStopBtn(props: LoopStopBtn) {
  const { className } = props;
  return props.visible ? null : (
    <div
      className={classNames({
        "loop-btn loop-stop-btn clickable": true,
        ...(className || {}),
      })}
      aria-label="Loop stop button"
    >
      <FontAwesomeIcon
        size="sm"
        onClick={() => {
          if (props.onClick && typeof props.onClick === "function")
            props.onClick();
        }}
        icon={faStopCircle}
      />
    </div>
  );
}
