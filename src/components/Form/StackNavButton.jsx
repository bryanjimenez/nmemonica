import React from "react";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

/**
 * @typedef {{
 * action:  React.MouseEventHandler,
 * color: string,
 * ariaLabel: string,
 * children: JSX.Element}} StackNavButtonProps
 */

const useStyles = makeStyles({
  root: {
    minWidth: "unset",
    border: "0",
    color: (/** @type {StackNavButtonProps} */ props) =>
      "var(" + props.color + ")",
  },
});

/**
 * @param {StackNavButtonProps} props
 */
export function StackNavButton(props) {
  const classes = useStyles(props);

  return (
    <Button
      variant="outlined"
      className={classes.root}
      size="small"
      aria-label={props.ariaLabel}
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
