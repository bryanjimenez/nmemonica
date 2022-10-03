import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { GiftIcon } from "@primer/octicons-react";

/**
 * @typedef {{
 * visible: boolean,
 * active: boolean,
 * setState: (state:{showHint:boolean})=>void }} BtnShowHintProps
 */

/**
 * @param {BtnShowHintProps} props
 */
export function BtnShowHint(props) {
  const active = props.active;
  const parentSetState = props.setState;

  return !props.visible ? null : (
    <div
      className="sm-icon-grp"
      onClick={
        active
          ? () => {
              parentSetState({ showHint: true });
              setTimeout(() => {
                parentSetState({ showHint: false });
              }, 1500);
            }
          : undefined
      }
    >
      <GiftIcon
        className={classNames({
          clickable: active,
          "disabled disabled-color": !active,
        })}
        size="small"
        aria-label={active ? "hint" : "hint unavailable"}
      />
    </div>
  );
}

BtnShowHint.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  setState: PropTypes.func,
};
