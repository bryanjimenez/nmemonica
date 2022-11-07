import React from "react";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import StackNavButton from "./StackNavButton";

/**
 * @typedef {{
 * prev: function,
 * next: function,
 * color?: string,
 * children?: JSX.Element,
 * }} MinimalUIProps
 * @param {MinimalUIProps} props
 */
export function MinimalUI(props) {
  const color = props.color ? { color: props.color } : { color: "--bs-red" };
  return (
    <div className="d-flex justify-content-between h-100">
      <StackNavButton
        {...color}
        ariaLabel="Previous"
        action={/** @type {React.MouseEventHandler} */ (props.prev)}
      >
        <ChevronLeftIcon size={16} />
      </StackNavButton>
      {props.children}
      <StackNavButton
        {...color}
        ariaLabel="Next"
        action={/** @type {React.MouseEventHandler} */ (props.next)}
      >
        <ChevronRightIcon size={16} />
      </StackNavButton>
    </div>
  );
}

MinimalUI.propTypes = {
  prev: PropTypes.func,
  next: PropTypes.func,
  color: PropTypes.string,
  children: PropTypes.object,
};
