import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { GitCompareIcon } from "@primer/octicons-react";

/**
 * @typedef {{
 * visible?: boolean,
 * active?: boolean,
 * loop: number,
 * onClick?: function,
 * }} BtnLoopProps
 */

/**
 * @param {BtnLoopProps} props
 */
export default function BtnLoop(props) {
  return props.visible ? null : (
    <div
      onClick={() => {
        if (props.onClick && typeof props.onClick === "function")
          props.onClick();
      }}
    >
      <GitCompareIcon
        className={classNames({
          "clickable rotate-135": true,
          "disabled-color": !props.active,
        })}
        size="small"
        aria-label="loop"
      />
      {props.active && <span className="notification">{props.loop}</span>}
    </div>
  );
}

BtnLoop.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  loop: PropTypes.number,
  onClick: PropTypes.func,
};
