import React from "react";
import PropTypes from "prop-types";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export function SettingsSwitch(props) {
  const other = { disabled: props.disabled ? true : undefined };

  return (
    <FormControlLabel
      label={props.statusText}
      labelPlacement="start"
      control={
        <Switch
          {...other}
          checked={props.active}
          onChange={() => {
            props.action();
          }}
          color={props.color || "primary"}
          inputProps={{ "aria-label": props.statusText + " checkbox" }}
        />
      }
    />
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
