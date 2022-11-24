import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { GitCompareIcon } from "@primer/octicons-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faStopCircle,
} from "@fortawesome/free-regular-svg-icons";

/**
 * @typedef {{
 * visible?: boolean,
 * active?: boolean,
 * loop: number,
 * onClick?: function,
 * }} BtnLoopProps
 * @param {BtnLoopProps} props
 */
export function LoopSettingBtn(props) {
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

LoopSettingBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  loop: PropTypes.number,
  onClick: PropTypes.func,
};

/**
 * @typedef {{
 * visible?: boolean,
 * onClick?: function,
 * className?: {[name:string]:boolean},
 * countDown?: number,
 * }} LoopStartBtn
 * @param {LoopStartBtn} props
 */
export function LoopStartBtn(props) {
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
      {props.countDown != undefined && (
        <span className="notification">{props.countDown}</span>
      )}
    </div>
  );
}

LoopStartBtn.propTypes = {
  visible: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.object,
  countDown: PropTypes.number,
};

/**
 * @typedef {{
 * visible?: boolean,
 * onClick?: function,
 * className?: {[name:string]:boolean},
 * }} LoopStopBtn
 * @param {LoopStopBtn} props
 */
export function LoopStopBtn(props) {
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

LoopStopBtn.propTypes = {
  visible: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.object,
};
