import React from "react";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  root: {
    minWidth: "unset",
    border: (props) => "0px solid var(" + props.color + ")",
    color: (props) => "var(" + props.color + ")",
  },
});

export function StackButton(props) {
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

StackButton.propTypes = {
  action: PropTypes.func.isRequired,
  color: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
};

export default StackButton;
