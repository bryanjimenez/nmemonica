import React from "react";
import PropTypes from "prop-types";
import { Switch } from "@mui/material";
import classNames from "classnames";
import "./SettingsSwitch.css";

/**
 * @typedef {{
 * active: boolean,
 * action: function,
 * statusText: string,
 * color?: "primary"|"secondary"|"default"|undefined,
 * disabled?: boolean}} SettingsSwitchProps
 */

/**
 * @param {SettingsSwitchProps} props
 */
export function SettingsSwitch(props) {
  const other = { disabled: props.disabled ? true : undefined };

  return (
    <div className="settings-switch-root">
      <p className={classNames({ "disabled-color": other.disabled })}>
        {props.statusText}
      </p>
      <Switch
        {...other}
        checked={props.active}
        onChange={() => props.action()}
        color={props.color || "primary"}
        inputProps={{ "aria-label": props.statusText + " checkbox" }}
      />
    </div>
  );
}

SettingsSwitch.propTypes = {
  active: PropTypes.bool,
  action: PropTypes.func.isRequired,
  statusText: PropTypes.string.isRequired,
  color: PropTypes.string,
  disabled: PropTypes.bool,
};

export default SettingsSwitch;
