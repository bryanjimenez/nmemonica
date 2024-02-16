import { Switch } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import "../../css/SettingsSwitch.css";

interface SettingsSwitchProps {
  active: boolean;
  action: () => void;
  statusText: string;
  color?: "primary" | "secondary" | "default" | undefined;
  disabled?: boolean;
}

export function SettingsSwitch(props: SettingsSwitchProps) {
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
